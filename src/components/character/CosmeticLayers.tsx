import { findCosmetic, type Cosmetic } from '../../data/shopConfig'
import type { CosmeticLoadout } from '../../types/battle'

/**
 * 꾸미기 아이템을 루미 위에 덧그린다.
 *
 * LumiAvatar의 200x200 좌표계를 그대로 쓴다.
 * 장착 기준점 (LumiAvatar와 반드시 같이 맞춰야 한다):
 *   머리 중심 (100, 86), 머리 반지름 46
 *   정수리 y = 40, 눈높이 y = 86, 볼 y = 100
 * 광원은 왼쪽 위.
 */

const HEAD = { cx: 100, cy: 86, r: 46, top: 40, eye: 86, cheek: 100 }

export function AuraLayer({ cosmetic }: { cosmetic: Cosmetic }) {
  const color = cosmetic.style.primary

  if (cosmetic.art === 'firefly_aura') {
    return (
      <g>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const angle = (index / 6) * Math.PI * 2
          return (
            <g key={index}>
              <circle
                cx={100 + Math.cos(angle) * 84}
                cy={108 + Math.sin(angle) * 74}
                r={index % 2 ? 3 : 4.5}
                fill={color}
                opacity={0.95}
              />
              <circle
                cx={100 + Math.cos(angle) * 84}
                cy={108 + Math.sin(angle) * 74}
                r={index % 2 ? 6 : 8}
                fill={color}
                opacity={0.22}
              />
            </g>
          )
        })}
      </g>
    )
  }

  if (cosmetic.art === 'stardust_aura') {
    return (
      <g>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
          const angle = (index / 8) * Math.PI * 2
          const x = 100 + Math.cos(angle) * 88
          const y = 108 + Math.sin(angle) * 78
          return (
            <path
              key={index}
              d={`M ${x} ${y - 6} L ${x + 1.8} ${y - 1.8} L ${x + 6} ${y} L ${x + 1.8} ${y + 1.8} L ${x} ${y + 6} L ${x - 1.8} ${y + 1.8} L ${x - 6} ${y} L ${x - 1.8} ${y - 1.8} Z`}
              fill={color}
              opacity={0.92}
            />
          )
        })}
      </g>
    )
  }

  // flame_aura
  return (
    <g opacity={0.8}>
      <circle cx="100" cy="112" r="92" fill={color} opacity="0.1" />
      {[0, 1, 2, 3, 4, 5, 6].map((index) => {
        const angle = (index / 7) * Math.PI * 2
        const x = 100 + Math.cos(angle) * 80
        const y = 112 + Math.sin(angle) * 72
        return (
          <path
            key={index}
            d={`M ${x} ${y + 9} Q ${x - 7} ${y} ${x} ${y - 14} Q ${x + 7} ${y} ${x} ${y + 9} Z`}
            fill={color}
          />
        )
      })}
    </g>
  )
}

