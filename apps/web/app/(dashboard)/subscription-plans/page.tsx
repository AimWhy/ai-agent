import { Check, HelpCircle, Minus, Sparkles } from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"
import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/card"
import { Separator } from "@repo/ui/separator"

const plans = [
  {
    name: "基础版",
    description: "适合个人体验和轻量工作流验证。",
    price: "免费",
    period: "长期可用",
    cta: "当前套餐",
    variant: "outline" as const,
    features: ["1 个 Agent", "基础对话与配置", "个人知识沉淀", "社区功能预览"],
  },
  {
    name: "专业版",
    description: "适合高频创作、复杂任务拆解和多 Agent 协作。",
    price: "¥99",
    period: "/月",
    cta: "升级到专业版",
    variant: "default" as const,
    recommended: true,
    features: ["10 个 Agent", "群聊协作", "多 Agent 联动", "发现广场完整访问"],
  },
  {
    name: "团队版",
    description: "适合团队统一管理 Agent 能力与协作资产。",
    price: "联系销售",
    period: "定制方案",
    cta: "联系团队",
    variant: "outline" as const,
    features: ["更高 Agent 配额", "全部高级能力", "Agent 时间演变", "团队支持与权限规划"],
  },
]

const comparisons = [
  {
    feature: "Agent 数量",
    basic: "1 个",
    pro: "10 个",
    team: "定制",
  },
  {
    feature: "群聊",
    basic: false,
    pro: true,
    team: true,
  },
  {
    feature: "多 Agent 联动",
    basic: false,
    pro: true,
    team: true,
  },
  {
    feature: "发现广场",
    basic: "预览",
    pro: true,
    team: true,
  },
  {
    feature: "Agent 时间演变",
    basic: false,
    pro: false,
    team: true,
  },
]

const faqs = [
  {
    question: "什么时候可以升级套餐？",
    answer: "支付与自动升级入口会在后续接入，当前页面先用于展示套餐权益和产品边界。",
  },
  {
    question: "是否支持年付？",
    answer: "订阅模型已预留按月、按年和一次性付费周期，具体售卖策略以后续配置为准。",
  },
  {
    question: "账单和支付入口在哪里？",
    answer: "目前用户菜单中的升级和账单入口会先指向本页面，真实账单页会在支付能力接入后补齐。",
  },
]

function CapabilityValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-primary">
        <Check className="size-4" />
        <span className="sr-only">支持</span>
      </span>
    )
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-muted-foreground">
        <Minus className="size-4" />
        <span className="sr-only">暂不支持</span>
      </span>
    )
  }

  return <span>{value}</span>
}

export default function SubscriptionPlansPage() {
  return (
    <DashboardShell title="订阅套餐">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="grid gap-8 p-6 md:grid-cols-[1.4fr_0.6fr] md:p-10">
            <div className="space-y-5">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                订阅套餐
              </Badge>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  选择适合你的 Agent 成长方案
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  按需解锁 Agent 数量、群聊协作、多 Agent 联动与高级能力，让个人探索和团队协作都更顺畅。
                </p>
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <p className="font-medium">当前为权益展示页</p>
                  <p className="text-sm text-muted-foreground">支付与自动升级入口后续接入。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.recommended
                  ? "relative border-primary/60 shadow-md ring-1 ring-primary/20"
                  : "border-muted/80"
              }
            >
              {plan.recommended ? (
                <div className="absolute right-6 top-6">
                  <Badge className="rounded-full">推荐</Badge>
                </div>
              ) : null}
              <CardHeader className="gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="min-h-10 leading-6">
                    {plan.description}
                  </CardDescription>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant={plan.variant} className="w-full" disabled>
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">权益对比</h2>
            <p className="text-sm text-muted-foreground">
              以当前产品能力模型为基础，帮助你快速判断适合的套餐层级。
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border">
            <div className="grid grid-cols-4 bg-muted/50 px-4 py-3 text-sm font-medium">
              <span>能力</span>
              <span className="text-center">基础版</span>
              <span className="text-center">专业版</span>
              <span className="text-center">团队版</span>
            </div>
            {comparisons.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-4 border-t px-4 py-4 text-sm"
              >
                <span className="font-medium">{row.feature}</span>
                <span className="text-center text-muted-foreground">
                  <CapabilityValue value={row.basic} />
                </span>
                <span className="text-center text-muted-foreground">
                  <CapabilityValue value={row.pro} />
                </span>
                <span className="text-center text-muted-foreground">
                  <CapabilityValue value={row.team} />
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HelpCircle className="size-4 text-primary" />
                  {faq.question}
                </CardTitle>
                <CardDescription className="leading-6">{faq.answer}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </div>
    </DashboardShell>
  )
}
