# Web 端头像同步实现：GitHub 头像上传到 R2 并在个人中心展示

## 背景

在支持 GitHub 登录以后，用户授权成功时，GitHub 会返回一份用户资料。这里面不仅有 GitHub ID、用户名、邮箱，也包含用户头像地址 `avatar_url`。

一开始我们只保存了 GitHub 账号绑定关系，没有处理 `avatar_url`。结果就是：用户明明是通过 GitHub 登录的，但进入个人中心以后，页面仍然只能显示姓名首字母占位，而不是 GitHub 头像。

正确的逻辑应该是：

1. 用户完成 GitHub 授权。
2. 后端拿到 GitHub 用户资料。
3. 如果当前系统用户还没有头像，就下载 GitHub 头像。
4. 把头像上传到 R2。
5. 把 R2 文件 key 保存到用户资料里。
6. 个人中心根据 `avatarKey` 从 R2 读取头像并展示。

这篇文章会按真实代码实现，把这条链路完整讲清楚。

---

## 为什么不直接使用 GitHub 头像 URL

最简单的做法是把 GitHub 返回的 `avatar_url` 直接保存下来，然后前端 `<img src={avatarUrl} />` 展示。

但这样会有几个问题：

1. **资源不归自己控制**：头像是否可访问、是否变更、是否被 GitHub 限制，都不由系统决定。
2. **缓存策略不可控**：我们无法统一设置自己的缓存、访问权限和文件生命周期。
3. **数据形态不统一**：系统内其他头像可能来自用户上传或默认头像，如果 GitHub 头像直接用外链，头像来源会变得混乱。
4. **后续权限不好管**：个人中心头像属于用户资料的一部分，最好统一从自己的头像服务读取。

所以更稳妥的方式是：GitHub 头像只作为授权时的一次性来源。系统拿到以后，把它上传到自己的 R2 存储，再保存 R2 key。

---

## 整体流程

头像同步发生在 GitHub OAuth callback 阶段。

```txt
用户点击 GitHub 登录
        ↓
跳转到 GitHub 授权页
        ↓
GitHub 回调 API callback
        ↓
后端用 code 换 access token
        ↓
后端读取 GitHub 用户资料和邮箱
        ↓
创建或绑定系统用户
        ↓
如果系统用户没有 avatarKey，下载 GitHub avatar_url
        ↓
校验图片格式和大小
        ↓
上传图片到 R2
        ↓
更新 users.avatar_key
        ↓
生成 OAuth 登录 ticket
        ↓
前端换取系统登录态
        ↓
个人中心读取 profile.avatarKey 并展示头像
```

这里要注意一点：头像同步不是登录的核心条件。头像同步失败时，登录不应该失败。否则 GitHub 头像网络抖动、格式异常、R2 临时失败，都可能让用户无法登录。

所以我们的实现是：头像同步失败只记录日志，不阻断 OAuth 登录流程。

---

## 数据设计

用户表里已经有头像字段：

```ts
// apps/api/src/db/schema.ts
avatarKey: text('avatar_key')
```

这个字段不保存完整图片 URL，而是保存 R2 中的对象 key，例如：

```txt
avatars/users/{userId}/{timestamp}-{uuid}.jpg
```

这样做的好处是：

1. 数据库只保存资源标识，不关心资源域名。
2. API 可以根据 key 去 R2 读取对象。
3. 以后如果更换 CDN、域名或存储策略，数据库结构不用变。

---

## 第一步：接住 GitHub 返回的头像字段

GitHub 用户资料接口会返回 `avatar_url`。所以后端类型里需要声明这个字段。

```ts
// apps/api/src/auth/services/web-github-oauth.ts
type GithubUser = {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string | null
}
```

如果类型里没有 `avatar_url`，后面的同步逻辑就没有数据来源。

读取 GitHub 用户资料的代码仍然复用原来的 JSON 请求函数：

```ts
const [githubUser, githubEmails] = await Promise.all([
  fetchGithubJson<GithubUser>(githubUserUrl, accessToken),
  fetchGithubJson<GithubEmail[]>(githubUserEmailsUrl, accessToken),
])
```

这里同时读取用户资料和邮箱。用户资料提供 `avatar_url`，邮箱用于找到或创建系统用户。

---

## 第二步：创建或绑定系统用户

头像同步必须在系统用户已经确定以后执行。原因很简单：上传到 R2 的 key 里需要用到 `userId`。

