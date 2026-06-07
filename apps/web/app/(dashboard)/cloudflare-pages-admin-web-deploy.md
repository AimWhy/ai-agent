# Cloudflare Pages 部署 Admin / Web 子站实践

这篇文章记录一次真实的前端子站部署过程：把 monorepo 里的 `admin` 和 `web` 两个 Next.js 子站部署到 Cloudflare Pages。

项目结构大致如下：

```txt
ai-agent
├── apps
│   ├── api      # Cloudflare Worker / Hono API
│   ├── admin    # 管理后台 Next.js
│   └── web      # 用户端 Next.js
├── packages
└── pnpm-workspace.yaml
```

这次部署选择的是 Cloudflare Pages Direct Upload，也就是本地构建静态产物，然后用 Wrangler 上传 `out` 目录。

---

## 为什么可以用静态部署

`admin` 和 `web` 都是 Next.js 子站，但它们的业务请求主要发生在浏览器端：

1. 页面由 Next.js 构建成静态 HTML 和 JS。
2. 用户登录后，浏览器通过 `NEXT_PUBLIC_API_BASE_URL` 请求 api 子站。
3. 鉴权 token 保存在浏览器侧。
4. API、D1、R2、GitHub OAuth 等服务端能力都放在 `apps/api` 里。

所以前端子站不需要在 Pages 上运行 SSR 逻辑，直接静态导出即可。

如果你的 Next.js 页面依赖这些能力，就不能直接用本文的方式：

```txt
cookies()
headers()
Route Handler
Server Action
动态 SSR
Node.js runtime API
```

这种情况需要使用 Cloudflare Pages Functions 或 OpenNext 这类适配方案。

---

## 前置条件

部署前需要先准备好：

1. 已经登录 Cloudflare Wrangler。
2. api 子站已经上线。
3. admin / web 的生产环境变量指向线上 API。
4. Next.js 项目可以静态导出。

确认 Wrangler 登录：

```bash
cd apps/api
pnpm wrangler whoami
```

本文里 API 的线上地址是：

```txt
https://api-production.1832064870.workers.dev
```

后续 admin 和 web 都会请求这个地址。

---

## 一、部署 Admin 子站

### 1. 修改生产环境变量

文件位置：

```txt
apps/admin/.env.production
```

内容示例：

```env
APP_ENV=production
API_BASE_URL=https://api-production.1832064870.workers.dev
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api-production.1832064870.workers.dev
```

这里有两个 API 地址：

```txt
API_BASE_URL
NEXT_PUBLIC_API_BASE_URL
```

它们的区别是：

1. `API_BASE_URL` 给服务端代码使用。
2. `NEXT_PUBLIC_API_BASE_URL` 会被打包进浏览器代码。

当前 admin 是静态部署，真正关键的是 `NEXT_PUBLIC_API_BASE_URL`。但为了保持环境变量结构一致，两个都配置成同一个线上 API 地址。

### 2. 开启静态导出

文件位置：

```txt
apps/admin/next.config.js
```

配置如下：

```js
/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  transpilePackages: ["@repo/ui", "@repo/contracts", "@repo/api"]
};

export default nextConfig;
```

关键配置是：

```js
output: "export"
```

它会让 `next build` 生成 `out` 目录，里面是可以被 Cloudflare Pages 托管的静态资源。

### 3. 构建 Admin

在仓库根目录执行：

```bash
pnpm --filter admin build
```

构建成功后会生成：

```txt
apps/admin/out
```

### 4. 创建 Cloudflare Pages 项目

本项目 Wrangler 安装在 `apps/api` 子站里，所以进入 `apps/api` 执行 Wrangler 命令：

```bash
cd apps/api
pnpm wrangler pages project create ai-agent-admin --production-branch main
```

创建成功后，Cloudflare 会提示项目默认域名，例如：

```txt
https://ai-agent-admin.pages.dev
```

### 5. 上传 Admin 静态产物

继续在 `apps/api` 目录执行：

```bash
pnpm wrangler pages deploy ../admin/out \
  --project-name ai-agent-admin \
  --branch main \
  --commit-dirty=true
```

部署成功后会看到类似输出：

```txt
Deployment complete!
https://d27879cc.ai-agent-admin.pages.dev
```

这里有两个地址要区分：

```txt
生产域名: https://ai-agent-admin.pages.dev
预览部署: https://d27879cc.ai-agent-admin.pages.dev
```

日常访问建议用生产域名。

---

## 二、部署 Web 子站

Web 子站和 Admin 子站整体流程相同，但多了两个注意点：

1. Web 使用了 `next/image`，静态导出时需要关闭图片优化。
2. Web 有动态路由 `/discover/[roleId]`，静态导出时需要 `generateStaticParams()`。

### 1. 修改生产环境变量

文件位置：

```txt
apps/web/.env.production
```

内容示例：

```env
APP_ENV=production
API_BASE_URL=https://api-production.1832064870.workers.dev
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api-production.1832064870.workers.dev
```

### 2. 开启静态导出和图片非优化

文件位置：

```txt
apps/web/next.config.js
```

配置如下：

```js
/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@repo/ui", "@repo/contracts", "@repo/api"]
};

export default nextConfig;
```

为什么要加 `images.unoptimized`？

因为 Next.js 默认图片优化需要服务端能力，而 `output: "export"` 输出的是纯静态资源。关闭图片优化后，`next/image` 会以静态方式工作，适合 Pages 托管。

