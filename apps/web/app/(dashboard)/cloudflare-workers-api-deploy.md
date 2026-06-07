# Cloudflare Workers 部署 API 子站实践

这篇文章记录一次真实的 `apps/api` 子站部署过程。项目里的 API 使用 Hono 跑在 Cloudflare Workers 上，同时依赖：

```txt
D1  数据库：保存用户、会话、角色、订阅等数据
R2  存储桶：保存用户头像
环境变量：保存 origin、模型配置、OAuth 配置
Secrets：保存 JWT 密钥、GitHub Secret、LLM API Key
```

目标是把本地可运行的 API 子站部署到 Cloudflare，并让 `admin` / `web` 两个前端子站可以访问它。

---

## 一、部署前准备

进入 API 子站目录：

```bash
cd apps/api
```

确认 Wrangler 已登录：

```bash
pnpm wrangler whoami
```

正常会看到账号信息，例如：

```txt
Account ID: 629f5983e568d0d6b2439f06a93f8ca4
```

查看 D1 数据库：

```bash
pnpm wrangler d1 list
```

本次生产数据库是：

```txt
name: ai-agent-production-auth
uuid: ba264b43-5d69-4b40-8ba8-375be3dcaebf
```

如果你还没有创建生产 D1，可以执行：

```bash
pnpm wrangler d1 create ai-agent-production-auth
```

创建后，把命令输出里的 `database_id` 写入 `wrangler.jsonc`。

如果你还没有创建生产 R2 bucket，可以执行：

```bash
pnpm wrangler r2 bucket create ai-agent-production-avatars
```

---

## 二、配置 wrangler.jsonc

API 子站的 Cloudflare 配置文件是：

```txt
apps/api/wrangler.jsonc
```

本次最终的 production 关键配置如下：

```jsonc
{
  "name": "api",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-22",
  "env": {
    "production": {
      "workers_dev": true,
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "ai-agent-production-auth",
          "database_id": "ba264b43-5d69-4b40-8ba8-375be3dcaebf",
          "migrations_dir": "migrations"
        }
      ],
      "r2_buckets": [
        {
          "binding": "AVATAR_BUCKET",
          "bucket_name": "ai-agent-production-avatars"
        }
      ],
      "vars": {
        "APP_ENV": "production",
        "ADMIN_ORIGIN": "https://ai-agent-admin.pages.dev",
        "WEB_ORIGIN": "https://ai-agent-web-66e.pages.dev",
        "ACCESS_TOKEN_TTL_SEC": "900",
        "REFRESH_TOKEN_TTL_SEC": "2592000",
        "DEEPSEEK_BASE_URL": "https://api.deepseek.com/v1",
        "DEEPSEEK_MODEL": "deepseek-chat",
        "GITHUB_OAUTH_CLIENT_ID": "<github-oauth-client-id>",
        "GITHUB_OAUTH_CALLBACK_URL": ""
      }
    }
  }
}
```

这里有几个重点。

### 1. env 下的 bindings 不继承顶层配置

Wrangler 的环境配置有一个容易踩坑的点：

```txt
env.production.d1_databases
env.production.r2_buckets
```

不会自动继承顶层的：

```txt
d1_databases
r2_buckets
```

所以生产环境必须在 `env.production` 里单独配置 D1 / R2。

### 2. binding 名要和代码一致

代码里使用的是：

```ts
c.env.DB
c.env.AVATAR_BUCKET
```

因此生产环境里也必须保持：

```jsonc
{
  "binding": "DB"
}
```

和：

```jsonc
{
  "binding": "AVATAR_BUCKET"
}
```

不要把生产绑定名改成 `ai_agent_production_auth` 或 `ai_agent_production_avatars`。资源名称可以是生产名称，但 binding 名要和代码一致。

### 3. database_id 必须是真实 ID

之前迁移失败时的报错是：

```txt
The database 33333333-3333-4333-8333-333333333333 could not be found [code: 7404]
```

原因是 `env.production.d1_databases[0].database_id` 还是占位符：

