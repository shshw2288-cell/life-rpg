import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'
import type { EvolutionStage } from '../../data/evolutionConfig'
import type { CosmeticLoadout } from '../../types/battle'
import { AuraLayer, CapeLayer, FaceLayer, HatLayer, useCosmetics } from './CosmeticLayers'

const NO_COSMETICS: CosmeticLoadout = { hat: null, face: null, aura: null, cape: null }

/**
 * 루미의 자세. 전투 연출에서 바꿔 끼운다.
 * idle은 숨쉬기, attack은 앞으로 기울임, hit은 뒤로 밀림.
 */
export type LumiPose = 'idle' | 'attack' | 'hit' | 'defend' | 'cast' | 'win' | 'faint'

interface LumiAvatarProps {
  stage: EvolutionStage
  size?: number
  /** 쓰러진 상태면 표정이 바뀐다 */
  fainted?: boolean
  /** 장착 중인 꾸미기 */
  cosmetics?: CosmeticLoadout
  pose?: LumiPose
  /** 바닥 그림자를 그려 공중에 떠 보이지 않게 한다 */
  shadow?: boolean
  /** 왼쪽을 보게 뒤집는다 */
  flip?: boolean
}

/**
 * 캐릭터 '루미'.
 *
 * 좌표계는 200x200이고 광원은 왼쪽 위(고정)다.
 * 머리 중심 (100, 86), 머리 반지름 46 — 꾸미기 장착 기준점이며 CosmeticLayers가 이 값을 쓴다.
 * 그라디언트 id는 useId로 만들어 같은 화면에 여러 번 그려도 충돌하지 않는다.
 */
