import type { ReactNode } from 'react'

interface PageShellProps {
  title: string
  description?: string
  children: ReactNode
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {children}
    </div>
  )
}

/** 아직 데이터가 없을 때 보여주는 영역 */
export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-abyss-700 bg-abyss-900/50 px-6 py-10 text-center">
      <p className="text-sm text-slate-300">{message}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-abyss-700 bg-abyss-900 p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-300">{title}</h2>
      {children}
    </section>
  )
}