```txt
33333333-3333-4333-8333-333333333333
```

正确做法是用 `wrangler d1 list` 或 `wrangler d1 create` 得到真实 ID，然后写入 production 环境。

本次真实生产 ID 是：

```txt
ba264b43-5d69-4b40-8ba8-375be3dcaebf
```

### 4. workers_dev 用于启用默认 workers.dev 域名

```jsonc
"workers_dev": true
```

这样部署后 Cloudflare 会提供默认访问域名。

本次部署后的 API 地址是：

```txt
https://api-production.1832064870.workers.dev
```

---

## 三、配置 Secrets

不应该把敏感信息写进 `wrangler.jsonc`。

例如这些值应该用 Secret：

```txt
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
DEEPSEEK_API_KEY
GITHUB_OAUTH_CLIENT_SECRET
```

设置 production secret：

```bash
cd apps/api

pnpm wrangler secret put JWT_ACCESS_SECRET --env production
pnpm wrangler secret put JWT_REFRESH_SECRET --env production
pnpm wrangler secret put DEEPSEEK_API_KEY --env production
pnpm wrangler secret put GITHUB_OAUTH_CLIENT_SECRET --env production
```

命令执行后，Wrangler 会提示输入对应值。

注意：不要把 secret 写进 Markdown、Git、聊天记录或日志里。

---

## 四、执行 D1 迁移

D1 迁移文件在：

```txt
apps/api/migrations
```

执行远程 production 迁移：

```bash
cd apps/api
pnpm wrangler d1 migrations apply ai-agent-production-auth --env production --remote
```

这里几个参数分别表示：

```txt
ai-agent-production-auth  D1 数据库名称
--env production          使用 wrangler.jsonc 里的 env.production
--remote                  操作 Cloudflare 远程资源，不是本地模拟 D1
```

如果你看到类似 warning：

```txt
There is a d1_databases binding at the top level, but not on env.production
```

说明 production 环境没有单独配置 D1 binding。要回到 `wrangler.jsonc`，确保 `env.production.d1_databases` 存在。

如果你看到：

```txt
database could not be found [code: 7404]
```

优先检查：

1. `database_id` 是否还停留在占位符。
2. 数据库名称是否写错。
3. 是否在正确的 Cloudflare 账号下。
4. 是否使用了 `--env production`。

---

## 五、部署前 dry-run

正式部署前，建议先做 dry-run：

```bash
cd apps/api
pnpm wrangler deploy --env production --dry-run
```

dry-run 不会真正发布 Worker，但会检查配置和构建产物。

正常会看到 bindings 列表，例如：

```txt
env.DB (ai-agent-production-auth)                  D1 Database
env.AVATAR_BUCKET (ai-agent-production-avatars)    R2 Bucket
env.APP_ENV ("production")                         Environment Variable
env.ADMIN_ORIGIN ("https://ai-agent-admin.pages.dev")
env.WEB_ORIGIN ("https://ai-agent-web-66e.pages.dev")
```

这个输出很重要，它能帮你确认线上 Worker 实际拿到的资源是否正确。

---

## 六、正式部署 API

执行：

```bash
cd apps/api
pnpm wrangler deploy --env production --minify
```

部署成功后会看到类似：

```txt
Uploaded api-production
Deployed api-production triggers
https://api-production.1832064870.workers.dev
Current Version ID: bb6a160e-4f37-4736-8932-1a4ea8278a38
```

这里有两个信息要记下来：

```txt
API URL
Current Version ID
```

API URL 后续会写入 admin / web 的生产环境变量：

```env
NEXT_PUBLIC_API_BASE_URL=https://api-production.1832064870.workers.dev
```

---

## 七、GitHub OAuth 回调配置

GitHub OAuth 的回调地址应该填 API 子站地址：

```txt
https://api-production.1832064870.workers.dev/auth/web/github/callback
```

不是 Web 子站地址。

当前代码里，`GITHUB_OAUTH_CALLBACK_URL` 是可选的：

