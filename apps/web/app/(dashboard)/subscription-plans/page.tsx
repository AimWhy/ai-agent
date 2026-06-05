import {
  BadgeCheck,
  Bot,
  Check,
  CheckCircle2,
  HelpCircle,
  Minus,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

import { DashboardShell } from "../_components/dashboard-shell"

const plans = [
  {
    name: "基础版",
    description: "适合体验角色创建和轻量陪伴聊天。",
    price: "免费",
    period: "长期可用",
    status: "当前套餐",
    toneClassName: "bg-slate-50",
    features: ["1 个 Agent 伴侣", "基础对话配置", "角色广场预览", "个人草稿"],
  },
  {
    name: "专业版",
    description: "适合高频聊天、多个角色和更完整的互动模式。",
    price: "¥99",
    period: "/月",
    status: "推荐",
    recommended: true,
    toneClassName: "bg-violet-50/70",
    features: ["10 个 Agent 伴侣", "完整互动模式", "角色广场完整访问", "优先体验新能力"],
  },
  {
    name: "团队版",
    description: "适合团队共建角色、统一管理边界和协作资产。",
    price: "联系销售",
    period: "定制方案",
    status: "可咨询",
    toneClassName: "bg-slate-50",
    features: ["更高 Agent 配额", "团队权限", "高级边界策略", "专属支持"],
  },
]

const comparisons = [
  { feature: "Agent 伴侣数量", basic: "1 个", pro: "10 个", team: "定制" },
  { feature: "角色广场访问", basic: "预览", pro: true, team: true },
  { feature: "互动模式配置", basic: "基础", pro: true, team: true },
  { feature: "多 Agent 联动", basic: false, pro: true, team: true },
  { feature: "团队权限", basic: false, pro: false, team: true },
]

const faqs = [
  {
    question: "什么时候可以升级套餐？",
    answer: "支付与自动升级入口后续接入，当前页面先用于展示套餐权益和产品边界。",
  },
  {
    question: "是否支持年付？",
    answer: "订阅模型已预留按月、按年和一次性付费周期，具体策略以后续配置为准。",
  },
  {
    question: "团队版适合什么场景？",
    answer: "适合需要统一管理多个 Agent 伴侣、权限、边界和协作资产的团队。",
  },
]

function CapabilityValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-emerald-600">
        <Check className="size-4" />
        <span className="sr-only">支持</span>
      </span>
    )
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-slate-300">
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
      <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_32rem),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <section className="border-b bg-white/90 px-5 py-5 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-violet-700">
                <Sparkles className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  Subscription plans
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  为你的 Agent 伴侣选择合适的成长空间
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  解锁更多角色数量、互动模式、多 Agent 联动与团队管理能力。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:min-w-96">
              <div className="border-r border-slate-200 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Bot className="size-3.5 text-violet-600" />
                  当前
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">基础版</p>
              </div>
              <div className="border-r border-slate-200 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Zap className="size-3.5 text-blue-600" />
                  使用率
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">62%</p>
              </div>
              <div className="px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  状态
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">正常</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 lg:px-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <section
                  className={`${plan.toneClassName} overflow-hidden rounded-2xl border ${
                    plan.recommended ? "border-violet-200" : "border-slate-200"
                  }`}
                  key={plan.name}
                >
                  <div className="border-b border-slate-200 bg-white/70 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-slate-950">{plan.name}</p>
                        <p className="mt-2 min-h-10 text-sm leading-6 text-slate-600">{plan.description}</p>
                      </div>
                      <span
                        className={
                          plan.recommended
                            ? "inline-flex h-6 shrink-0 items-center rounded-full border border-violet-200 bg-white px-2.5 text-[11px] font-medium text-violet-700"
                            : "inline-flex h-6 shrink-0 items-center rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-medium text-slate-600"
                        }
                      >
                        {plan.status}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end gap-1">
                      <span className="text-3xl font-semibold tracking-tight text-slate-950">{plan.price}</span>
                      <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <ul className="space-y-3 text-sm text-slate-700">
                      {plan.features.map((feature) => (
                        <li className="flex items-start gap-3" key={feature}>
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={
                        plan.recommended
                          ? "mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                          : "mt-5 inline-flex h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      }
                      disabled
                      type="button"
                    >
                      {plan.recommended ? "升级到专业版" : plan.name === "基础版" ? "当前套餐" : "联系团队"}
                    </button>
                  </div>
                </section>
              ))}
            </div>

            <aside className="flex flex-col gap-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-slate-950 text-white">
                    <BadgeCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">权益展示页</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      支付与自动升级入口后续接入。
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Users className="size-4 text-blue-600" />
                  推荐选择
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  如果你计划创建多个 Agent 伴侣，并希望完整使用互动模式和角色广场，专业版更适合。
                </p>
              </section>
            </aside>
          </div>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">权益对比</p>
                <p className="mt-1 text-xs text-muted-foreground">快速判断不同套餐的能力边界。</p>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">Capability matrix</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-4 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-slate-600">
                <span>能力</span>
                <span className="text-center">基础版</span>
                <span className="text-center">专业版</span>
                <span className="text-center">团队版</span>
              </div>
              {comparisons.map((row) => (
                <div className="grid grid-cols-4 border-t border-slate-200 px-4 py-4 text-sm" key={row.feature}>
                  <span className="font-medium text-slate-700">{row.feature}</span>
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

          <section className="mt-5 grid gap-5 md:grid-cols-3">
            {faqs.map((faq) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5" key={faq.question}>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <HelpCircle className="size-4 text-violet-600" />
                  {faq.question}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </section>
        </section>
      </main>
    </DashboardShell>
  )
}
