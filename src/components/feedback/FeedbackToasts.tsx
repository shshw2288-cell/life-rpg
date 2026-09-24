import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useGameStore, type FeedbackItem } from '../../store/useGameStore'

const TONE: Record<FeedbackItem['kind'], string> = {
  reward: 'border-mana-500 bg-abyss-800',
  penalty: 'border-vital-500 bg-abyss-800',
  levelup: 'border-ember-400 bg-abyss-800',
  evolve: 'border-ember-400 bg-abyss-800',
  egg: 'border-emerald-500 bg-abyss-800',
  hatch: 'border-emerald-400 bg-abyss-800',
  death: 'border-vital-500 bg-abyss-800',
}

function Toast({ item }: { item: FeedbackItem }) {
  const dismiss = useGameStore((state) => state.dismissFeedback)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), 3200)
    return () => clearTimeout(timer)
  }, [dismiss, item.id])

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22 }}
      className={`w-64 rounded-xl border-l-4 px-3 py-2 shadow-lg ${TONE[item.kind]}`}
    >
      <button type="button" onClick={() => dismiss(item.id)} className="w-full text-left">
        <p className="text-sm font-semibold text-slate-100">{item.title}</p>
        {item.detail && <p className="text-xs text-slate-400">{item.detail}</p>}
      </button>
    </motion.li>
  )
}

export function FeedbackToasts() {
  const feedback = useGameStore((state) => state.feedback)

  return (
    <ul
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col-reverse gap-2 [&>*]:pointer-events-auto"
    >
      <AnimatePresence initial={false}>
        {feedback.slice(-4).map((item) => (
          <Toast key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </ul>
  )
}