```ts
callbackUrl: env.GITHUB_OAUTH_CALLBACK_URL
  ?? new URL('/auth/web/github/callback', c.req.url).toString()
```

所以 production 里可以先写：

```jsonc
"GITHUB_OAUTH_CALLBACK_URL": ""
```

空字符串会被环境变量解析逻辑当成未配置，然后运行时使用当前 API 请求域名自动拼出 callback URL。

但是 GitHub OAuth App 后台仍然必须配置最终回调地址：

```txt
https://api-production.1832064870.workers.dev/auth/web/github/callback
```

---

## 八、部署前端后要回头更新 API Origin

API 里 CORS 会检查：

```ts
const allowedOrigins = new Set([env.ADMIN_ORIGIN, env.WEB_ORIGIN])
```

因此 admin / web 部署完成后，要把真实 Pages 生产域名写回 `wrangler.jsonc`。

本次最终配置是：

```txt
ADMIN_ORIGIN=https://ai-agent-admin.pages.dev
WEB_ORIGIN=https://ai-agent-web-66e.pages.dev
```

注意 Web 的实际域名不是猜出来的 `ai-agent-web.pages.dev`，而是 Cloudflare 实际分配的：

```txt
https://ai-agent-web-66e.pages.dev
```

修改 `WEB_ORIGIN` 后，需要重新部署 API：

```bash
cd apps/api
pnpm wrangler deploy --env production --dry-run
pnpm wrangler deploy --env production --minify
```

否则线上 Worker 仍然使用旧 origin，浏览器会遇到 CORS 问题。

---

## 九、推荐部署顺序

完整部署顺序建议如下：

```txt
1. 创建 D1 / R2
2. 配置 apps/api/wrangler.jsonc
3. 设置 production secrets
4. 执行 D1 migrations
5. dry-run API
6. deploy API
7. 拿到 API workers.dev 域名
8. 配置 admin / web 的生产 API 地址
9. 部署 admin / web 到 Pages
10. 拿到真实 Pages 生产域名
11. 回写 API 的 ADMIN_ORIGIN / WEB_ORIGIN
12. 重新 deploy API
13. 配置 GitHub OAuth callback URL
```

这样做的好处是：

1. API 先有稳定地址。
2. 前端可以在构建时写入正确的 API 地址。
3. 前端部署后再同步 CORS origin。
4. GitHub OAuth 最后配置，避免回调地址猜错。

---

## 十、常用命令清单

查看登录账号：

```bash
pnpm wrangler whoami
```

查看 D1：

```bash
pnpm wrangler d1 list
```

创建 D1：

```bash
pnpm wrangler d1 create ai-agent-production-auth
```

创建 R2：

```bash
pnpm wrangler r2 bucket create ai-agent-production-avatars
```

设置 secret：

```bash
pnpm wrangler secret put JWT_ACCESS_SECRET --env production
pnpm wrangler secret put JWT_REFRESH_SECRET --env production
pnpm wrangler secret put DEEPSEEK_API_KEY --env production
pnpm wrangler secret put GITHUB_OAUTH_CLIENT_SECRET --env production
```

执行 D1 迁移：

```bash
pnpm wrangler d1 migrations apply ai-agent-production-auth --env production --remote
```

部署前检查：

```bash
pnpm wrangler deploy --env production --dry-run
```

正式部署：

```bash
pnpm wrangler deploy --env production --minify
```

---

## 最终结果

API 生产地址：

```txt
https://api-production.1832064870.workers.dev
```

最近一次部署版本：

```txt
bb6a160e-4f37-4736-8932-1a4ea8278a38
```

前端生产地址：

```txt
Admin: https://ai-agent-admin.pages.dev
Web:   https://ai-agent-web-66e.pages.dev
```

GitHub OAuth 回调地址：

```txt
https://api-production.1832064870.workers.dev/auth/web/github/callback
```

这一套部署方式的核心是：**API 独立部署为 Worker，前端静态部署到 Pages，双方通过明确的环境变量和 CORS origin 连接起来。**