当前代码先根据 GitHub 信息解析系统用户：

```ts
const email = pickVerifiedGithubEmail(githubUser, githubEmails)
const userId = await resolveGithubWebUser({ c, githubUser, email })
```

`resolveGithubWebUser` 负责处理三种情况：

1. 这个 GitHub 账号已经绑定过系统用户：直接返回已有用户 ID。
2. 这个邮箱已经存在系统用户：把 GitHub 账号绑定到这个用户。
3. 这是一个新用户：创建用户、邮箱、OAuth 账号关系和 web 用户角色。

只有拿到 `userId` 以后，才进入头像同步。

```ts
await syncGithubAvatarIfMissing({
  c,
  userId,
  avatarUrl: githubUser.avatar_url,
})
```

这一步放在创建登录 ticket 之前。头像同步成功后，用户进入个人中心就能读到新的 `avatarKey`。

---

## 第三步：只在用户没有头像时同步

头像同步不能每次登录都覆盖。用户可能已经上传过自己的头像，这时再用 GitHub 头像覆盖就不合理了。

所以同步函数第一步是读取当前 profile。

```ts
const db = getDb(c.env.DB)
const profile = await findUserProfileById(db, userId)

if (!profile || profile.avatarKey) {
  return
}
```

这里有两个判断：

1. 如果用户资料不存在，直接跳过。
2. 如果用户已经有 `avatarKey`，直接跳过。

这就保证了 GitHub 头像只作为“默认头像来源”。一旦用户已有头像，系统不会擅自覆盖。

---

## 第四步：下载 GitHub 头像

确认用户没有头像以后，后端去下载 GitHub 的头像文件。

```ts
const response = await fetch(avatarUrl, {
  headers: {
    accept: 'image/jpeg,image/png,image/webp',
    'user-agent': 'ai-agent-web',
  },
})

if (!response.ok) {
  return
}
```

这里设置了两个 header：

1. `accept` 表示我们只期望拿到常见图片格式。
2. `user-agent` 给远端服务一个明确的请求来源。

然后读取响应里的 `content-type`：

```ts
const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()

if (!contentType) {
  return
}
```

`content-type` 可能带参数，比如：

```txt
image/jpeg; charset=utf-8
```

所以这里用 `split(';')[0]` 取出真正的 MIME 类型。

---

## 第五步：复用已有头像校验规则

项目里已经有头像存储工具：

```ts
// apps/api/src/lib/avatar-storage.ts
const avatarExtensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function assertAvatarFile(file: File) {
  const extension = avatarExtensionByMimeType[file.type]

  if (!extension) {
    throw new AppError(
      BizCode.COMMON_INVALID_REQUEST,
      'Avatar must be a JPG, PNG, or WebP image',
      400,
    )
  }

  if (file.size <= 0) {
    throw new AppError(
      BizCode.COMMON_INVALID_REQUEST,
      'Avatar file is empty',
      400,
    )
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new AppError(
      BizCode.COMMON_INVALID_REQUEST,
      'Avatar file must be 2MB or smaller',
      400,
    )
  }

  return extension
}
```

这段逻辑限制了头像必须是 JPG、PNG 或 WebP，并且大小不能超过 2MB。

GitHub 头像虽然是远程下载的，但我们仍然应该走同一套校验规则。这样用户上传头像和 OAuth 自动同步头像就不会出现两套标准。

```ts
const avatarBytes = await response.arrayBuffer()
const avatarFile = new File([avatarBytes], 'github-avatar', { type: contentType })
const extension = assertAvatarFile(avatarFile)
const nowMs = Date.now()
const avatarKey = buildUserAvatarKey(userId, avatarFile, nowMs)
```

这里先把远程图片内容转成 `File`，再交给 `assertAvatarFile` 和 `buildUserAvatarKey`。

生成出来的 R2 key 类似：

```txt
avatars/users/018f.../1710000000000-018f....jpg
```

---

## 第六步：上传头像到 R2

头像校验通过后，就可以写入 R2。

```ts
await c.env.AVATAR_BUCKET.put(avatarKey, avatarBytes, {
  httpMetadata: {
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
    contentDisposition: `inline; filename="github-avatar.${extension}"`,
  },
})
```

这里用到的是 Cloudflare R2 binding：

```ts
c.env.AVATAR_BUCKET
```

