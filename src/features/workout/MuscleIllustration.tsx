import type { MuscleGroup } from '../../types/workout'

/**
 * 부위별 일러스트. 외부 이미지 없이 SVG로 직접 그린다.
 * 몸 전체를 어둡게 깔고 해당 부위만 색으로 강조한다.
 * 등은 뒷모습, 나머지는 앞모습이다.
 */
export function MuscleIllustration({
  group,
  color,
  size = 120,
  dim = false,
}: {
  group: MuscleGroup
  color: string
  size?: number
  dim?: boolean
}) {
  const base = dim ? '#2a3348' : '#3b465f'
  const label = { chest: '가슴', back: '등', legs: '하체', shoulders: '어깨' }[group]

  return (
    <svg viewBox="0 0 120 160" width={size} height={size * (160 / 120)} role="img" aria-label={`${label} 부위`}>
      {/* 머리 */}
      <circle cx="60" cy="20" r="13" fill={base} />
      {/* 목 */}
      <rect x="54" y="31" width="12" height="7" fill={base} />

      {/* 몸통 */}
      <path
        d="M 38 40 Q 60 34 82 40 L 86 78 Q 60 86 34 78 Z"
        fill={base}
      />
      {/* 골반 */}
      <path d="M 36 78 Q 60 86 84 78 L 80 96 Q 60 102 40 96 Z" fill={base} />

      {/* 팔 */}
      <path d="M 38 41 L 26 48 L 20 88 L 29 90 L 35 54 Z" fill={base} />
      <path d="M 82 41 L 94 48 L 100 88 L 91 90 L 85 54 Z" fill={base} />

      {/* 다리 */}
      <path d="M 42 96 L 40 150 L 52 150 L 57 100 Z" fill={base} />
      <path d="M 78 96 L 80 150 L 68 150 L 63 100 Z" fill={base} />

      {/* ── 부위 강조 ───────────────────────────── */}
      {group === 'chest' && (
        <g fill={color}>
          <path d="M 42 44 Q 58 40 59 44 L 59 62 Q 46 64 41 58 Z" />
          <path d="M 78 44 Q 62 40 61 44 L 61 62 Q 74 64 79 58 Z" />
          <path d="M 44 66 Q 60 70 76 66 L 74 74 Q 60 78 46 74 Z" opacity="0.45" />
        </g>
      )}

      {group === 'back' && (
        <g fill={color}>
          {/* 광배근 */}
          <path d="M 40 44 Q 52 46 58 60 L 56 80 Q 42 76 36 62 Z" />
          <path d="M 80 44 Q 68 46 62 60 L 64 80 Q 78 76 84 62 Z" />
          {/* 승모근 */}
          <path d="M 44 40 Q 60 34 76 40 L 68 54 Q 60 48 52 54 Z" opacity="0.7" />
          {/* 기립근 */}
          <rect x="57" y="56" width="6" height="34" rx="3" opacity="0.6" />
        </g>
      )}

      {group === 'shoulders' && (
        <g fill={color}>
          <ellipse cx="38" cy="46" rx="13" ry="11" transform="rotate(-18 38 46)" />
          <ellipse cx="82" cy="46" rx="13" ry="11" transform="rotate(18 82 46)" />
          <path d="M 48 39 Q 60 35 72 39 L 70 45 Q 60 42 50 45 Z" opacity="0.55" />
        </g>
      )}

      {group === 'legs' && (
        <g fill={color}>
          {/* 대퇴사두 */}
          <path d="M 43 98 L 41 128 L 52 128 L 56 100 Z" />
          <path d="M 77 98 L 79 128 L 68 128 L 64 100 Z" />
          {/* 둔근 */}
          <path d="M 40 90 Q 60 98 80 90 L 79 98 Q 60 104 41 98 Z" opacity="0.6" />
          {/* 종아리 */}
          <path d="M 42 130 L 41 148 L 51 148 L 52 130 Z" opacity="0.75" />
          <path d="M 78 130 L 79 148 L 69 148 L 68 130 Z" opacity="0.75" />
        </g>
      )}
    </svg>
  )
}