### 3. 给动态详情页补静态参数

Web 里有一个角色详情页：

```txt
apps/web/app/(dashboard)/discover/[roleId]/page.tsx
```

静态导出时，Next.js 必须提前知道要生成哪些 `roleId` 页面，因此需要增加：

```ts
export function generateStaticParams() {
  return Object.keys(roleProfiles).map((roleId) => ({ roleId }))
}
```

如果不加，构建会报错：

```txt
Page "/discover/[roleId]" is missing "generateStaticParams()"
so it cannot be used with "output: export" config.
```

### 4. 构建 Web

在仓库根目录执行：

```bash
pnpm --filter web build
```

构建成功后会生成：

```txt
apps/web/out
```

### 5. 创建 Cloudflare Pages 项目

进入 `apps/api`：

```bash
cd apps/api
pnpm wrangler pages project create ai-agent-web --production-branch main
```

这次 Cloudflare 实际分配的生产域名是：

```txt
https://ai-agent-web-66e.pages.dev
```

注意：不要想当然以为一定是 `https://ai-agent-web.pages.dev`。如果项目名冲突或 Cloudflare 做了后缀处理，最终域名要以 Wrangler 输出或 Pages 项目列表为准。

查看 Pages 项目：

```bash
pnpm wrangler pages project list
```

### 6. 上传 Web 静态产物

```bash
pnpm wrangler pages deploy ../web/out \
  --project-name ai-agent-web \
  --branch main \
  --commit-dirty=true
```

部署成功后会看到类似：

```txt
Deployment complete!
https://3b146b17.ai-agent-web-66e.pages.dev
```

对应关系是：

```txt
生产域名: https://ai-agent-web-66e.pages.dev
预览部署: https://3b146b17.ai-agent-web-66e.pages.dev
```

---

## 三、同步 API 的 CORS 配置

前端部署完成后，还需要回到 `apps/api/wrangler.jsonc`，同步生产环境的来源域名。

文件位置：

```txt
apps/api/wrangler.jsonc
```

生产环境变量示例：

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "ADMIN_ORIGIN": "https://ai-agent-admin.pages.dev",
        "WEB_ORIGIN": "https://ai-agent-web-66e.pages.dev"
      }
    }
  }
}
```

为什么要同步？

因为 API 里 CORS 是按这两个变量判断的：

```ts
const allowedOrigins = new Set([env.ADMIN_ORIGIN, env.WEB_ORIGIN])
```

如果 Pages 实际域名和 API 配置不一致，浏览器请求会被 CORS 拦住。

Web 部署后，我们把：

```txt
WEB_ORIGIN=https://ai-agent-web-66e.pages.dev
```

写入 API production 配置，然后重新部署 API：

```bash
cd apps/api
pnpm wrangler deploy --env production --dry-run
pnpm wrangler deploy --env production --minify
```

---

## 四、GitHub OAuth 回调地址

Web 子站上线后，GitHub OAuth App 的回调地址应该指向 API 子站，而不是 Web 子站。

本次 API 地址是：

```txt
https://api-production.1832064870.workers.dev
```

所以 GitHub OAuth callback URL 应该填：

```txt
https://api-production.1832064870.workers.dev/auth/web/github/callback
```

原因是 GitHub 授权完成后，会先回到 API：

```txt
GitHub
  -> API /auth/web/github/callback
  -> API 生成登录 ticket
  -> 跳回 WEB_ORIGIN /login/github/callback
```

因此 API 需要知道 `WEB_ORIGIN`，GitHub 需要知道 API callback。

---

## 五、常见问题

### 1. 为什么不直接部署 `.next`？

Cloudflare Pages Direct Upload 需要上传静态资源目录。对 `output: "export"` 的 Next.js 项目来说，正确目录是：

```txt
out
```

不是：

```txt
.next
```

### 2. 为什么 admin 可以是 `ai-agent-admin.pages.dev`，web 却是 `ai-agent-web-66e.pages.dev`？

Cloudflare Pages 的默认域名由平台分配。如果名字已被占用或存在冲突，Cloudflare 可能加后缀。

所以前端域名不要手写猜测，应该通过命令确认：

```bash
pnpm wrangler pages project list
```

### 3. 为什么访问预览部署会被 CORS 拦？

例如：

```txt
https://3b146b17.ai-agent-web-66e.pages.dev
```

这是某一次部署的预览地址。API production CORS 通常只允许稳定生产域名：

```txt
https://ai-agent-web-66e.pages.dev
```

如果你想用预览地址测试，需要把预览域名也加入 API 的允许来源。正式环境更推荐使用生产域名。

### 4. 为什么改完 Web 域名还要重新部署 API？

因为 `WEB_ORIGIN` 是 Worker 的环境变量。改了 `wrangler.jsonc` 后，线上 Worker 不会自动更新，需要重新部署：

```bash
pnpm wrangler deploy --env production --minify
```

---

## 最终部署结果

Admin：

```txt
https://ai-agent-admin.pages.dev
```

Web：

```txt
https://ai-agent-web-66e.pages.dev
```

API：

```txt
https://api-production.1832064870.workers.dev
```

这套部署方式的核心思路是：

1. `admin/web` 只负责静态页面和浏览器端交互。
2. `api` 承担所有服务端能力。
3. Cloudflare Pages 托管前端静态资源。
4. Cloudflare Workers 托管 API。
5. Pages 域名变化后，要同步更新 API 的 CORS origin。