上传时顺便写入 HTTP metadata：

1. `contentType`：告诉浏览器这是图片。
2. `cacheControl`：头像文件 key 每次都是唯一的，所以可以长期缓存。
3. `contentDisposition`：让头像以 inline 图片方式展示，而不是下载文件。

上传成功后，再更新数据库里的头像 key。

```ts
await updateUserAvatarKey({
  db,
  userId,
  avatarKey,
  updatedAtMs: nowMs,
})
```

到这里，头像同步的后端存储部分就完成了。

---

## 完整后端同步函数

完整代码如下：

```ts
// apps/api/src/auth/services/web-github-oauth.ts
async function syncGithubAvatarIfMissing(params: {
  c: Context<{ Bindings: ApiBindings }>
  userId: string
  avatarUrl: string | null
}) {
  const { c, userId, avatarUrl } = params

  if (!avatarUrl) {
    return
  }

  const db = getDb(c.env.DB)
  const profile = await findUserProfileById(db, userId)

  if (!profile || profile.avatarKey) {
    return
  }

  try {
    const response = await fetch(avatarUrl, {
      headers: {
        accept: 'image/jpeg,image/png,image/webp',
        'user-agent': 'ai-agent-web',
      },
    })

    if (!response.ok) {
      return
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()

    if (!contentType) {
      return
    }

    const avatarBytes = await response.arrayBuffer()
    const avatarFile = new File([avatarBytes], 'github-avatar', { type: contentType })
    const extension = assertAvatarFile(avatarFile)
    const nowMs = Date.now()
    const avatarKey = buildUserAvatarKey(userId, avatarFile, nowMs)

    await c.env.AVATAR_BUCKET.put(avatarKey, avatarBytes, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
        contentDisposition: `inline; filename="github-avatar.${extension}"`,
      },
    })

    await updateUserAvatarKey({
      db,
      userId,
      avatarKey,
      updatedAtMs: nowMs,
    })
  } catch (error) {
    console.warn('Unable to sync GitHub avatar', error)
  }
}
```

这里最重要的设计点是 `try/catch`。头像同步是一个增强体验的动作，不是登录成功的必要条件。所以失败时只打印日志，不让 OAuth 登录失败。

---

## 第七步：头像读取接口支持 web 用户

头像上传到 R2 以后，前端还要能读取它。

原来的头像读取接口只允许 admin 访问，这会导致 web 个人中心拿不到头像。我们需要让 web 用户读取自己的头像。

```ts
// apps/api/src/routes/user/profile.route.ts
userRoute.get('/avatar', async (c) => {
  const claims = await requireProfileAccessToken(c)

  const key = c.req.query('key')?.trim()

  if (!key) {
    throw new AppError(BizCode.COMMON_INVALID_REQUEST, 'Avatar key is required', 400)
  }

  const db = getDb(c.env.DB)

  if (claims.app === 'web') {
    const profile = await findUserProfileById(db, claims.sub)

    if (!profile || profile.avatarKey !== key) {
      throw new AppError(BizCode.AUTH_FORBIDDEN, 'Avatar access is forbidden', 403)
    }
  }

  const object = await c.env.AVATAR_BUCKET.get(key)

  if (!object) {
    throw new AppError(BizCode.COMMON_NOT_FOUND, 'Avatar is not found', 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, {
    headers,
  })
})
```

这里的权限设计是：

1. admin 用户可以读取头像资源，用于管理端展示。
2. web 用户只能读取自己 profile 上绑定的头像 key。

这样既能让个人中心正常展示头像，又不会把所有头像资源直接开放给任意 web 用户读取。

---

## 第八步：前端为什么不能直接用 img src

个人中心要展示头像，直觉上可能会这样写：

```tsx
<img src="/rpc/user/avatar?key=xxx" />
```

但这里有一个问题：头像接口需要登录态，需要 `Authorization` 请求头。

普通的 `<img src>` 请求无法像 axios 请求那样自动附带 Bearer token。因此我们不能直接把接口地址放进 `img src`。

正确做法是：

1. 用前端 HTTP 模块发起带 token 的请求。
2. 把接口返回值当成 `Blob`。
3. 使用 `URL.createObjectURL(blob)` 生成浏览器临时图片地址。
4. 把这个临时地址交给 `<img src>`。
5. 组件卸载时释放 object URL。

---

