import {
  BadgeCheck,
  Bot,
  Check,
  CheckCircle2,
  HelpCircle,
  Minus,
  Search,
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
    features: ["1 个 Agent 伴侣", "基础对话配置", "角色广场预览", "个人草稿"],
    spanClassName: "row-span-5",
  },
  {
    name: "专业版",
    description: "适合高频聊天、多个角色和更完整的互动模式。",
    price: "¥99",
    period: "/月",
    status: "推荐",
    recommended: true,
    features: ["10 个 Agent 伴侣", "完整互动模式", "角色广场完整访问", "优先体验新能力"],
    spanClassName: "row-span-6 md:col-span-2 2xl:col-span-1",
  },
  {
    name: "团队版",
    description: "适合团队共建角色、统一管理边界和协作资产。",
    price: "联系销售",
    period: "定制方案",
    status: "可咨询",
    features: ["更高 Agent 配额", "团队权限", "高级边界策略", "专属支持"],
    spanClassName: "row-span-5",
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

const billingTabs = [
  { label: "月付", meta: "按月订阅" },
  { label: "年付", meta: "预留优惠" },
  { label: "团队", meta: "定制方案" },
  { label: "权益对比", meta: "能力边界" },
  { label: "FAQ", meta: "常见问题" },
]

const planStats = [
  { label: "当前", value: "基础版", icon: Bot },
  { label: "使用率", value: "62%", icon: Zap },
  { label: "状态", value: "正常", icon: ShieldCheck },
]

const usageItems = [
  { label: "Agent 伴侣", value: "1 / 1", widthClassName: "w-full" },
  { label: "互动模式", value: "2 / 4", widthClassName: "w-1/2" },
  { label: "广场访问", value: "预览", widthClassName: "w-1/3" },
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
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
              <div className="flex min-w-0 gap-4">
                <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                  <Sparkles className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span>订阅套餐</span>
                    <span className="h-px w-8 bg-slate-200" />
                    <span>Subscription</span>
                  </div>
                  <p className="mt-2 max-w-xl text-[15px] font-normal leading-7 text-slate-600">
                    为你的 Agent 伴侣选择合适的成长空间，解锁更多角色数量、互动模式和协作能力。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <BadgeCheck className="size-3.5" />
                      权益透明
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <Bot className="size-3.5" />
                      角色配额
                    </span>
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500">
                      <ShieldCheck className="size-3.5" />
                      边界策略
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 pt-3 lg:border-t-0 lg:pt-0">
                {planStats.map((item, index) => {
                  const Icon = item.icon

                  return (
                    <div
                      className={index === 0 ? "pr-4" : "border-l border-slate-200 px-4 last:pr-0"}
                      key={item.label}
                    >
                      <div className="mb-2 flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Icon className="size-3.5" />
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                      <p className="mt-1 text-sm font-medium leading-none text-slate-600">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-1.5 lg:h-10 lg:flex-row lg:items-center">
            <label className="flex h-9 min-w-0 items-center gap-2 rounded-xl bg-slate-50/80 px-2.5 ring-1 ring-inset ring-slate-200/70 transition-colors focus-within:bg-white lg:w-80">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500">
                <Search className="size-3.5" />
              </span>
              <input
                aria-label="搜索套餐权益"
                className="h-8 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="搜索套餐、权益或限制"
              />
            </label>

            <div className="hidden h-5 w-px shrink-0 bg-slate-200 lg:block" />

            <div className="flex h-9 min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {billingTabs.map((tab, index) => (
                <button
                  className={
                    index === 0
                      ? "relative flex h-8 shrink-0 items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-950 after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-slate-400"
                      : "flex h-8 shrink-0 items-center rounded-lg px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  }
                  key={tab.label}
                  title={tab.meta}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              type="button"
            >
              <Users className="size-4" />
              联系团队
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="overflow-hidden rounded-2xl">
              <div className="grid auto-rows-[84px] grid-flow-dense grid-cols-1 gap-1 md:grid-cols-2 2xl:grid-cols-3">
                {plans.map((plan) => (
                  <article
                    className={`${plan.spanClassName} relative flex min-h-0 flex-col bg-white p-5 transition-colors hover:bg-slate-50`}
                    key={plan.name}
                  >
                    {plan.recommended ? <span className="absolute inset-x-5 top-0 h-px bg-slate-950" /> : null}

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-slate-950">{plan.name}</p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">{plan.description}</p>
                      </div>
                      <span
                        className={
                          plan.recommended
                            ? "inline-flex h-6 shrink-0 items-center rounded-full bg-slate-950 px-2.5 text-[11px] font-medium text-white"
                            : "inline-flex h-6 shrink-0 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-medium text-slate-600"
                        }
                      >
                        {plan.status}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end gap-1">
                      <span className="text-3xl font-semibold tracking-tight text-slate-950">{plan.price}</span>
                      <span className="pb-1 text-sm text-slate-400">{plan.period}</span>
                    </div>

                    <ul className="mt-5 space-y-3 text-sm text-slate-700">
                      {plan.features.map((feature) => (
                        <li className="flex items-start gap-3" key={feature}>
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-slate-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={
                        plan.recommended
                          ? "mt-auto inline-flex h-10 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white hover:bg-slate-800"
                          : "mt-auto inline-flex h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      }
                      disabled
                      type="button"
                    >
                      {plan.recommended ? "升级到专业版" : plan.name === "基础版" ? "当前套餐" : "联系团队"}
                    </button>
                  </article>
                ))}

                <article className="row-span-5 bg-white p-5 md:col-span-2 2xl:col-span-3">
                  <div className="mb-4 flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">权益对比</p>
                      <p className="mt-1 text-xs text-slate-400">快速判断不同套餐的能力边界。</p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">Capability matrix</span>
                  </div>

                  <div className="overflow-hidden">
                    <div className="grid grid-cols-4 border-b border-slate-200 pb-3 text-xs font-semibold text-slate-500">
                      <span>能力</span>
                      <span className="text-center">基础版</span>
                      <span className="text-center">专业版</span>
                      <span className="text-center">团队版</span>
                    </div>
                    {comparisons.map((row) => (
                      <div
                        className="grid grid-cols-4 border-b border-slate-100 py-3 text-sm last:border-b-0"
                        key={row.feature}
                      >
                        <span className="font-medium text-slate-700">{row.feature}</span>
                        <span className="text-center text-slate-500">
                          <CapabilityValue value={row.basic} />
                        </span>
                        <span className="text-center text-slate-500">
                          <CapabilityValue value={row.pro} />
                        </span>
                        <span className="text-center text-slate-500">
                          <CapabilityValue value={row.team} />
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>

            <aside className="grid gap-5">
              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <BadgeCheck className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">权益展示页</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">支付与自动升级入口后续接入。</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {usageItems.map((item) => (
                    <div key={item.label}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">{item.label}</span>
                        <span className="text-slate-400">{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className={`${item.widthClassName} h-full rounded-full bg-slate-950`} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl bg-white p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <Users className="size-4 text-slate-500" />
                  推荐选择
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  如果你计划创建多个 Agent 伴侣，并希望完整使用互动模式和角色广场，专业版更适合。
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">能力状态</p>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    normal
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 border-t border-slate-100 pt-3 text-center">
                  <div>
                    <p className="text-[10px] font-medium text-slate-400">角色</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">1</p>
                  </div>
                  <div className="border-x border-slate-100">
                    <p className="text-[10px] font-medium text-slate-400">模式</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">2</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400">升级</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">可用</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <HelpCircle className="size-4 text-slate-500" />
                    常见问题
                  </p>
                  <span className="text-[11px] font-medium text-slate-400">{faqs.length} 条</span>
                </div>

                <div className="mt-4 grid gap-2">
                  {faqs.map((faq) => (
                    <div className="border-t border-slate-100 py-3 first:border-t-0 first:pt-0" key={faq.question}>
                      <p className="text-sm font-semibold text-slate-800">{faq.question}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