export function HatLayer({ cosmetic }: { cosmetic: Cosmetic }) {
  const { primary, secondary } = cosmetic.style
  const outline = secondary ?? '#0f172a'

  switch (cosmetic.art) {
    case 'straw_hat':
      return (
        <g>
          {/* 챙은 머리 반지름보다 넓게 */}
          <ellipse cx={HEAD.cx} cy={HEAD.top + 14} rx="62" ry="15" fill={primary} stroke={outline} strokeWidth="2.5" />
          <path
            d={`M ${HEAD.cx - 30} ${HEAD.top + 14} Q ${HEAD.cx} ${HEAD.top - 30} ${HEAD.cx + 30} ${HEAD.top + 14} Z`}
            fill={primary}
            stroke={outline}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d={`M ${HEAD.cx - 30} ${HEAD.top + 8} Q ${HEAD.cx} ${HEAD.top + 1} ${HEAD.cx + 30} ${HEAD.top + 8} L ${HEAD.cx + 30} ${HEAD.top + 14} Q ${HEAD.cx} ${HEAD.top + 6} ${HEAD.cx - 30} ${HEAD.top + 14} Z`}
            fill={outline}
            opacity="0.85"
          />
        </g>
      )

    case 'wizard_hat':
      return (
        <g>
          <ellipse cx={HEAD.cx} cy={HEAD.top + 12} rx="54" ry="13" fill={outline} />
          <path
            d={`M ${HEAD.cx} ${HEAD.top - 46} Q ${HEAD.cx + 20} ${HEAD.top - 10} ${HEAD.cx + 32} ${HEAD.top + 12} L ${HEAD.cx - 32} ${HEAD.top + 12} Q ${HEAD.cx - 18} ${HEAD.top - 12} ${HEAD.cx} ${HEAD.top - 46} Z`}
            fill={primary}
            stroke={outline}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d={`M ${HEAD.cx - 30} ${HEAD.top + 4} Q ${HEAD.cx} ${HEAD.top - 4} ${HEAD.cx + 30} ${HEAD.top + 4} L ${HEAD.cx + 31} ${HEAD.top + 12} L ${HEAD.cx - 31} ${HEAD.top + 12} Z`}
            fill={outline}
            opacity="0.7"
          />
          <circle cx={HEAD.cx + 8} cy={HEAD.top - 20} r="3.4" fill="#fde68a" />
          <circle cx={HEAD.cx - 10} cy={HEAD.top - 4} r="2.4" fill="#fde68a" />
        </g>
      )

    case 'crown':
      return (
        <g>
          <path
            d={`M ${HEAD.cx - 34} ${HEAD.top + 14} L ${HEAD.cx - 28} ${HEAD.top - 20} L ${HEAD.cx - 13} ${HEAD.top + 2} L ${HEAD.cx} ${HEAD.top - 26} L ${HEAD.cx + 13} ${HEAD.top + 2} L ${HEAD.cx + 28} ${HEAD.top - 20} L ${HEAD.cx + 34} ${HEAD.top + 14} Z`}
            fill={primary}
            stroke={outline}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect
            x={HEAD.cx - 35}
            y={HEAD.top + 12}
            width="70"
            height="10"
            rx="4"
            fill={primary}
            stroke={outline}
            strokeWidth="2.5"
          />
          <circle cx={HEAD.cx} cy={HEAD.top + 17} r="4" fill="#f87171" stroke={outline} strokeWidth="1.5" />
          <circle cx={HEAD.cx - 28} cy={HEAD.top - 20} r="3" fill="#bfdbfe" />
          <circle cx={HEAD.cx + 28} cy={HEAD.top - 20} r="3" fill="#bfdbfe" />
        </g>
      )

    case 'ribbon':
      return (
        <g stroke={outline} strokeWidth="2.5" strokeLinejoin="round">
          <path d={`M ${HEAD.cx - 12} ${HEAD.top + 6} Q ${HEAD.cx - 40} ${HEAD.top - 12} ${HEAD.cx - 36} ${HEAD.top + 12} Q ${HEAD.cx - 33} ${HEAD.top + 26} ${HEAD.cx - 10} ${HEAD.top + 16} Z`} fill={primary} />
          <path d={`M ${HEAD.cx + 12} ${HEAD.top + 6} Q ${HEAD.cx + 40} ${HEAD.top - 12} ${HEAD.cx + 36} ${HEAD.top + 12} Q ${HEAD.cx + 33} ${HEAD.top + 26} ${HEAD.cx + 10} ${HEAD.top + 16} Z`} fill={primary} />
          <circle cx={HEAD.cx} cy={HEAD.top + 11} r="9" fill={primary} />
        </g>
      )

    case 'headphones':
      return (
        <g>
          <path
            d={`M ${HEAD.cx - 50} ${HEAD.eye} Q ${HEAD.cx - 50} ${HEAD.top - 18} ${HEAD.cx} ${HEAD.top - 18} Q ${HEAD.cx + 50} ${HEAD.top - 18} ${HEAD.cx + 50} ${HEAD.eye}`}
            stroke={outline}
            strokeWidth="13"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${HEAD.cx - 50} ${HEAD.eye} Q ${HEAD.cx - 50} ${HEAD.top - 14} ${HEAD.cx} ${HEAD.top - 14} Q ${HEAD.cx + 50} ${HEAD.top - 14} ${HEAD.cx + 50} ${HEAD.eye}`}
            stroke={primary}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <rect x={HEAD.cx - 62} y={HEAD.eye - 12} width="24" height="34" rx="11" fill={outline} />
          <rect x={HEAD.cx - 59} y={HEAD.eye - 9} width="18" height="28" rx="9" fill={primary} />
          <rect x={HEAD.cx + 38} y={HEAD.eye - 12} width="24" height="34" rx="11" fill={outline} />
          <rect x={HEAD.cx + 41} y={HEAD.eye - 9} width="18" height="28" rx="9" fill={primary} />
        </g>
      )

    default:
      return null
  }
}

/**
 * 망토. 몸통보다 먼저(뒤에) 그려야 하므로 LumiAvatar에서 호출 위치가 다르다.
 *
 * 루미는 머리(중심 100,86 · 반지름 46)가 몸통을 y=132까지 덮는다.
 * 그래서 망토는 목선 y=126 부터 시작해 몸통(x 57~143)보다 넓게 퍼지도록 그린다.
 */
export function CapeLayer({ cosmetic }: { cosmetic: Cosmetic }) {
  const { primary, secondary } = cosmetic.style
  const outline = secondary ?? '#0f172a'

  return (
    <g>
      {/* 망토 본체 — 몸통 밖으로 확실히 퍼지게 */}
      <path
        d="M 64 126 Q 100 114 136 126 L 166 180 Q 133 193 100 186 Q 67 193 34 180 Z"
        fill={primary}
        stroke={outline}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* 안감 그늘 (오른쪽이 그늘) */}
      <path d="M 100 118 L 136 126 L 166 180 Q 133 193 100 186 Z" fill={outline} opacity="0.28" />
      {/* 펄럭이는 주름 */}
      <g stroke={outline} strokeWidth="2.6" fill="none" opacity="0.65">
        <path d="M 78 130 q -10 28 -26 48" />
        <path d="M 122 130 q 10 28 26 48" />
        <path d="M 100 122 q 0 34 0 62" />
      </g>
      {/* 어깨 깃 — 머리 옆으로 살짝 보인다 */}
      <path
        d="M 64 126 q 36 -14 72 0 q -12 12 -36 12 q -24 0 -36 -12 Z"
        fill={primary}
        stroke={outline}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </g>
  )
}

export function FaceLayer({ cosmetic }: { cosmetic: Cosmetic }) {
  const { primary } = cosmetic.style

  switch (cosmetic.art) {
    case 'glasses':
      return (
        <g>
          <circle cx="83" cy={HEAD.eye} r="16" stroke={primary} strokeWidth="3.5" fill="#ffffff" fillOpacity="0.14" />
          <circle cx="117" cy={HEAD.eye} r="16" stroke={primary} strokeWidth="3.5" fill="#ffffff" fillOpacity="0.14" />
          <path d={`M 99 ${HEAD.eye} h 2`} stroke={primary} strokeWidth="3.5" />
          <path d={`M 67 ${HEAD.eye - 4} l -8 -3`} stroke={primary} strokeWidth="3" strokeLinecap="round" />
          <path d={`M 133 ${HEAD.eye - 4} l 8 -3`} stroke={primary} strokeWidth="3" strokeLinecap="round" />
          <path d="M 74 79 q 6 -5 12 -1" stroke="#ffffff" strokeWidth="2.6" opacity="0.6" fill="none" />
        </g>
      )

    case 'monocle':
      return (
        <g>
          <circle cx="117" cy={HEAD.eye} r="18" stroke={primary} strokeWidth="3.5" fill="#ffffff" fillOpacity="0.16" />
          <path d={`M 117 ${HEAD.eye + 18} q 5 20 -8 27`} stroke={primary} strokeWidth="2.6" fill="none" />
          <path d="M 108 78 q 7 -6 14 -2" stroke="#ffffff" strokeWidth="2.6" opacity="0.6" fill="none" />
        </g>
      )

    case 'blush':
      return (
        <g>
          <ellipse cx="68" cy={HEAD.cheek} rx="11" ry="6.5" fill={primary} opacity="0.65" />
          <ellipse cx="132" cy={HEAD.cheek} rx="11" ry="6.5" fill={primary} opacity="0.65" />
          <ellipse cx="66" cy={HEAD.cheek - 1} rx="4" ry="2.4" fill="#ffffff" opacity="0.4" />
          <ellipse cx="130" cy={HEAD.cheek - 1} rx="4" ry="2.4" fill="#ffffff" opacity="0.4" />
        </g>
      )

    default:
      return null
  }
}

export function useCosmetics(loadout: CosmeticLoadout) {
  return {
    hat: loadout.hat ? findCosmetic(loadout.hat) : undefined,
    face: loadout.face ? findCosmetic(loadout.face) : undefined,
    aura: loadout.aura ? findCosmetic(loadout.aura) : undefined,
    cape: loadout.cape ? findCosmetic(loadout.cape) : undefined,
  }
}