## 第九步：给 HTTP 模块增加 getRaw

普通业务接口返回的是统一 JSON 结构，但头像接口返回的是图片流。所以 web 端 HTTP 模块需要一个读取原始 blob 的方法。

```ts
// apps/web/src/lib/http.ts
async getRaw(url: string, config?: AxiosRequestConfig): Promise<Blob> {
  const requestConfig = createRequestConfig(url, {
    ...config,
    method: 'GET',
    responseType: 'blob',
  })
  const response = await axios.request<Blob>(requestConfig)

  if (response.status < 200 || response.status >= 300) {
    throw new Error(response.statusText || 'Request failed')
  }

  return response.data
}
```

这里仍然复用 `createRequestConfig`，所以浏览器侧会自动从本地 session 中读取 `accessToken`，并加到请求头里。

这就是头像接口能通过鉴权的关键。

---

## 第十步：生成头像接口 URL

头像 URL 由 R2 key 生成。

```ts
// apps/web/src/lib/avatar-url.ts
import { getWebClientEnv } from '@/env.client'
import { getWebServerEnv } from '@/env.server'

function resolveApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return getWebClientEnv().NEXT_PUBLIC_API_BASE_URL
  }

  return getWebServerEnv().API_BASE_URL
}

export function getAvatarUrl(avatarKey: string | null) {
  if (!avatarKey) {
    return null
  }

  const url = new URL('/rpc/user/avatar', resolveApiBaseUrl())
  url.searchParams.set('key', avatarKey)

  return url.toString()
}
```

这里没有把 API 域名写死，而是从环境变量里读取。这样本地开发、预览环境和线上部署可以使用不同的 API 地址。

---

## 第十一步：封装 UserAvatar 组件

接下来封装一个头像组件。

组件需要处理三种状态：

1. 有 `avatarKey`，并且图片加载成功：显示真实头像。
2. 没有 `avatarKey`：显示首字母占位。
3. 有 `avatarKey`，但图片加载失败：回退到首字母占位。

```tsx
// apps/web/src/components/user-avatar.tsx
"use client"

import { useEffect, useState } from "react"
import type { UserProfileResponse } from "@repo/contracts"

import { getAvatarUrl } from "@/lib/avatar-url"
import { http } from "@/lib/http"

type UserAvatarProps = {
  user: Pick<UserProfileResponse, "name" | "email" | "avatarKey">
  size?: "md" | "lg"
}

const sizeClassNameMap: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  md: "size-10 text-sm",
  lg: "size-16 text-lg",
}

function getFallbackText(user: UserAvatarProps["user"]) {
  const base = user.name.trim() || user.email.trim()

  return base.slice(0, 2).toUpperCase() || "ME"
}

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const avatarUrl = getAvatarUrl(user.avatarKey)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    async function loadAvatar() {
      if (!avatarUrl) {
        setAvatarSrc(null)
        return
      }

      try {
        const blob = await http.getRaw(avatarUrl)
        objectUrl = URL.createObjectURL(blob)

        if (!cancelled) {
          setAvatarSrc(objectUrl)
        }
      } catch {
        if (!cancelled) {
          setAvatarSrc(null)
        }
      }
    }

    void loadAvatar()

    return () => {
      cancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [avatarUrl])

  const className = `${sizeClassNameMap[size]} shrink-0 rounded-2xl border border-slate-200 object-cover`

  if (avatarSrc) {
    return <img alt={`${user.name || user.email} avatar`} className={className} src={avatarSrc} />
  }

  return (
    <span className={`${className} flex items-center justify-center bg-slate-950 font-semibold text-white`}>
      {getFallbackText(user)}
    </span>
  )
}
```

这里有两个容易被忽略的细节。

第一个是 `cancelled`。如果组件已经卸载，但异步请求才返回，这时就不应该再调用 `setAvatarSrc`。

第二个是 `URL.revokeObjectURL(objectUrl)`。`createObjectURL` 生成的是浏览器临时资源地址，用完以后应该释放，避免内存泄漏。

---

## 第十二步：个人中心使用头像组件

最后在个人中心页面里，把原来的首字母占位替换成 `UserAvatar`。

```tsx
// apps/web/app/(dashboard)/profile/page.tsx
import { UserAvatar } from "@/components/user-avatar"

// ...

<UserAvatar user={profile} size="lg" />
```

