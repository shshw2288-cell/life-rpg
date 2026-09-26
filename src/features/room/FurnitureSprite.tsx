import type { FurnitureDef } from '../../data/roomConfig'

/**
 * 가구 그림.
 *
 * 좌표계는 가로 100 x 세로 100을 한 칸으로 보고, 2칸짜리는 200x100을 쓴다.
 * 모두 바닥(y=100)에 붙어 서도록 그려 격자에 놓았을 때 줄이 맞는다.
 * 외부 이미지 없이 SVG로만 그리며, 굵은 외곽선·왼쪽 위 광원으로 다른 아트와 톤을 맞춘다.
 */

const OUTLINE = '#2a2033'

export function FurnitureSprite({ def, size = 76 }: { def: FurnitureDef; size?: number }) {
  const width = 100 * def.size.w
  const height = 100 * def.size.h

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size * def.size.w}
      height={size * def.size.h}
      role="img"
      aria-label={def.name}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <FurnitureShapes art={def.art} />
    </svg>
  )
}

/** svg 껍데기 없이 그림만. 방 격자처럼 크기를 밖에서 정할 때 쓴다. */
export function FurnitureShapes({ art }: { art: FurnitureDef['art'] }) {
  switch (art) {
    case 'desk':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="10" y="44" width="180" height="14" rx="5" fill="#b07f4e" />
          <rect x="14" y="44" width="172" height="5" fill="#cf9c65" stroke="none" />
          <rect x="22" y="58" width="14" height="40" rx="4" fill="#8a5f36" />
          <rect x="164" y="58" width="14" height="40" rx="4" fill="#8a5f36" />
          <rect x="106" y="58" width="72" height="40" rx="5" fill="#9c6b3e" />
          <rect x="118" y="70" width="48" height="5" rx="2.5" fill="#6d4526" stroke="none" />
          {/* 책과 컵 */}
          <rect x="30" y="30" width="44" height="8" rx="3" fill="#60a5fa" />
          <rect x="34" y="22" width="40" height="8" rx="3" fill="#f472b6" />
          <path d="M 128 30 h 20 v 14 h -20 Z" fill="#e2e8f0" />
          <path d="M 148 33 q 8 4 0 8" fill="none" />
        </g>
      )

    case 'bed':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="8" y="34" width="20" height="64" rx="6" fill="#8a5f36" />
          <rect x="172" y="52" width="20" height="46" rx="6" fill="#8a5f36" />
          <rect x="20" y="62" width="160" height="30" rx="8" fill="#f8fafc" />
          <path d="M 76 62 h 104 a 8 8 0 0 1 8 8 v 14 a 8 8 0 0 1 -8 8 H 76 Z" fill="#7dd3fc" />
          <path d="M 76 70 h 104" stroke="#38bdf8" strokeWidth="3" />
          <rect x="30" y="48" width="44" height="22" rx="9" fill="#fef3c7" />
          <ellipse cx="46" cy="56" rx="7" ry="4" fill="#ffffff" stroke="none" opacity="0.8" />
        </g>
      )

    case 'window':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="24" y="16" width="152" height="74" rx="8" fill="#7ba8c9" />
          <path d="M 28 74 q 40 -16 72 -4 q 36 12 72 -6 v 22 h -144 Z" fill="#5f9e6b" stroke="none" />
          <circle cx="146" cy="38" r="12" fill="#fef3c7" stroke="none" />
          <ellipse cx="66" cy="34" rx="20" ry="8" fill="#eef6ff" stroke="none" opacity="0.9" />
          <path d="M 100 16 v 74 M 24 53 h 152" strokeWidth="5" />
          <rect x="24" y="16" width="152" height="74" rx="8" fill="none" strokeWidth="5" />
          {/* 커튼 */}
          <path d="M 14 10 q 14 40 4 84 h -14 V 10 Z" fill="#f9a8d4" />
          <path d="M 186 10 q -14 40 -4 84 h 14 V 10 Z" fill="#f9a8d4" />
        </g>
      )

    case 'plant_small':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <path d="M 50 54 q -26 -6 -26 -26 q 18 -2 26 20" fill="#4ade80" />
          <path d="M 50 54 q 26 -10 26 -32 q -20 2 -26 26" fill="#22c55e" />
          <path d="M 50 56 v -22" strokeWidth="4" />
          <path d="M 30 62 h 40 l -6 34 h -28 Z" fill="#d97706" />
          <rect x="26" y="54" width="48" height="12" rx="4" fill="#f59e0b" />
        </g>
      )

    case 'sprout_pot':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <circle cx="50" cy="40" r="26" fill="#bbf7d0" stroke="none" opacity="0.35" />
          <path d="M 50 58 q -22 -4 -22 -22 q 16 -2 22 18" fill="#86efac" />
          <path d="M 50 58 q 22 -8 22 -28 q -18 2 -22 22" fill="#4ade80" />
          <path d="M 50 60 v -24" />
          <path d="M 30 64 h 40 l -6 32 h -28 Z" fill="#a16207" />
          <rect x="26" y="56" width="48" height="12" rx="4" fill="#ca8a04" />
          <circle cx="62" cy="30" r="3.6" fill="#fef08a" stroke="none" />
          <circle cx="36" cy="24" r="2.6" fill="#fef08a" stroke="none" />
        </g>
      )

    case 'bookshelf':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="18" y="14" width="64" height="84" rx="5" fill="#8a5f36" />
          <rect x="24" y="20" width="52" height="24" fill="#5b3c20" />
          <rect x="24" y="50" width="52" height="24" fill="#5b3c20" />
          <rect x="24" y="80" width="52" height="16" fill="#5b3c20" />
          <g stroke="none">
            <rect x="28" y="24" width="8" height="18" rx="2" fill="#f87171" />
            <rect x="38" y="26" width="7" height="16" rx="2" fill="#60a5fa" />
            <rect x="47" y="23" width="9" height="19" rx="2" fill="#fbbf24" />
            <rect x="58" y="27" width="7" height="15" rx="2" fill="#a78bfa" />
            <rect x="28" y="56" width="7" height="16" rx="2" fill="#34d399" />
            <rect x="37" y="54" width="9" height="18" rx="2" fill="#f472b6" />
            <rect x="48" y="57" width="8" height="15" rx="2" fill="#93c5fd" />
          </g>
        </g>
      )

    case 'book_stack':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="18" y="78" width="66" height="16" rx="4" fill="#60a5fa" />
          <rect x="22" y="62" width="58" height="16" rx="4" fill="#f472b6" />
          <rect x="26" y="46" width="50" height="16" rx="4" fill="#fbbf24" />
          <rect x="30" y="32" width="42" height="14" rx="4" fill="#34d399" />
          <path d="M 26 86 h 50 M 30 70 h 42 M 34 54 h 34" strokeWidth="2.5" opacity="0.5" />
        </g>
      )

    case 'star_lamp':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <circle cx="50" cy="30" r="26" fill="#fde68a" stroke="none" opacity="0.35" />
          <path d="M 46 96 h 8 V 40 h -8 Z" fill="#94a3b8" />
          <ellipse cx="50" cy="96" rx="24" ry="7" fill="#64748b" />
          <path d="M 50 8 l 8 16 l 18 3 l -13 13 l 3 18 l -16 -9 l -16 9 l 3 -18 l -13 -13 l 18 -3 Z" fill="#fcd34d" />
          <circle cx="50" cy="30" r="5" fill="#fffbeb" stroke="none" />
        </g>
      )

    case 'rug':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <ellipse cx="100" cy="72" rx="86" ry="24" fill="#c084fc" />
          <ellipse cx="100" cy="72" rx="62" ry="16" fill="#e9d5ff" />
          <ellipse cx="100" cy="72" rx="32" ry="8" fill="#a855f7" />
          <g stroke="none" fill="#f5f3ff">
            <circle cx="52" cy="72" r="3" />
            <circle cx="148" cy="72" r="3" />
          </g>
        </g>
      )

    case 'dumbbell':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="24" y="62" width="52" height="9" rx="4" fill="#94a3b8" />
          <rect x="14" y="52" width="14" height="29" rx="5" fill="#475569" />
          <rect x="72" y="52" width="14" height="29" rx="5" fill="#475569" />
          <rect x="30" y="82" width="40" height="7" rx="3.5" fill="#94a3b8" />
          <rect x="22" y="76" width="11" height="20" rx="4" fill="#334155" />
          <rect x="67" y="76" width="11" height="20" rx="4" fill="#334155" />
        </g>
      )

    case 'medal':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="34" y="14" width="32" height="8" rx="4" fill="#64748b" />
          <path d="M 42 22 L 50 56 L 58 22 Z" fill="#f87171" />
          <path d="M 50 22 L 50 56" strokeWidth="2.5" opacity="0.5" />
          <circle cx="50" cy="70" r="20" fill="#fbbf24" />
          <circle cx="50" cy="70" r="12" fill="#fcd34d" />
          <path d="M 50 62 l 2.6 5.4 l 6 0.9 l -4.3 4.2 l 1 6 l -5.3 -2.8 l -5.3 2.8 l 1 -6 l -4.3 -4.2 l 6 -0.9 Z" fill="#b45309" stroke="none" />
        </g>
      )

    case 'yoga_mat':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="16" y="72" width="128" height="20" rx="8" fill="#5eead4" />
          <rect x="16" y="72" width="128" height="7" rx="3" fill="#99f6e4" stroke="none" />
          <ellipse cx="164" cy="72" rx="22" ry="22" fill="#2dd4bf" />
          <ellipse cx="164" cy="72" rx="9" ry="9" fill="#0f766e" />
          <path d="M 40 82 h 90" strokeWidth="2.5" opacity="0.45" />
        </g>
      )

    case 'trophy':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <path d="M 30 18 h 40 v 22 a 20 20 0 0 1 -40 0 Z" fill="#fbbf24" />
          <path d="M 30 22 q -16 0 -16 10 q 0 10 16 12" fill="none" strokeWidth="5" />
          <path d="M 70 22 q 16 0 16 10 q 0 10 -16 12" fill="none" strokeWidth="5" />
          <rect x="44" y="60" width="12" height="14" fill="#d97706" />
          <rect x="30" y="74" width="40" height="10" rx="3" fill="#b45309" />
          <rect x="24" y="84" width="52" height="12" rx="4" fill="#78350f" />
          <path d="M 42 26 q 8 10 16 0" stroke="#fde68a" strokeWidth="3" fill="none" />
        </g>
      )

    case 'mushroom_lamp':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <circle cx="50" cy="52" r="34" fill="#5eead4" stroke="none" opacity="0.3" />
          <rect x="42" y="56" width="16" height="36" rx="7" fill="#ecfeff" />
          <path d="M 16 58 q 6 -38 34 -38 q 28 0 34 38 Z" fill="#5eead4" />
          <circle cx="34" cy="38" r="5" fill="#ffffff" stroke="none" opacity="0.9" />
          <circle cx="58" cy="30" r="4" fill="#ffffff" stroke="none" opacity="0.9" />
          <circle cx="66" cy="46" r="3.4" fill="#ffffff" stroke="none" opacity="0.8" />
          <ellipse cx="50" cy="94" rx="24" ry="6" fill="#334155" />
        </g>
      )

    case 'wind_chime':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="24" y="14" width="52" height="10" rx="5" fill="#8a5f36" />
          <g strokeWidth="2.5">
            <path d="M 36 24 v 18 M 50 24 v 26 M 64 24 v 14" />
          </g>
          <rect x="30" y="42" width="12" height="28" rx="6" fill="#7dd3fc" />
          <rect x="44" y="50" width="12" height="32" rx="6" fill="#a5b4fc" />
          <rect x="58" y="38" width="12" height="24" rx="6" fill="#67e8f9" />
          <path d="M 50 82 v 8" strokeWidth="2.5" />
          <path d="M 42 90 h 16 l -8 8 Z" fill="#f9a8d4" />
        </g>
      )

    case 'star_frame':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <rect x="22" y="14" width="156" height="76" rx="8" fill="#3f3f66" />
          <rect x="32" y="24" width="136" height="56" rx="4" fill="#1a1b46" />
          <g fill="#e9e5ff" stroke="none">
            {[
              [52, 44],
              [78, 34],
              [104, 52],
              [130, 36],
              [152, 58],
              [66, 66],
              [116, 70],
            ].map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r={index % 3 === 0 ? 3.4 : 2.2} />
            ))}
          </g>
          <path
            d="M 52 44 L 78 34 L 104 52 L 130 36 L 152 58"
            stroke="#a5b4fc"
            strokeWidth="2"
            fill="none"
          />
        </g>
      )

    case 'starlight_trophy':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <circle cx="50" cy="40" r="34" fill="#c4b5fd" stroke="none" opacity="0.32" />
          <path
            d="M 50 8 l 9 19 l 21 3 l -15 15 l 4 21 l -19 -10 l -19 10 l 4 -21 l -15 -15 l 21 -3 Z"
            fill="#ddd6fe"
          />
          <circle cx="50" cy="34" r="6" fill="#ffffff" stroke="none" opacity="0.9" />
          <rect x="42" y="66" width="16" height="12" fill="#6d28d9" />
          <rect x="28" y="78" width="44" height="10" rx="3" fill="#4c1d95" />
          <rect x="22" y="88" width="56" height="10" rx="4" fill="#312e81" />
        </g>
      )

    case 'cushion':
      return (
        <g stroke={OUTLINE} strokeWidth="4" strokeLinejoin="round">
          <ellipse cx="50" cy="72" rx="38" ry="22" fill="#fb923c" />
          <ellipse cx="50" cy="68" rx="26" ry="13" fill="#fdba74" />
          <path d="M 26 62 q 24 -14 48 0" stroke="#c2410c" strokeWidth="3" fill="none" />
          <circle cx="50" cy="94" r="3" fill="#c2410c" stroke="none" />
        </g>
      )

    default:
      return null
  }
}