export function LumiAvatar({
  stage,
  size = 160,
  fainted = false,
  cosmetics = NO_COSMETICS,
  pose = 'idle',
  shadow = false,
  flip = false,
}: LumiAvatarProps) {
  const uid = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const { palette, form } = stage
  const scale = form.scale
  const worn = useCosmetics(cosmetics)
  const down = fainted || pose === 'faint'

  const bodyId = `lumi-body-${uid}`
  const headId = `lumi-head-${uid}`
  const auraId = `lumi-aura-${uid}`
  const shadeId = `lumi-shade-${uid}`

  // 자세별 몸 전체 변형
  const poseMotion = reduceMotion
    ? {}
    : {
        idle: { y: [0, -3, 0], rotate: 0, scaleY: [1, 1.02, 1] },
        attack: { x: [0, 14, 0], rotate: [0, -6, 0] },
        cast: { y: [0, -8, 0], scale: [1, 1.06, 1] },
        hit: { x: [0, -12, 0], rotate: [0, 6, 0] },
        defend: { scaleY: [1, 0.9, 0.93], y: [0, 6, 4] },
        win: { y: [0, -16, 0, -8, 0] },
        faint: { rotate: 10, y: 8 },
      }[pose]

  const poseTiming =
    pose === 'idle'
      ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const }
      : pose === 'win'
        ? { duration: 1.1, ease: 'easeOut' as const }
        : { duration: 0.42, ease: 'easeOut' as const }

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size, transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {shadow && (
        <span
          aria-hidden
          className="absolute left-1/2 bottom-[6%] -translate-x-1/2 rounded-[50%] bg-black/45 blur-[3px]"
          style={{ width: size * 0.42 * scale, height: size * 0.09 }}
        />
      )}

      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label={`${stage.name}${down ? ' (지친 상태)' : ''}`}
        animate={poseMotion}
        transition={poseTiming}
        style={{ position: 'relative', overflow: 'visible' }}
      >
        <defs>
          {/* 몸통: 왼쪽 위에서 빛이 들어온다 */}
          <radialGradient id={bodyId} cx="36%" cy="28%" r="78%">
            <stop offset="0%" stopColor={palette.glow} />
            <stop offset="55%" stopColor={palette.body} />
            <stop offset="100%" stopColor={palette.bodyDark} />
          </radialGradient>
          <radialGradient id={headId} cx="34%" cy="26%" r="76%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="28%" stopColor={palette.glow} />
            <stop offset="72%" stopColor={palette.body} />
            <stop offset="100%" stopColor={palette.bodyDark} />
          </radialGradient>
          <radialGradient id={auraId} cx="50%" cy="50%">
            <stop offset="50%" stopColor={palette.glow} stopOpacity="0.3" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>
          {/* 아래쪽 그늘 */}
          <linearGradient id={shadeId} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor={palette.bodyDark} stopOpacity="0" />
            <stop offset="100%" stopColor={palette.bodyDark} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {form.aura && <circle cx="100" cy="104" r={84 * scale} fill={`url(#${auraId})`} />}
        {worn.aura && <AuraLayer cosmetic={worn.aura} />}

        {/* 반짝이 장식 */}
        {Array.from({ length: form.sparkles }).map((_, index) => {
          const angle = (index / Math.max(1, form.sparkles)) * Math.PI * 2
          const radius = 78 * scale
          return (
            <motion.circle
              key={index}
              cx={100 + Math.cos(angle) * radius}
              cy={104 + Math.sin(angle) * radius * 0.82}
              r={index % 2 === 0 ? 3.4 : 2}
              fill={palette.glow}
              animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2 + index * 0.25, repeat: Infinity, ease: 'easeInOut' }}
            />
          )
        })}

        <g transform={`translate(100 112) scale(${scale}) translate(-100 -112)`}>
          <Antennae palette={palette} count={form.antennae} reduceMotion={reduceMotion} />

          {/* 망토는 몸통보다 뒤에 그린다 */}
          {worn.cape && <CapeLayer cosmetic={worn.cape} />}

          {/* 다리 */}
          <ellipse cx="82" cy="170" rx="16" ry="10" fill={palette.bodyDark} />
          <ellipse cx="118" cy="170" rx="16" ry="10" fill={palette.bodyDark} />
          <ellipse cx="80" cy="168" rx="12" ry="6" fill={palette.body} opacity="0.5" />

          {/* 팔 */}
          <g>
            <path
              d="M 58 128 Q 44 132 42 146 Q 41 156 50 157 Q 58 157 60 146 Z"
              fill={palette.body}
              stroke={palette.bodyDark}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M 142 128 Q 156 132 158 146 Q 159 156 150 157 Q 142 157 140 146 Z"
              fill={palette.body}
              stroke={palette.bodyDark}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>

          {/* 몸통 — 머리보다 작은 귀여운 비율 */}
          <path
            d="M 100 108 Q 142 110 143 140 Q 144 168 100 168 Q 56 168 57 140 Q 58 110 100 108 Z"
            fill={`url(#${bodyId})`}
            stroke={palette.bodyDark}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M 100 108 Q 142 110 143 140 Q 144 168 100 168 Q 56 168 57 140 Q 58 110 100 108 Z"
            fill={`url(#${shadeId})`}
          />
          {/* 배 무늬 */}
          <ellipse cx="100" cy="142" rx="24" ry="19" fill={palette.glow} opacity="0.3" />

          {/* 머리 — 크게 */}
          <circle
            cx="100"
            cy="86"
            r="46"
            fill={`url(#${headId})`}
            stroke={palette.bodyDark}
            strokeWidth="3"
          />
          {/* 머리 아래 그늘 */}
          <path d="M 58 96 A 46 46 0 0 0 142 96 A 46 40 0 0 1 58 96 Z" fill={palette.bodyDark} opacity="0.22" />
          {/* 하이라이트 */}
          <ellipse cx="80" cy="64" rx="15" ry="10" fill="#ffffff" opacity="0.5" transform="rotate(-24 80 64)" />

          <Face palette={palette} down={down} pose={pose} reduceMotion={reduceMotion} />

          {form.blush && !down && !worn.face && (
            <>
              <ellipse cx="70" cy="100" rx="9" ry="5.5" fill="#fb7185" opacity="0.5" />
              <ellipse cx="130" cy="100" rx="9" ry="5.5" fill="#fb7185" opacity="0.5" />
            </>
          )}

          {worn.face && !down && <FaceLayer cosmetic={worn.face} />}
          {worn.hat && <HatLayer cosmetic={worn.hat} />}
        </g>
      </motion.svg>
    </div>
  )
}