`profile` 里包含 `name`、`email` 和 `avatarKey`，刚好满足组件需要。

当用户登录后，页面保护组件会读取用户资料。如果 `avatarKey` 已经保存到数据库，个人中心就会自动加载头像。

---

## 关键代码串联

最后把整个链路用几段关键代码串起来。

OAuth callback 中读取 GitHub 用户：

```ts
const [githubUser, githubEmails] = await Promise.all([
  fetchGithubJson<GithubUser>(githubUserUrl, accessToken),
  fetchGithubJson<GithubEmail[]>(githubUserEmailsUrl, accessToken),
])
```

解析系统用户：

```ts
const email = pickVerifiedGithubEmail(githubUser, githubEmails)
const userId = await resolveGithubWebUser({ c, githubUser, email })
```

同步头像：

```ts
await syncGithubAvatarIfMissing({
  c,
  userId,
  avatarUrl: githubUser.avatar_url,
})
```

保存 R2 key：

```ts
await updateUserAvatarKey({
  db,
  userId,
  avatarKey,
  updatedAtMs: nowMs,
})
```

前端读取头像 blob：

```ts
const blob = await http.getRaw(avatarUrl)
const objectUrl = URL.createObjectURL(blob)
setAvatarSrc(objectUrl)
```

页面展示头像：

```tsx
<UserAvatar user={profile} size="lg" />
```

---

## 常见问题

### 1. 已经登录过的用户会立刻有头像吗

不会。

头像同步发生在 GitHub OAuth callback 阶段。也就是说，之前已经通过 GitHub 登录过、但当时没有同步头像的用户，需要再次走一次 GitHub 登录授权回调，才会触发这段逻辑。

如果需要批量修复历史用户，可以单独写一个后台任务或管理端脚本，但这不属于本次登录链路本身。

### 2. 用户已经有头像时会被 GitHub 头像覆盖吗

不会。

同步函数会先检查：

```ts
if (!profile || profile.avatarKey) {
  return
}
```

只要用户已经有 `avatarKey`，就不会下载和覆盖 GitHub 头像。

### 3. GitHub 头像下载失败会导致登录失败吗

不会。

头像同步放在 `try/catch` 中，失败只会打印日志：

```ts
console.warn('Unable to sync GitHub avatar', error)
```

这样可以保证登录主流程稳定。

### 4. 为什么 web 用户不能直接读取任意头像 key

头像属于用户资料的一部分。web 用户只需要读取自己的头像，不应该拿任意 key 读取别人的头像资源。

所以接口里做了校验：

```ts
if (claims.app === 'web') {
  const profile = await findUserProfileById(db, claims.sub)

  if (!profile || profile.avatarKey !== key) {
    throw new AppError(BizCode.AUTH_FORBIDDEN, 'Avatar access is forbidden', 403)
  }
}
```

这可以避免头像资源被越权读取。

### 5. 为什么 `<img src>` 不能直接请求头像接口

因为头像接口需要 Bearer token。普通 `<img src>` 请求不能像 axios 一样自动附带当前登录态里的 `Authorization` 请求头。

所以我们先用 `http.getRaw` 拉取 blob，再用 `URL.createObjectURL` 生成临时图片地址。

---

## 部署检查清单

上线前至少要确认这些配置都存在：

1. GitHub OAuth Client ID 和 Client Secret 已配置。
2. GitHub OAuth callback URL 指向线上 API callback 地址。
3. API 环境中已绑定 R2 bucket，例如 `AVATAR_BUCKET`。
4. web 端 `NEXT_PUBLIC_API_BASE_URL` 指向线上 API 地址。
5. API 端允许 web 用户访问 `/rpc/user/avatar`，但只能读取自己的头像 key。

---

## 总结

头像同步看起来只是一个小功能，但它串起了 OAuth、用户资料、远程图片下载、R2 对象存储、数据库更新、接口鉴权和前端 blob 展示。

这次实现的核心原则是：

1. GitHub 头像只作为默认头像来源，不覆盖用户已有头像。
2. 头像文件统一存到 R2，数据库只保存 `avatarKey`。
3. 头像同步失败不影响登录主流程。
4. web 用户只能读取自己的头像资源。
5. 前端通过带 token 的 blob 请求展示受保护图片。

把这几个边界处理好以后，GitHub 登录后的头像展示就会自然接上，个人中心也能保持统一、可控的头像体系。
