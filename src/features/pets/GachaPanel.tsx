import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Panel } from '../../components/layout/PageShell'
import {
  EFFECT_IS_PERCENT,
  EFFECT_LABEL,
  GACHA,
  GRADES,
  GRADE_ORDER,
  effectValue,
} from '../../data/petConfig'
import type { DrawResult } from '../../engine/pets'
import { useGameStore } from '../../store/useGameStore'
import { PetSprite } from './PetSprite'

export function GachaPanel() {
  const tickets = useGameStore((state) => state.petTickets)
  const gold = useGameStore((state) => state.character.gold)
  const drawPet = useGameStore((state) => state.drawPet)
  const buyTicket = useGameStore((state) => state.buyTicket)
  const [results, setResults] = useState<DrawResult[] | null>(null)

  const handleDraw = (count: number) => {
    const drawn = drawPet(count)
    if (drawn.length > 0) setResults(drawn)
  }

  return (
    <>
      <Panel title="펫 뽑기">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-lg bg-abyss-800 px-3 py-1.5 text-sm">
            <Ticket size={16} className="text-ember-400" aria-hidden />
            <span className="tabular-nums text-slate-100">{tickets}</span>
            <span className="text-slate-400">장</span>
          </span>

          <button
            type="button"
            onClick={() => handleDraw(1)}
            disabled={tickets < 1}
            className="rounded-lg bg-ember-500 px-4 py-2 text-sm font-bold text-abyss-950 hover:bg-ember-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            1회 뽑기
          </button>

          <button
            type="button"
            onClick={() => handleDraw(GACHA.multiDrawCount)}
            disabled={tickets < GACHA.multiDrawCount}
            className="flex items-center gap-1.5 rounded-lg border border-ember-500 px-4 py-2 text-sm font-bold text-ember-400 hover:bg-abyss-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles size={15} aria-hidden />
            {GACHA.multiDrawCount}회 뽑기
            <span className="text-[10px] font-normal text-slate-400">
              {GACHA.multiDrawGuarantee}등급 이상 확정
            </span>
          </button>

          <button
            type="button"
            onClick={() => buyTicket(1)}
            disabled={gold < GACHA.ticketGoldCost}
            className="ml-auto rounded-lg border border-abyss-700 px-3 py-2 text-xs text-slate-300 hover:bg-abyss-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            뽑기권 구매 ({GACHA.ticketGoldCost} Gold)
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-abyss-700 pt-3">
          {GRADE_ORDER.map((grade) => (
            <span
              key={grade}
              className="rounded-md bg-abyss-800 px-2 py-1 text-[11px]"
              style={{ color: GRADES[grade].color }}
            >
              {grade} {Math.round(GRADES[grade].rate * 1000) / 10}%
            </span>
          ))}
          <span className="text-[11px] text-slate-500">
            중복이면 등급에 따라 Gold로 환급됩니다. 알을 부화시켜도 뽑기권 1장을 받습니다.
          </span>
        </div>
      </Panel>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="뽑기 결과"
          >
            <div className="w-full max-w-2xl rounded-2xl border border-abyss-700 bg-abyss-900 p-5">
              <h2 className="mb-4 text-lg font-bold text-slate-100">뽑기 결과</h2>

              <ul className="flex flex-wrap justify-center gap-3">
                {results.map((result, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.12, type: 'spring', stiffness: 220 }}
                    className={`flex w-32 flex-col items-center gap-1 rounded-xl border-2 bg-abyss-800 p-3 text-center ${GRADES[result.species.grade].ring}`}
                  >
                    <span
                      className="rounded px-1.5 text-[11px] font-bold"
                      style={{ color: GRADES[result.species.grade].color }}
                    >
                      {result.species.grade}
                    </span>
                    <PetSprite species={result.species} size={64} />
                    <span className="text-sm font-semibold text-slate-100">
                      {result.species.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {EFFECT_LABEL[result.species.effect]} +
                      {effectValue(result.species.grade, result.species.effect)}
                      {EFFECT_IS_PERCENT[result.species.effect] ? '%' : ''}
                    </span>
                    {result.duplicate && (
                      <span className="text-[10px] text-gold-400">
                        중복 · +{result.refundGold} Gold
                      </span>
                    )}
                  </motion.li>
                ))}
              </ul>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setResults(null)}
                  className="rounded-lg bg-ember-500 px-4 py-2 text-sm font-semibold text-abyss-950 hover:bg-ember-400"
                  autoFocus
                >
                  확인
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
