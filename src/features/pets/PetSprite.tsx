import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'
import type { PetSpecies } from '../../data/petConfig'

/**
 * 펫 외형. 루미·몬스터와 같은 그림체(굵은 외곽선, 왼쪽 위 광원, 부드러운 명암)로 그린다.
 * 좌표계 100x100. 그라디언트 id는 useId로 만들어 도감처럼 여러 개를 나란히 그려도 충돌하지 않는다.
 */
export function PetSprite({
  species,
  size = 64,
  idle = false,
}: {
  species: PetSpecies
  size?: number
  /** 살짝 숨쉬는 동작 */
  idle?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const { color, accent, shape, name } = species
  const bodyId = `pet-${uid}`
  const shadeId = `pet-shade-${uid}`
  const outline = '#10192b'

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={name}
      style={{ overflow: 'visible' }}
      animate={idle && !reduceMotion ? { y: [0, -2.5, 0], scaleY: [1, 1.03, 1] } : undefined}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id={bodyId} cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="38%" stopColor={color} />
          <stop offset="100%" stopColor={accent} />
        </radialGradient>
        <linearGradient id={shadeId} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="55%" stopColor={accent} stopOpacity="0" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {shape === 'wing' && (
        <g stroke={outline} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M 26 46 q -20 -12 -22 4 q -2 14 18 10 Z" fill={color} opacity="0.95" />
          <path d="M 74 46 q 20 -12 22 4 q 2 14 -18 10 Z" fill={color} opacity="0.95" />
        </g>
      )}

      {shape === 'ear' && (
        <g stroke={outline} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M 34 30 q -6 -20 2 -24 q 8 4 12 18 Z" fill={accent} />
          <path d="M 66 30 q 6 -20 -2 -24 q -8 4 -12 18 Z" fill={accent} />
        </g>
      )}

      {shape === 'horn' && (
        <g stroke={outline} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M 36 26 L 30 6 L 46 22 Z" fill={accent} />
          <path d="M 64 26 L 70 6 L 54 22 Z" fill={accent} />
        </g>
      )}

      {/* 발 */}
      <ellipse cx="34" cy="86" rx="12" ry="7" fill={accent} stroke={outline} strokeWidth="2.5" />
      <ellipse cx="66" cy="86" rx="12" ry="7" fill={accent} stroke={outline} strokeWidth="2.5" />

      {/* 몸통 + 머리 (한 덩어리 실루엣) */}
      <path
        d="M 50 20 Q 80 20 82 48 Q 84 84 50 84 Q 16 84 18 48 Q 20 20 50 20 Z"
        fill={`url(#${bodyId})`}
        stroke={outline}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M 50 20 Q 80 20 82 48 Q 84 84 50 84 Q 16 84 18 48 Q 20 20 50 20 Z"
        fill={`url(#${shadeId})`}
      />
      {/* 배 무늬 */}
      <ellipse cx="50" cy="66" rx="16" ry="12" fill="#ffffff" opacity="0.22" />
      {/* 하이라이트 */}
      <ellipse cx="36" cy="34" rx="9" ry="6" fill="#ffffff" opacity="0.6" transform="rotate(-22 36 34)" />

      {/* 얼굴 */}
      <ellipse cx="40" cy="46" rx="4.4" ry="5.6" fill={outline} />
      <ellipse cx="60" cy="46" rx="4.4" ry="5.6" fill={outline} />
      <circle cx="41.6" cy="44" r="1.7" fill="#ffffff" />
      <circle cx="61.6" cy="44" r="1.7" fill="#ffffff" />
      <path d="M 43 58 q 7 7 14 0" stroke={outline} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <ellipse cx="31" cy="55" rx="5" ry="3" fill="#fb7185" opacity="0.5" />
      <ellipse cx="69" cy="55" rx="5" ry="3" fill="#fb7185" opacity="0.5" />
    </motion.svg>
  )
}

/** 도감에서 아직 못 만난 펫 */
export function UnknownPet({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="미발견 펫">
      <path
        d="M 50 20 Q 80 20 82 48 Q 84 84 50 84 Q 16 84 18 48 Q 20 20 50 20 Z"
        fill="#1a2234"
        stroke="#28334a"
        strokeWidth="3"
      />
      <text x="50" y="62" textAnchor="middle" fontSize="30" fill="#3d4a66" fontWeight="bold">
        ?
      </text>
    </svg>
  )
}
