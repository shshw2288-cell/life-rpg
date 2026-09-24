import { findCosmetic, type Cosmetic } from '../../data/shopConfig'
import type { CosmeticLoadout } from '../../types/battle'

/**
 * 꾸미기 아이템을 루미 위에 덧그린다.
 * LumiAvatar의 200x200 좌표계를 그대로 쓴다.
 */

export function AuraLayer({ cosmetic }: { cosmetic: Cosmetic }) {
  const color = cosmetic.style.primary
  if (cosmetic.art === 'firefly_aura') {
    return (
      <g>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const angle = (index / 6) * Math.PI * 2
          return (
            <circle
              key={index}
              cx={100 + Math.cos(angle) * 82}
              cy={104 + Math.sin(angle) * 72}
              r={index % 2 ? 2.5 : 4}
              fill={color}
              opacity={0.9}
            />
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
          const x = 100 + Math.cos(angle) * 86
          const y = 104 + Math.sin(angle) * 76
          return (
            <path
              key={index}
              d={`M ${x} ${y - 5} L ${x + 1.6} ${y - 1.6} L ${x + 5} ${y} L ${x + 1.6} ${y + 1.6} L ${x} ${y + 5} L ${x - 1.6} ${y + 1.6} L ${x - 5} ${y} L ${x - 1.6} ${y - 1.6} Z`}
              fill={color}
              opacity={0.9}
            />
          )
        })}
      </g>
    )
  }
  // flame_aura
  return (
    <g opacity={0.75}>
      <circle cx="100" cy="106" r="88" fill={color} opacity="0.12" />
      {[0, 1, 2, 3, 4, 5, 6].map((index) => {
        const angle = (index / 7) * Math.PI * 2
        const x = 100 + Math.cos(angle) * 78
        const y = 106 + Math.sin(angle) * 70
        return (
          <path
            key={index}
            d={`M ${x} ${y + 8} Q ${x - 6} ${y} ${x} ${y - 12} Q ${x + 6} ${y} ${x} ${y + 8} Z`}
            fill={color}
          />
        )
      })}
    </g>
  )
}

export function HatLayer({ cosmetic }: { cosmetic: Cosmetic }) {
  const { primary, secondary } = cosmetic.style
  switch (cosmetic.art) {
    case 'straw_hat':
      return (
        <g>
          <ellipse cx="100" cy="58" rx="54" ry="14" fill={primary} />
          <path d="M 74 58 Q 100 18 126 58 Z" fill={primary} />
          <path d="M 74 52 Q 100 44 126 52 L 126 58 Q 100 50 74 58 Z" fill={secondary} />
        </g>
      )
    case 'wizard_hat':
      return (
        <g>
          <ellipse cx="100" cy="56" rx="48" ry="12" fill={secondary} />
          <path d="M 100 4 L 128 56 L 72 56 Z" fill={primary} />
          <circle cx="106" cy="34" r="3" fill="#fde68a" />
          <circle cx="94" cy="46" r="2.2" fill="#fde68a" />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d="M 68 56 L 74 24 L 88 44 L 100 18 L 112 44 L 126 24 L 132 56 Z" fill={primary} />
          <rect x="68" y="54" width="64" height="9" rx="3" fill={secondary} />
          <circle cx="100" cy="40" r="4" fill="#f87171" />
        </g>
      )
    case 'ribbon':
      return (
        <g>
          <path d="M 76 44 Q 60 32 62 50 Q 64 62 84 52 Z" fill={primary} />
          <path d="M 124 44 Q 140 32 138 50 Q 136 62 116 52 Z" fill={primary} />
          <circle cx="100" cy="48" r="8" fill={secondary} />
        </g>
      )
    case 'headphones':
      return (
        <g>
          <path d="M 56 88 Q 56 34 100 34 Q 144 34 144 88" stroke={primary} strokeWidth="9" fill="none" strokeLinecap="round" />
          <rect x="44" y="80" width="20" height="30" rx="9" fill={secondary} />
          <rect x="136" y="80" width="20" height="30" rx="9" fill={secondary} />
        </g>
      )
    default:
      return null
  }
}

export function FaceLayer({ cosmetic }: { cosmetic: Cosmetic }) {
  const { primary } = cosmetic.style
  switch (cosmetic.art) {
    case 'glasses':
      return (
        <g>
          <circle cx="83" cy="90" r="13" stroke={primary} strokeWidth="3" fill="#ffffff" fillOpacity="0.12" />
          <circle cx="117" cy="90" r="13" stroke={primary} strokeWidth="3" fill="#ffffff" fillOpacity="0.12" />
          <path d="M 96 90 h 8" stroke={primary} strokeWidth="3" />
        </g>
      )
    case 'monocle':
      return (
        <g>
          <circle cx="117" cy="90" r="15" stroke={primary} strokeWidth="3" fill="#ffffff" fillOpacity="0.14" />
          <path d="M 117 105 q 4 16 -6 22" stroke={primary} strokeWidth="2.4" fill="none" />
        </g>
      )
    case 'blush':
      return (
        <g>
          <ellipse cx="66" cy="102" rx="9" ry="5.5" fill={primary} opacity="0.6" />
          <ellipse cx="134" cy="102" rx="9" ry="5.5" fill={primary} opacity="0.6" />
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
  }
}