function Antennae({
  palette,
  count,
  reduceMotion,
}: {
  palette: EvolutionStage['palette']
  count: number
  reduceMotion: boolean | null
}) {
  const positions =
    count <= 1
      ? [{ x: 100, tipX: 100, tipY: 22 }]
      : count === 2
        ? [
            { x: 86, tipX: 66, tipY: 28 },
            { x: 114, tipX: 134, tipY: 28 },
          ]
        : [
            { x: 84, tipX: 58, tipY: 34 },
            { x: 100, tipX: 100, tipY: 16 },
            { x: 116, tipX: 142, tipY: 34 },
          ]

  return (
    <g>
      {positions.map(({ x, tipX, tipY }, index) => (
        <motion.g
          key={index}
          style={{ originX: `${x}px`, originY: '58px' }}
          animate={reduceMotion ? undefined : { rotate: [-2.5, 2.5, -2.5] }}
          transition={{ duration: 3 + index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d={`M ${x} 52 Q ${(x + tipX) / 2} ${tipY + 16} ${tipX} ${tipY}`}
            stroke={palette.bodyDark}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${x} 52 Q ${(x + tipX) / 2} ${tipY + 16} ${tipX} ${tipY}`}
            stroke={palette.antenna}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={tipX} cy={tipY} r="9" fill={palette.bodyDark} />
          <circle cx={tipX} cy={tipY} r="7" fill={palette.glow} />
          <circle cx={tipX - 2.4} cy={tipY - 2.4} r="2.6" fill="#ffffff" opacity="0.85" />
        </motion.g>
      ))}
    </g>
  )
}

function Face({
  palette,
  down,
  pose,
  reduceMotion,
}: {
  palette: EvolutionStage['palette']
  down: boolean
  pose: LumiPose
  reduceMotion: boolean | null
}) {
  if (down) {
    return (
      <g stroke="#1f2937" strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M 74 80 l 14 14 M 88 80 l -14 14" />
        <path d="M 112 80 l 14 14 M 126 80 l -14 14" />
        <path d="M 88 108 q 12 -9 24 0" />
      </g>
    )
  }

  // 공격·시전 중에는 눈을 살짝 찡그리고, 승리하면 웃는 눈이 된다
  const squint = pose === 'attack' || pose === 'cast' || pose === 'defend'
  const happy = pose === 'win'

  return (
    <g>
      {happy ? (
        <g stroke="#12212b" strokeWidth="4.5" strokeLinecap="round" fill="none">
          <path d="M 74 84 q 9 -10 18 0" />
          <path d="M 108 84 q 9 -10 18 0" />
        </g>
      ) : (
        <>
          <motion.g
            animate={reduceMotion ? undefined : { scaleY: [1, 1, 0.1, 1] }}
            transition={{ duration: 0.28, repeat: Infinity, repeatDelay: 3.4, ease: 'easeInOut' }}
            style={{ originX: '100px', originY: '86px' }}
          >
            <ellipse cx="83" cy="86" rx="8" ry={squint ? 6 : 10.5} fill="#12212b" />
            <ellipse cx="117" cy="86" rx="8" ry={squint ? 6 : 10.5} fill="#12212b" />
            <circle cx="85.6" cy="82" r="3" fill="#ffffff" />
            <circle cx="119.6" cy="82" r="3" fill="#ffffff" />
            <circle cx="80.5" cy="90" r="1.6" fill="#ffffff" opacity="0.7" />
            <circle cx="114.5" cy="90" r="1.6" fill="#ffffff" opacity="0.7" />
          </motion.g>
        </>
      )}

      {/* 입 */}
      <path
        d={
          happy
            ? 'M 88 102 q 12 14 24 0 q -12 6 -24 0 Z'
            : pose === 'attack' || pose === 'cast'
              ? 'M 90 104 q 10 9 20 0 q -10 3 -20 0 Z'
              : 'M 89 102 q 11 9 22 0'
        }
        stroke="#12212b"
        strokeWidth="3.6"
        strokeLinecap="round"
        fill={happy || pose === 'attack' || pose === 'cast' ? '#7f1d3a' : 'none'}
      />
      {/* 아랫입술 하이라이트 */}
      {!happy && <path d="M 92 104 q 8 4 16 0" stroke={palette.glow} strokeWidth="1.6" fill="none" opacity="0.5" />}
    </g>
  )
}
