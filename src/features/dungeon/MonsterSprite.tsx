import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'

/** 층 몬스터든 보스든 그리는 데 필요한 최소 정보만 받는다 */
export interface SpriteMonster {
  id: string
  name: string
  color: string
  accent: string
  isBoss?: boolean
}

export type MonsterPose = 'idle' | 'attack' | 'hit' | 'charge' | 'heal' | 'defeat'

interface MonsterSpriteProps {
  monster: SpriteMonster
  size?: number
  /** 다음 턴에 강공격을 준비 중이면 표정이 바뀐다 */
  charging?: boolean
  defeated?: boolean
  pose?: MonsterPose
  shadow?: boolean
}

/**
 * 몬스터 외형. 외부 이미지 없이 SVG로 직접 그린다.
 *
 * 좌표계 160x160, 광원은 왼쪽 위.
 * 보스는 같은 몸체에 뿔·왕관·눈 장식을 더해 실루엣을 키운다.
 * 그라디언트 id는 useId로 만들어 같은 화면에 여러 마리가 나와도 충돌하지 않는다.
 */
export function MonsterSprite({
  monster,
  size = 150,
  charging = false,
  defeated = false,
  pose = 'idle',
  shadow = false,
}: MonsterSpriteProps) {
  const uid = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const boss = Boolean(monster.isBoss)
  const down = defeated || pose === 'defeat'
  const readyToHit = charging || pose === 'charge'

  const bodyId = `slime-${uid}`
  const shineId = `slime-shine-${uid}`
  const coreId = `slime-core-${uid}`

  const poseMotion = reduceMotion
    ? {}
    : down
      ? { scaleY: 0.55, scaleX: 1.2, y: 16, opacity: 0.45 }
      : {
          idle: { scaleY: [1, 0.94, 1.03, 1], scaleX: [1, 1.05, 0.98, 1], y: [0, 3, -2, 0] },
          attack: { x: [0, -22, 0], scaleX: [1, 1.12, 1] },
          hit: { x: [0, 14, 0], scaleY: [1, 0.86, 1] },
          charge: { scale: [1, 0.9, 1.04, 0.94], y: [0, 6, 0, 4] },
          heal: { scale: [1, 1.08, 1], y: [0, -6, 0] },
          defeat: { scaleY: 0.55, y: 16, opacity: 0.45 },
        }[pose]

  const poseTiming =
    pose === 'idle'
      ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const }
      : { duration: 0.45, ease: 'easeOut' as const }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {shadow && (
        <span
          aria-hidden
          className="absolute left-1/2 bottom-[8%] -translate-x-1/2 rounded-[50%] bg-black/45 blur-[3px]"
          style={{ width: size * (boss ? 0.6 : 0.5), height: size * 0.1 }}
        />
      )}

      <motion.svg
        viewBox="0 0 160 160"
        width={size}
        height={size}
        role="img"
        aria-label={`${monster.name}${readyToHit ? ' (기운을 모으는 중)' : ''}${down ? ' (쓰러짐)' : ''}`}
        animate={poseMotion}
        transition={poseTiming}
        style={{ position: 'relative', overflow: 'visible', transformOrigin: '80px 132px' }}
      >
        <defs>
          <radialGradient id={bodyId} cx="34%" cy="26%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="35%" stopColor={monster.color} />
            <stop offset="100%" stopColor={monster.accent} />
          </radialGradient>
          <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={coreId} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor={monster.accent} stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* 기운 모으는 중 표시 */}
        {readyToHit && !down && (
          <motion.circle
            cx="80"
            cy="100"
            r={boss ? 74 : 62}
            fill="#f97316"
            initial={{ opacity: 0.1 }}
            animate={reduceMotion ? { opacity: 0.2 } : { opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {boss && (
          <>
            {/* 보스 뿔 */}
            <path d="M 30 92 L 12 46 L 52 78 Z" fill={monster.accent} stroke="#0b0f18" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 130 92 L 148 46 L 108 78 Z" fill={monster.accent} stroke="#0b0f18" strokeWidth="3" strokeLinejoin="round" />
            <path d="M 30 92 L 20 62 L 44 82 Z" fill="#ffffff" opacity="0.25" />
            {/* 보스 왕관 */}
            <path
              d="M 58 50 L 63 28 L 72 42 L 80 22 L 88 42 L 97 28 L 102 50 Z"
              fill="#fbbf24"
              stroke="#0b0f18"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <rect x="56" y="48" width="48" height="8" rx="3" fill="#f59e0b" stroke="#0b0f18" strokeWidth="2.5" />
            <circle cx="80" cy="52" r="2.6" fill="#f87171" />
          </>
        )}

        {/* 몸통 */}
        <path
          d={
            boss
              ? 'M 14 128 Q 10 54 80 48 Q 150 54 146 128 Q 146 144 124 144 L 36 144 Q 14 144 14 128 Z'
              : 'M 24 126 Q 20 62 80 56 Q 140 62 136 126 Q 136 140 116 140 L 44 140 Q 24 140 24 126 Z'
          }
          fill={`url(#${bodyId})`}
          stroke="#0b0f18"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* 젤리 광택 */}
        <path
          d={
            boss
              ? 'M 26 116 Q 22 62 80 56 Q 138 62 134 116 Q 80 96 26 116 Z'
              : 'M 34 112 Q 30 68 80 63 Q 130 68 126 112 Q 80 94 34 112 Z'
          }
          fill={`url(#${shineId})`}
        />
        {/* 속 핵 */}
        <ellipse cx="80" cy="112" rx={boss ? 34 : 27} ry={boss ? 20 : 16} fill={`url(#${coreId})`} />
        {/* 하이라이트 물방울 */}
        <ellipse cx="54" cy="78" rx="13" ry="9" fill="#ffffff" opacity="0.72" transform="rotate(-22 54 78)" />
        <ellipse cx="70" cy="70" rx="4.5" ry="3.2" fill="#ffffff" opacity="0.55" />

        {/* 흘러내린 방울 */}
        <circle cx="44" cy="136" r={boss ? 9 : 7} fill={monster.color} stroke="#0b0f18" strokeWidth="2.5" />
        <circle cx="116" cy="138" r={boss ? 7 : 5.5} fill={monster.color} stroke="#0b0f18" strokeWidth="2.5" />

        {/* 얼굴 */}
        {down ? (
          <g stroke="#0b0f18" strokeWidth="4.5" strokeLinecap="round" fill="none">
            <path d="M 54 92 l 14 14 M 68 92 l -14 14" />
            <path d="M 92 92 l 14 14 M 106 92 l -14 14" />
            <path d="M 68 122 q 12 -8 24 0" />
          </g>
        ) : (
          <g>
            {/* 눈 흰자 → 눈동자 순으로 그려 표정이 또렷하게 보이게 한다 */}
            <ellipse cx="60" cy={boss ? 98 : 94} rx="11" ry={readyToHit ? 7 : 13} fill="#ffffff" stroke="#0b0f18" strokeWidth="2.5" />
            <ellipse cx="100" cy={boss ? 98 : 94} rx="11" ry={readyToHit ? 7 : 13} fill="#ffffff" stroke="#0b0f18" strokeWidth="2.5" />
            <ellipse cx={boss ? 62 : 60} cy={boss ? 100 : 96} rx="5.5" ry={readyToHit ? 4 : 7} fill="#0b0f18" />
            <ellipse cx={boss ? 102 : 100} cy={boss ? 100 : 96} rx="5.5" ry={readyToHit ? 4 : 7} fill="#0b0f18" />
            <circle cx={boss ? 64 : 62} cy={boss ? 96 : 92} r="2.4" fill="#ffffff" />
            <circle cx={boss ? 104 : 102} cy={boss ? 96 : 92} r="2.4" fill="#ffffff" />

            {/* 보스는 눈썹으로 사나운 인상을 준다 */}
            {boss && (
              <g stroke="#0b0f18" strokeWidth="5" strokeLinecap="round">
                <path d="M 48 80 L 70 88" />
                <path d="M 112 80 L 90 88" />
              </g>
            )}

            <path
              d={
                readyToHit
                  ? 'M 66 120 q 14 -10 28 0'
                  : boss
                    ? 'M 62 118 q 18 14 36 0 q -18 5 -36 0 Z'
                    : 'M 68 116 q 12 10 24 0'
              }
              stroke="#0b0f18"
              strokeWidth="3.6"
              fill={boss && !readyToHit ? '#3f1020' : 'none'}
              strokeLinecap="round"
            />
          </g>
        )}
      </motion.svg>
    </div>
  )
}
