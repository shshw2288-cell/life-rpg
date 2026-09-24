import type { PetSpecies } from '../../data/petConfig'

/** 펫 외형. 종마다 색과 형태(shape)만 다르게 해서 SVG로 직접 그린다. */
export function PetSprite({ species, size = 64 }: { species: PetSpecies; size?: number }) {
  const { color, accent, shape, name } = species

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={name}>
      <defs>
        <radialGradient id={`pet-${species.id}`} cx="38%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={accent} />
        </radialGradient>
      </defs>

      {shape === 'wing' && (
        <>
          <ellipse cx="22" cy="48" rx="16" ry="11" fill={color} opacity="0.75" transform="rotate(-20 22 48)" />
          <ellipse cx="78" cy="48" rx="16" ry="11" fill={color} opacity="0.75" transform="rotate(20 78 48)" />
        </>
      )}

      {shape === 'ear' && (
        <>
          <ellipse cx="34" cy="24" rx="8" ry="14" fill={accent} transform="rotate(-18 34 24)" />
          <ellipse cx="66" cy="24" rx="8" ry="14" fill={accent} transform="rotate(18 66 24)" />
        </>
      )}

      {shape === 'horn' && (
        <>
          <path d="M 36 26 L 32 8 L 44 22 Z" fill={accent} />
          <path d="M 64 26 L 68 8 L 56 22 Z" fill={accent} />
        </>
      )}

      {/* 몸통 */}
      <ellipse cx="50" cy="62" rx="30" ry="26" fill={`url(#pet-${species.id})`} />
      <circle cx="50" cy="45" r="25" fill={`url(#pet-${species.id})`} />

      {/* 발 */}
      <ellipse cx="33" cy="84" rx="10" ry="6" fill={accent} opacity="0.9" />
      <ellipse cx="67" cy="84" rx="10" ry="6" fill={accent} opacity="0.9" />

      {/* 얼굴 */}
      <ellipse cx="41" cy="43" rx="3.6" ry="4.6" fill="#12212b" />
      <ellipse cx="59" cy="43" rx="3.6" ry="4.6" fill="#12212b" />
      <circle cx="42.4" cy="41.4" r="1.3" fill="#ffffff" />
      <circle cx="60.4" cy="41.4" r="1.3" fill="#ffffff" />
      <path d="M 43 54 q 7 6 14 0" stroke="#12212b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** 도감에서 아직 못 만난 펫 */
export function UnknownPet({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="미발견 펫">
      <ellipse cx="50" cy="62" rx="30" ry="26" fill="#1e2637" />
      <circle cx="50" cy="45" r="25" fill="#1e2637" />
      <text x="50" y="58" textAnchor="middle" fontSize="28" fill="#475569" fontWeight="bold">
        ?
      </text>
    </svg>
  )
}
