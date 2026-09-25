import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { useEffectStore, type Burst } from './effectStore'

const TONE_COLOR = {
  exp: '#818cf8',
  gold: '#facc15',
  hp: '#f87171',
  plain: '#e2e8f0',
} as const

const PARTICLE_COUNT = 10

/**
 * 클릭 지점에서 터지는 보상 연출.
 * 화면 맨 위에 고정으로 깔리며 클릭을 가로채지 않는다.
 */
export function EffectLayer() {
  const bursts = useEffectStore((state) => state.bursts)

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <AnimatePresence>
        {bursts.map((burst) => (
          <BurstView key={burst.id} burst={burst} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function BurstView({ burst }: { burst: Burst }) {
  const remove = useEffectStore((state) => state.remove)
  const reduceMotion = useReducedMotion()
  const accent = burst.kind === 'penalty' ? '#f87171' : '#fbbf24'

  useEffect(() => {
    const timer = setTimeout(() => remove(burst.id), burst.levelUp ? 1600 : 1100)
    return () => clearTimeout(timer)
  }, [burst.id, burst.levelUp, remove])

  return (
    <>
      {/* 퍼지는 고리 */}
      {!reduceMotion && (
        <motion.span
          className="absolute rounded-full border-2"
          style={{
            left: burst.x,
            top: burst.y,
            borderColor: accent,
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ width: 8, height: 8, opacity: 0.9 }}
          animate={{ width: 90, height: 90, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}

      {/* 튀는 입자 */}
      {!reduceMotion &&
        Array.from({ length: PARTICLE_COUNT }).map((_, index) => {
          const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4
          const distance = 42 + Math.random() * 34
          return (
            <motion.span
              key={index}
              className="absolute rounded-full"
              style={{
                left: burst.x,
                top: burst.y,
                width: index % 3 === 0 ? 7 : 4,
                height: index % 3 === 0 ? 7 : 4,
                backgroundColor: index % 2 === 0 ? accent : TONE_COLOR.exp,
              }}
              initial={{ x: -2, y: -2, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance + 14,
                opacity: 0,
                scale: 0.3,
              }}
              transition={{ duration: 0.65 + Math.random() * 0.25, ease: 'easeOut' }}
            />
          )
        })}

      {/* 떠오르는 숫자 */}
      {burst.labels.map((label, index) => (
        <motion.span
          key={label.text + index}
          className="absolute whitespace-nowrap text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          style={{
            left: burst.x,
            top: burst.y,
            color: TONE_COLOR[label.tone],
            translateX: '-50%',
          }}
          initial={{ y: -6, opacity: 0, scale: 0.7 }}
          animate={{ y: -46 - index * 22, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 1, delay: index * 0.09, ease: 'easeOut' }}
        >
          {label.text}
        </motion.span>
      ))}

      {/* 레벨업은 화면 가운데에 크게 */}
      {burst.levelUp && (
        <motion.div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 text-center"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.15, 1, 1] }}
          transition={{ duration: 1.5, times: [0, 0.2, 0.7, 1] }}
        >
          <p className="text-4xl font-black tracking-tight text-ember-400 drop-shadow-[0_0_18px_rgba(251,191,36,0.6)]">
            LEVEL UP!
          </p>
        </motion.div>
      )}
    </>
  )
}
