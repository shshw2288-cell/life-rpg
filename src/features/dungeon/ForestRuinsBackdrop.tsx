import { motion, useReducedMotion } from 'framer-motion'
import { useId, useMemo } from 'react'

/**
 * 던전 전투 배경 '빛나는 숲속 유적'.
 *
 * 레이어: 하늘 → 먼 숲과 유적 → 중간 나무·돌기둥 → 바닥 → 앞쪽 풀·버섯 → 빛 입자.
 * 좌표계 800x420, preserveAspectRatio="xMidYMax slice"로 좁은 화면에서는 좌우를 잘라 보여준다.
 * 배경은 장식이므로 aria-hidden이고 클릭을 가로채지 않는다(pointer-events-none).
 */
export function ForestRuinsBackdrop({ dim = false }: { dim?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()

  const sky = `bg-sky-${uid}`
  const far = `bg-far-${uid}`
  const ground = `bg-ground-${uid}`
  const beam = `bg-beam-${uid}`
  const glow = `bg-glow-${uid}`

  // 입자 위치는 한 번만 정해 리렌더마다 튀지 않게 한다
  const motes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        x: 40 + ((index * 67) % 830),
        y: 70 + ((index * 43) % 200),
        r: index % 3 === 0 ? 3 : 1.8,
        delay: (index % 7) * 0.7,
        duration: 7 + (index % 5) * 1.6,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* 가로로 긴 화면에서도 위가 잘리지 않도록 낮은 비율(900x340)로 그린다 */}
      <svg
        viewBox="0 0 900 340"
        preserveAspectRatio="xMidYMax slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id={sky} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#10243a" />
            <stop offset="45%" stopColor="#15384a" />
            <stop offset="100%" stopColor="#1d4a43" />
          </linearGradient>
          <linearGradient id={far} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b4a47" />
            <stop offset="100%" stopColor="#123236" />
          </linearGradient>
          <linearGradient id={ground} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f7a3f" />
            <stop offset="35%" stopColor="#2f5f34" />
            <stop offset="100%" stopColor="#1e3f27" />
          </linearGradient>
          <linearGradient id={beam} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={glow} cx="50%" cy="40%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 하늘 */}
        <rect width="900" height="340" fill={`url(#${sky})`} />
        <circle cx="690" cy="40" r="130" fill={`url(#${glow})`} />
        {[
          [130, 28],
          [268, 16],
          [430, 40],
          [560, 14],
          [742, 32],
          [828, 62],
        ].map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r={index % 2 ? 1.6 : 2.4} fill="#e2f3ff" opacity="0.5" />
        ))}

        {/* 먼 숲 실루엣 */}
        <path
          d="M -10 150 L 46 104 L 92 146 L 140 92 L 192 142 L 240 106 L 288 150 L 340 98 L 392 146 L 446 108 L 500 150 L 556 102 L 612 146 L 664 112 L 716 152 L 770 104 L 824 148 L 910 112 L 910 200 L -10 200 Z"
          fill={`url(#${far})`}
          opacity="0.85"
        />
        {/* 먼 유적 (희미하게) */}
        <g opacity="0.38" fill="#0f2b33">
          <rect x="112" y="108" width="24" height="86" rx="3" />
          <rect x="104" y="100" width="40" height="11" rx="3" />
          <rect x="742" y="116" width="22" height="78" rx="3" />
          <rect x="734" y="108" width="38" height="10" rx="3" />
          <path d="M 372 196 L 372 126 L 448 126 L 448 196" stroke="#0f2b33" strokeWidth="13" fill="none" />
        </g>

        {/* 빛줄기 */}
        {[
          [200, -30, 110],
          [470, -50, 80],
          [690, -20, 130],
        ].map(([x, y, w], index) => (
          <motion.path
            key={index}
            d={`M ${x} ${y} l ${w} 0 l -60 280 l -${w * 0.7} 0 Z`}
            fill={`url(#${beam})`}
            animate={reduceMotion ? undefined : { opacity: [0.45, 0.8, 0.45] }}
            transition={{ duration: 6 + index * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        {/* 중간 배경: 나무 */}
        <Tree x={54} baseY={236} scale={0.92} />
        <Tree x={846} baseY={232} scale={0.84} />

        {/* 중간 배경: 무너진 돌기둥 */}
        <Pillar x={160} baseY={238} height={92} broken />
        <Pillar x={716} baseY={236} height={110} />
        <rect x="666" y="226" width="78" height="12" rx="5" fill="#4b5a55" stroke="#26332f" strokeWidth="3" />

        {/* 덩굴 */}
        <g stroke="#2f6b3d" strokeWidth="4" fill="none" opacity="0.85">
          <path d="M 268 0 q 16 52 -6 88" />
          <path d="M 568 0 q -14 44 4 76" />
        </g>
        {[
          [262, 88],
          [572, 76],
        ].map(([x, y], index) => (
          <ellipse key={index} cx={x} cy={y} rx="9" ry="5" fill="#3f8f4a" opacity="0.9" />
        ))}

        {/* 바닥 */}
        <path d="M -10 232 Q 230 222 450 230 Q 690 238 910 226 L 910 350 L -10 350 Z" fill={`url(#${ground})`} />
        <path
          d="M -10 232 Q 230 222 450 230 Q 690 238 910 226"
          stroke="#5fae62"
          strokeWidth="5"
          fill="none"
          opacity="0.9"
        />
        {/* 바닥 돌과 이끼 */}
        {[
          [150, 268, 24, 8],
          [380, 288, 32, 10],
          [582, 262, 20, 7],
          [762, 292, 28, 9],
        ].map(([x, y, rx, ry], index) => (
          <g key={index}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#4b5a55" stroke="#26332f" strokeWidth="2.5" />
            <ellipse cx={x - rx * 0.25} cy={y - ry * 0.35} rx={rx * 0.45} ry={ry * 0.4} fill="#68786f" opacity="0.7" />
          </g>
        ))}
        {/* 바닥 타일 자국 */}
        <g stroke="#2a4a30" strokeWidth="2" opacity="0.45">
          <path d="M 80 252 h 130" />
          <path d="M 300 272 h 160" />
          <path d="M 540 248 h 140" />
        </g>

        {/* 앞쪽 장식: 풀, 꽃, 버섯 */}
        <g>
          {[30, 112, 208, 286, 402, 492, 604, 700, 806, 876].map((x, index) => (
            <GrassTuft key={x} x={x} y={330 - (index % 3) * 10} flip={index % 2 === 0} />
          ))}
          <Mushroom x={182} y={332} cap="#f87171" />
          <Mushroom x={648} y={338} cap="#fbbf24" small />
          <Flower x={330} y={326} color="#f9a8d4" />
          <Flower x={790} y={322} color="#a5b4fc" />
        </g>

        {/* 떠다니는 빛 입자 */}
        {!reduceMotion &&
          motes.map((mote, index) => (
            <motion.circle
              key={index}
              cx={mote.x}
              cy={mote.y}
              r={mote.r}
              fill="#fde68a"
              initial={{ opacity: 0.15 }}
              animate={{ y: [mote.y, mote.y - 26, mote.y], opacity: [0.15, 0.8, 0.15] }}
              transition={{ duration: mote.duration, delay: mote.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

        {/* 가독성용 어둡게 깔기 */}
        <rect width="900" height="340" fill="#050914" opacity={dim ? 0.45 : 0.16} />
      </svg>
    </div>
  )
}

function Pillar({
  x,
  baseY,
  height,
  broken = false,
}: {
  x: number
  baseY: number
  height: number
  broken?: boolean
}) {
  return (
    <g>
      <rect x={x} y={baseY - height} width="34" height={height} rx="4" fill="#586761" stroke="#26332f" strokeWidth="3" />
      <rect x={x + 4} y={baseY - height} width="10" height={height} fill="#6f7f78" opacity="0.6" />
      <rect x={x - 7} y={baseY - 10} width="48" height="14" rx="4" fill="#4b5a55" stroke="#26332f" strokeWidth="3" />
      {broken ? (
        <path
          d={`M ${x} ${baseY - height} l 10 -12 l 8 10 l 10 -8 l 6 10 Z`}
          fill="#586761"
          stroke="#26332f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      ) : (
        <rect x={x - 7} y={baseY - height - 14} width="48" height="14" rx="4" fill="#4b5a55" stroke="#26332f" strokeWidth="3" />
      )}
      {/* 덩굴 */}
      <path
        d={`M ${x + 6} ${baseY - height + 18} q 14 30 -2 58 q -12 24 4 46`}
        stroke="#3f8f4a"
        strokeWidth="4"
        fill="none"
        opacity="0.9"
      />
    </g>
  )
}

function Tree({ x, baseY, scale = 1 }: { x: number; baseY: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${baseY}) scale(${scale})`}>
      <path d="M -10 0 q 4 -70 8 -110 q 10 8 14 0 q 2 60 6 110 Z" fill="#3b2a1d" stroke="#1d140d" strokeWidth="3" />
      <ellipse cx="0" cy="-118" rx="62" ry="42" fill="#2f6b3d" stroke="#1d4527" strokeWidth="3" />
      <ellipse cx="-26" cy="-134" rx="38" ry="28" fill="#3f8f4a" stroke="#1d4527" strokeWidth="3" />
      <ellipse cx="26" cy="-128" rx="34" ry="24" fill="#357c42" stroke="#1d4527" strokeWidth="3" />
      <ellipse cx="-30" cy="-146" rx="16" ry="10" fill="#57a05a" opacity="0.8" />
    </g>
  )
}

function GrassTuft({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`}>
      <path
        d="M 0 0 q -3 -16 -12 -24 q 10 2 14 14 q 1 -18 6 -26 q 3 18 2 28 q 6 -12 16 -16 q -8 10 -10 24 Z"
        fill="#4a9a52"
        stroke="#1d4527"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </g>
  )
}

function Mushroom({ x, y, cap, small = false }: { x: number; y: number; cap: string; small?: boolean }) {
  const scale = small ? 0.7 : 1
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-6" y="-16" width="12" height="18" rx="5" fill="#f5e6c8" stroke="#3b2a1d" strokeWidth="2.5" />
      <path d="M -20 -14 q 4 -22 20 -22 q 16 0 20 22 Z" fill={cap} stroke="#3b2a1d" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="-8" cy="-22" r="3.4" fill="#ffffff" opacity="0.85" />
      <circle cx="6" cy="-27" r="2.6" fill="#ffffff" opacity="0.85" />
    </g>
  )
}

function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M 0 0 q -2 -14 0 -20" stroke="#2f6b3d" strokeWidth="3" fill="none" />
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2
        return (
          <ellipse
            key={index}
            cx={Math.cos(angle) * 6}
            cy={-22 + Math.sin(angle) * 6}
            rx="5"
            ry="4"
            fill={color}
            stroke="#7c2d4a"
            strokeWidth="1.6"
          />
        )
      })}
      <circle cx="0" cy="-22" r="3.2" fill="#fde68a" stroke="#7c2d4a" strokeWidth="1.4" />
    </g>
  )
}
