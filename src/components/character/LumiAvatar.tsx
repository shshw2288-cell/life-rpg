import type { EvolutionStage } from '../../data/evolutionConfig'
import type { CosmeticLoadout } from '../../types/battle'
import { AuraLayer, FaceLayer, HatLayer, useCosmetics } from './CosmeticLayers'

const NO_COSMETICS: CosmeticLoadout = { hat: null, face: null, aura: null }

interface LumiAvatarProps {
  stage: EvolutionStage
  size?: number
  /** 쓰러진 상태면 표정이 바뀐다 */
  fainted?: boolean
  /** 장착 중인 꾸미기 */
  cosmetics?: CosmeticLoadout
}

/**
 * 캐릭터 '루미' 렌더링. 외부 이미지 없이 SVG로 직접 그린다.
 * 단계별 색·크기·더듬이 수·후광은 evolutionConfig에서 가져온다.
 */
export function LumiAvatar({
  stage,
  size = 160,
  fainted = false,
  cosmetics = NO_COSMETICS,
}: LumiAvatarProps) {
  const { palette, form } = stage
  const s = form.scale
  const worn = useCosmetics(cosmetics)

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={`${stage.name}${fainted ? ' (지친 상태)' : ''}`}
    >
      <defs>
        <radialGradient id={`body-${stage.id}`} cx="38%" cy="32%">
          <stop offset="0%" stopColor={palette.glow} />
          <stop offset="65%" stopColor={palette.body} />
          <stop offset="100%" stopColor={palette.bodyDark} />
        </radialGradient>
        <radialGradient id={`aura-${stage.id}`} cx="50%" cy="50%">
          <stop offset="55%" stopColor={palette.glow} stopOpacity="0.32" />
          <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {form.aura && <circle cx="100" cy="104" r={78 * s} fill={`url(#aura-${stage.id})`} />}
      {worn.aura && <AuraLayer cosmetic={worn.aura} />}

      {Array.from({ length: form.sparkles }).map((_, index) => {
        const angle = (index / form.sparkles) * Math.PI * 2
        const radius = 74 * s
        return (
          <circle
            key={index}
            cx={100 + Math.cos(angle) * radius}
            cy={104 + Math.sin(angle) * radius * 0.85}
            r={index % 2 === 0 ? 3.2 : 2}
            fill={palette.glow}
            opacity={0.85}
          />
        )
      })}

      <g transform={`translate(100 108) scale(${s}) translate(-100 -108)`}>
        {/* 더듬이 */}
        {antennaPositions(form.antennae).map(({ x, tipX, tipY }, index) => (
          <g key={index}>
            <path
              d={`M ${x} 74 Q ${(x + tipX) / 2} ${tipY + 14} ${tipX} ${tipY}`}
              stroke={palette.antenna}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx={tipX} cy={tipY} r="8" fill={palette.glow} />
            <circle cx={tipX - 2} cy={tipY - 2} r="3" fill="#ffffff" opacity="0.7" />
          </g>
        ))}

        {/* 팔 */}
        <ellipse cx="46" cy="126" rx="13" ry="18" fill={palette.body} transform="rotate(-18 46 126)" />
        <ellipse cx="154" cy="126" rx="13" ry="18" fill={palette.body} transform="rotate(18 154 126)" />

        {/* 몸통 */}
        <ellipse cx="100" cy="122" rx="52" ry="48" fill={`url(#body-${stage.id})`} />
        {/* 머리 */}
        <circle cx="100" cy="92" r="46" fill={`url(#body-${stage.id})`} />

        {/* 다리 */}
        <ellipse cx="82" cy="166" rx="15" ry="11" fill={palette.bodyDark} opacity="0.9" />
        <ellipse cx="118" cy="166" rx="15" ry="11" fill={palette.bodyDark} opacity="0.9" />

        {/* 얼굴 */}
        {fainted ? (
          <>
            <path d="M 76 86 l 14 14 M 90 86 l -14 14" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            <path d="M 110 86 l 14 14 M 124 86 l -14 14" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
            <path d="M 88 112 q 12 -8 24 0" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="83" cy="90" rx="6.5" ry="8.5" fill="#12212b" />
            <ellipse cx="117" cy="90" rx="6.5" ry="8.5" fill="#12212b" />
            <circle cx="85" cy="87" r="2.2" fill="#ffffff" />
            <circle cx="119" cy="87" r="2.2" fill="#ffffff" />
            <path d="M 88 105 q 12 10 24 0" stroke="#12212b" strokeWidth="3.6" fill="none" strokeLinecap="round" />
          </>
        )}

        {form.blush && !fainted && !worn.face && (
          <>
            <ellipse cx="68" cy="102" rx="7" ry="4.5" fill="#fb7185" opacity="0.45" />
            <ellipse cx="132" cy="102" rx="7" ry="4.5" fill="#fb7185" opacity="0.45" />
          </>
        )}

        {worn.face && !fainted && <FaceLayer cosmetic={worn.face} />}
        {worn.hat && <HatLayer cosmetic={worn.hat} />}
      </g>
    </svg>
  )
}

function antennaPositions(count: number) {
  if (count <= 1) return [{ x: 100, tipX: 100, tipY: 30 }]
  if (count === 2) {
    return [
      { x: 86, tipX: 68, tipY: 34 },
      { x: 114, tipX: 132, tipY: 34 },
    ]
  }
  return [
    { x: 84, tipX: 62, tipY: 38 },
    { x: 100, tipX: 100, tipY: 24 },
    { x: 116, tipX: 138, tipY: 38 },
  ]
}
