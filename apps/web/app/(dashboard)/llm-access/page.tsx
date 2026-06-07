"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  KeyRound,
  PencilLine,
  PlugZap,
  Plus,
  Power,
  RadioTower,
  ShieldCheck,
  Trash2,
} from "lucide-react"

import {
  createDefaultLlmConfigItem,
  deleteLocalLlmConfigItem,
  localLlmConfigChangedEventName,
  readLocalLlmConfigStore,
  saveLocalLlmConfigStore,
  selectLocalLlmConfig,
  upsertLocalLlmConfigItem,
  type LocalLlmConfigItem,
  type LocalLlmConfigStore,
} from "@/auth/local-llm-config"
import { DashboardShell } from "../_components/dashboard-shell"

function formatDateTime(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value)).replaceAll("/", ".")
}

function maskApiKey(value: string) {
  if (value.length <= 10) {
    return "••••••"
  }

  return `${value.slice(0, 4)}••••••${value.slice(-4)}`
}

function formatWireApi(value: LocalLlmConfigItem["wireApi"]) {
  return value === "responses" ? "Responses" : "Chat Completions"
}

function createEmptyForm(): LocalLlmConfigItem {
  return createDefaultLlmConfigItem()
}

export default function LlmAccessPage() {
  const [store, setStore] = useState<LocalLlmConfigStore>({ selectedConfigId: null, items: [] })
  const [form, setForm] = useState<LocalLlmConfigItem>(() => createEmptyForm())
  const [notice, setNotice] = useState("")
  const selectedConfig = useMemo(
    () => store.items.find((item) => item.id === store.selectedConfigId) ?? null,
    [store],
  )
  const activeCount = store.items.filter((item) => item.enabled).length

  function reloadStore() {
    setStore(readLocalLlmConfigStore())
  }

  useEffect(() => {
    reloadStore()

    function handleChanged() {
      reloadStore()
    }

    window.addEventListener(localLlmConfigChangedEventName, handleChanged)

    return () => {
      window.removeEventListener(localLlmConfigChangedEventName, handleChanged)
    }
  }, [])

  function handleSave() {
    const nextForm: LocalLlmConfigItem = {
      ...form,
      name: form.name.trim(),
      providerName: form.providerName?.trim() || "OpenAI Compatible",
      baseURL: form.baseURL.trim(),
      model: form.model.trim(),
      apiKey: form.apiKey.trim(),
      wireApi: form.wireApi === "responses" ? "responses" : "chat_completions",
      reasoningEffort: form.reasoningEffort,
    }

    if (!nextForm.name || !nextForm.baseURL || !nextForm.model || !nextForm.apiKey) {
      setNotice("请完整填写名称、Base URL、Model 和 API Key。")
      return
    }

    const savedItem = upsertLocalLlmConfigItem(nextForm)
    const nextStore = readLocalLlmConfigStore()

    setStore(nextStore)
    setForm(savedItem)
    setNotice("配置已保存到当前浏览器。")
  }

  function handleNew() {
    setForm(createEmptyForm())
    setNotice("")
  }

  function handleEdit(item: LocalLlmConfigItem) {
    setForm(item)
    setNotice("")
  }

  function handleDelete(id: string) {
    deleteLocalLlmConfigItem(id)
    setStore(readLocalLlmConfigStore())

    if (form.id === id) {
      setForm(createEmptyForm())
    }

    setNotice("配置已从当前浏览器删除。")
  }

  function handleSelect(id: string | null) {
    selectLocalLlmConfig(id)
    setStore(readLocalLlmConfigStore())
    setNotice(id ? "已设为聊天默认 LLM。" : "已切回平台默认 LLM。")
  }

  function handleToggle(item: LocalLlmConfigItem) {
    const nextItem = {
      ...item,
      enabled: !item.enabled,
    }

    upsertLocalLlmConfigItem(nextItem)
    setStore(readLocalLlmConfigStore())

    if (form.id === item.id) {
      setForm(nextItem)
    }
  }

  function handleClearAll() {
    saveLocalLlmConfigStore({ selectedConfigId: null, items: [] })
    setStore({ selectedConfigId: null, items: [] })
    setForm(createEmptyForm())
    setNotice("全部本机 LLM 配置已清空。")
  }

  return (
    <DashboardShell title="LLM 接入">
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50/70">
        <section className="bg-white px-5 pt-5 lg:px-8">
          <div className="border-b border-slate-200 pb-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
              <div className="flex min-w-0 gap-4">
                <span className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 sm:flex">
                  <PlugZap className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span>LLM 接入</span>
                    <span className="h-px w-8 bg-slate-200" />
                    <span>Local providers</span>
                  </div>
                  <p className="mt-2 max-w-2xl text-[15px] font-normal leading-7 text-slate-600">
                    为当前浏览器配置多个 OpenAI-compatible 服务，支持 Chat Completions 与 Responses 两种协议。Codex 同款中转需要选择 Responses；API Key 只保存在本机。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-slate-200 pt-3 lg:border-t-0 lg:pt-0">
                {[
                  { label: "配置", value: String(store.items.length), icon: PlugZap },
                  { label: "启用", value: String(activeCount), icon: Power },
                  { label: "默认", value: selectedConfig ? selectedConfig.model : "平台", icon: RadioTower },
                ].map((item, index) => {
                  const Icon = item.icon

                  return (
                    <div className={index === 0 ? "pr-4" : "border-l border-slate-200 px-4 last:pr-0"} key={item.label}>
                      <div className="mb-2 flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Icon className="size-3.5" />
                      </div>
                      <p className="text-[10px] font-medium text-slate-400">{item.label}</p>
                      <p className="mt-1 truncate text-sm font-medium leading-none text-slate-600">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-5 lg:px-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            <section className="bg-white p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <KeyRound className="size-4 text-slate-500" />
                    配置编辑
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">保存后仅写入当前浏览器。</p>
                </div>
                <button
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  onClick={handleNew}
                  type="button"
                >
                  <Plus className="size-3.5" />
                  新建
                </button>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-400">名称</span>
                  <input
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setForm((current) => ({ ...current, name: value }))
                      setNotice("")
                    }}
                    placeholder="例如：OpenAI 主账号"
                    value={form.name}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Provider</span>
                  <input
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setForm((current) => ({ ...current, providerName: value }))
                      setNotice("")
                    }}
                    placeholder="OpenAI Compatible"
                    value={form.providerName ?? ""}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Base URL</span>
                  <input
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setForm((current) => ({ ...current, baseURL: value }))
                      setNotice("")
                    }}
                    placeholder="https://api.openai.com/v1 或 https://tocodex.space"
                    value={form.baseURL}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Wire API</span>
                  <select
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-slate-400"
                    onChange={(event) => {
                      const value = event.currentTarget.value === "responses" ? "responses" : "chat_completions"
                      setForm((current) => ({ ...current, wireApi: value }))
                      setNotice("")
                    }}
                    value={form.wireApi ?? "chat_completions"}
                  >
                    <option value="chat_completions">Chat Completions</option>
                    <option value="responses">Responses</option>
                  </select>
                  <span className="text-[11px] leading-5 text-slate-400">
                    使用类似 Codex `wire_api = responses` 的中转时，请选择 Responses。
                  </span>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Model</span>
                  <input
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setForm((current) => ({ ...current, model: value }))
                      setNotice("")
                    }}
                    placeholder="gpt-4o-mini"
                    value={form.model}
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-400">Reasoning Effort</span>
                  <select
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-slate-400"
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      const reasoningEffort = ["minimal", "low", "medium", "high"].includes(value)
                        ? value as LocalLlmConfigItem["reasoningEffort"]
                        : undefined
                      setForm((current) => ({ ...current, reasoningEffort }))
                      setNotice("")
                    }}
                    value={form.reasoningEffort ?? ""}
                  >
                    <option value="">默认</option>
                    <option value="minimal">minimal</option>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-slate-400">API Key</span>
                  <input
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-300 focus:border-slate-400"
                    onChange={(event) => {
                      const value = event.currentTarget.value
                      setForm((current) => ({ ...current, apiKey: value }))
                      setNotice("")
                    }}
                    placeholder="sk-..."
                    type="password"
                    value={form.apiKey}
                  />
                </label>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span>
                    <span className="block text-sm font-medium text-slate-700">启用配置</span>
                    <span className="mt-1 block text-xs text-slate-400">停用后聊天框不会使用它。</span>
                  </span>
                  <button
                    aria-pressed={form.enabled}
                    className={form.enabled ? "h-5 w-9 rounded-full bg-slate-950 p-0.5" : "h-5 w-9 rounded-full bg-slate-200 p-0.5"}
                    onClick={() => setForm((current) => ({ ...current, enabled: !current.enabled }))}
                    type="button"
                  >
                    <span className={form.enabled ? "ml-auto block size-4 rounded-full bg-white" : "block size-4 rounded-full bg-white"} />
                  </button>
                </div>

                {notice ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">{notice}</p>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="h-9 rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    onClick={handleSave}
                    type="button"
                  >
                    保存配置
                  </button>
                  <button
                    className="h-9 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    onClick={handleClearAll}
                    type="button"
                  >
                    清空全部
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-white p-5">
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <RadioTower className="size-4 text-slate-500" />
                  本机配置列表
                </p>
                <button
                  className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  onClick={() => handleSelect(null)}
                  type="button"
                >
                  使用平台默认
                </button>
              </div>

              {store.items.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
                  <PlugZap className="size-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">还没有本机 LLM 配置</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                    新建一个 OpenAI-compatible 配置后，聊天输入框里就可以选择它，并按指定协议转发请求。
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {store.items.map((item) => {
                    const isSelected = item.id === store.selectedConfigId

                    return (
                      <article
                        className={
                          isSelected
                            ? "border border-slate-950 bg-slate-50 p-4"
                            : "border border-slate-200 bg-white p-4"
                        }
                        key={item.id}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-950">{item.name}</p>
                              {isSelected ? (
                                <span className="inline-flex h-6 items-center gap-1 rounded-full bg-slate-950 px-2 text-[11px] font-medium text-white">
                                  <CheckCircle2 className="size-3" />
                                  默认
                                </span>
                              ) : null}
                              <span className={item.enabled ? "inline-flex h-6 items-center rounded-full bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700" : "inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-[11px] font-medium text-slate-500"}>
                                {item.enabled ? "启用" : "停用"}
                              </span>
                            </div>
                            <p className="mt-2 break-all text-xs leading-5 text-slate-500">{item.baseURL}</p>
                            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-5">
                              <span className="truncate">Model: {item.model}</span>
                              <span className="truncate">协议: {formatWireApi(item.wireApi)}</span>
                              <span className="truncate">推理: {item.reasoningEffort ?? "默认"}</span>
                              <span className="truncate">Key: {maskApiKey(item.apiKey)}</span>
                              <span className="truncate">更新: {formatDateTime(item.updatedAtMs)}</span>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              onClick={() => handleSelect(item.id)}
                              type="button"
                            >
                              <RadioTower className="size-3.5" />
                              设为默认
                            </button>
                            <button
                              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              onClick={() => handleEdit(item)}
                              type="button"
                            >
                              <PencilLine className="size-3.5" />
                              编辑
                            </button>
                            <button
                              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              onClick={() => handleToggle(item)}
                              type="button"
                            >
                              <Power className="size-3.5" />
                              {item.enabled ? "停用" : "启用"}
                            </button>
                            <button
                              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-red-100 bg-white px-3 text-xs font-medium text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(item.id)}
                              type="button"
                            >
                              <Trash2 className="size-3.5" />
                              删除
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <ShieldCheck className="size-4 text-slate-500" />
                  数据边界
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  本页配置只写入当前浏览器的 localStorage。聊天时选中的配置会临时发送给 api 子站用于本次代理请求，不进入 D1，也不会写入用户资料。
                </p>
              </div>
            </section>
          </div>
        </section>
      </main>
    </DashboardShell>
  )
}
