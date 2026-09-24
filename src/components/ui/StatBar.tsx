interface StatBarProps {
  label: string
  current: number
  max: number
  /** 막대 색상 클래스 */
  tone: 'vital' | 'mana'
}

const TONE_CLASS = {
  vital: 'bg-vital-500',
  mana: 'bg-mana-500',
} as const

export function StatBar({ label, current, max, tone }: StatBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0

  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-xs font-semibold text-slate-400">{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={`${current} / ${max}`}
        className="h-2.5 w-32 overflow-hidden rounded-full bg-abyss-700"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${TONE_CLASS[tone]}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-300">
        {current} / {max}
      </span>
    </div>
  )
}
