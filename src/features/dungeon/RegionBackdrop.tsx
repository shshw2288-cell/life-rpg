import { motion, useReducedMotion } from 'framer-motion'
import { useId, useMemo } from 'react'
import type { RegionTheme } from '../../data/regionConfig'
import { ForestRuinsBackdrop } from './ForestRuinsBackdrop'

/**
 * 지역별 전투 배경.
 *
 * 좌표계는 모두 900x340이고 preserveAspectRatio="xMidYMax slice" 라
 * 좁은 화면에서는 좌우가 잘리고 바닥선은 항상 보인다.
 * 장식이므로 aria-hidden이고 클릭을 가로채지 않는다.
 *
 * 시작의 숲은 기존 배경(ForestRuinsBackdrop)을 그대로 쓴다.
 */
export function RegionBackdrop({ theme, dim = false }: { theme: RegionTheme; dim?: boolean }) {
  if (theme === 'forest') return <ForestRuinsBackdrop dim={dim} />
  if (theme === 'cave') return <CaveBackdrop dim={dim} />
  if (theme === 'cliff') return <CliffBackdrop dim={dim} />
  return <RuinsBackdrop dim={dim} endless={theme === 'endless'} />
}

function Frame({ children, dim }: { children: React.ReactNode; dim: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg viewBox="0 0 900 340" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        {children}
        <rect width="900" height="340" fill="#050914" opacity={dim ? 0.45 : 0.16} />
      </svg>
    </div>
  )
}

/** 떠다니는 입자. 지역마다 색만 바꿔 쓴다. */
function Motes({ color, count = 12, seed = 1 }: { color: string; count?: number; seed?: number }) {
  const reduceMotion = useReducedMotion()
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: 30 + ((index * 71 * seed) % 850),
        y: 60 + ((index * 47) % 210),
        r: index % 3 === 0 ? 3 : 1.8,
        delay: (index % 7) * 0.7,
        duration: 7 + (index % 5) * 1.6,
      })),
    [count, seed],
  )
  if (reduceMotion) return null
  return (
    <>
      {motes.map((mote, index) => (
        <motion.circle
          key={index}
          cx={mote.x}
          cy={mote.y}
          r={mote.r}
          fill={color}
          initial={{ opacity: 0.15 }}
          animate={{ y: [mote.y, mote.y - 26, mote.y], opacity: [0.15, 0.8, 0.15] }}
          transition={{ duration: mote.duration, delay: mote.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}

// ── 버섯 동굴 ───────────────────────────────────────────────

function CaveBackdrop({ dim }: { dim: boolean }) {
  const uid = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const rock = `cave-rock-${uid}`
  const water = `cave-water-${uid}`
  const ground = `cave-ground-${uid}`
  const glow = `cave-glow-${uid}`

  return (
    <Frame dim={dim}>
      <defs>
        <linearGradient id={rock} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#141b2e" />
          <stop offset="60%" stopColor="#1b2540" />
          <stop offset="100%" stopColor="#17203a" />
        </linearGradient>
        <linearGradient id={water} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e6f8c" />
          <stop offset="100%" stopColor="#0d3348" />
        </linearGradient>
        <linearGradient id={ground} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b4a63" />
          <stop offset="100%" stopColor="#1c2436" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="900" height="340" fill={`url(#${rock})`} />

      {/* 천장 종유석 */}
      <g fill="#0f1728" stroke="#232f4d" strokeWidth="3" strokeLinejoin="round">
        {[
          [40, 74],
          [150, 48],
          [260, 92],
          [370, 58],
          [500, 84],
          [610, 46],
          [720, 88],
          [840, 62],
        ].map(([x, h], index) => (
          <path key={index} d={`M ${x - 26} -6 L ${x + 26} -6 L ${x} ${h} Z`} />
        ))}
      </g>

      {/* 뒤쪽 바위 실루엣 */}
      <path
        d="M -10 190 L 70 140 L 150 186 L 230 132 L 320 184 L 410 142 L 500 188 L 590 138 L 680 186 L 780 144 L 880 190 L 910 168 L 910 230 L -10 230 Z"
        fill="#111a2c"
        opacity="0.9"
      />

      {/* 지하 호수 */}
      <path d="M -10 236 Q 200 226 420 236 Q 640 246 910 232 L 910 268 L -10 268 Z" fill={`url(#${water})`} />
      {[60, 220, 430, 640, 820].map((x, index) => (
        <ellipse key={x} cx={x} cy={248 + (index % 2) * 8} rx="44" ry="3.4" fill="#7dd3fc" opacity="0.35" />
      ))}

      {/* 바닥 */}
      <path d="M -10 262 Q 240 254 460 264 Q 700 274 910 258 L 910 350 L -10 350 Z" fill={`url(#${ground})`} />
      <path d="M -10 262 Q 240 254 460 264 Q 700 274 910 258" stroke="#5c6f92" strokeWidth="4" fill="none" opacity="0.8" />

      {/* 발광 버섯 */}
      {[
        [90, 300, '#5eead4', 1.4],
        [196, 282, '#a78bfa', 1],
        [318, 312, '#5eead4', 1.1],
        [452, 288, '#f0abfc', 0.9],
        [586, 316, '#5eead4', 1.3],
        [712, 286, '#a78bfa', 1],
        [838, 306, '#5eead4', 1.2],
      ].map(([x, y, color, scale], index) => (
        <g key={index} transform={`translate(${x} ${y}) scale(${scale})`}>
          <circle cx="0" cy="-20" r="30" fill={`url(#${glow})`} />
          <rect x="-6" y="-18" width="12" height="20" rx="5" fill="#dbeafe" stroke="#13203a" strokeWidth="2.5" />
          <path d="M -22 -16 q 4 -24 22 -24 q 18 0 22 24 Z" fill={color as string} stroke="#13203a" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="-8" cy="-26" r="3.4" fill="#ffffff" opacity="0.85" />
          <circle cx="7" cy="-31" r="2.4" fill="#ffffff" opacity="0.8" />
        </g>
      ))}

      {/* 앞쪽 바위 */}
      {[
        [150, 324, 30, 12],
        [400, 332, 38, 14],
        [660, 326, 26, 10],
      ].map(([x, y, rx, ry], index) => (
        <g key={index}>
          <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#2b3752" stroke="#151d31" strokeWidth="3" />
          <ellipse cx={x - rx * 0.3} cy={y - ry * 0.4} rx={rx * 0.4} ry={ry * 0.35} fill="#45557a" opacity="0.7" />
        </g>
      ))}

      {/* 떠다니는 포자 */}
      <Motes color="#5eead4" count={16} seed={2} />
      {!reduceMotion && (
        <motion.ellipse
          cx="450"
          cy="248"
          rx="240"
          ry="18"
          fill="#7dd3fc"
          opacity="0.12"
          animate={{ opacity: [0.06, 0.18, 0.06] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </Frame>
  )
}

// ── 바람 절벽 ───────────────────────────────────────────────

function CliffBackdrop({ dim }: { dim: boolean }) {
  const uid = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const sky = `cliff-sky-${uid}`
  const rock = `cliff-rock-${uid}`
  const ground = `cliff-ground-${uid}`

  return (
    <Frame dim={dim}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0.1" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="50%" stopColor="#3c6b96" />
          <stop offset="100%" stopColor="#7ba8c9" />
        </linearGradient>
        <linearGradient id={rock} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#6b7a8f" />
          <stop offset="100%" stopColor="#36404f" />
        </linearGradient>
        <linearGradient id={ground} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7d8b6a" />
          <stop offset="30%" stopColor="#5a6b52" />
          <stop offset="100%" stopColor="#333d33" />
        </linearGradient>
      </defs>

      <rect width="900" height="340" fill={`url(#${sky})`} />
      <circle cx="760" cy="52" r="34" fill="#fef9c3" opacity="0.9" />
      <circle cx="760" cy="52" r="54" fill="#fef9c3" opacity="0.18" />

      {/* 흐르는 구름 */}
      {[
        [120, 70, 1.2, 0],
        [430, 46, 0.9, 2],
        [640, 96, 1.4, 4],
        [250, 130, 0.8, 6],
        [820, 140, 1.1, 3],
      ].map(([x, y, scale, delay], index) => (
        <motion.g
          key={index}
          animate={reduceMotion ? undefined : { x: [0, 26, 0] }}
          transition={{ duration: 14 + index * 2, delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.85">
            <ellipse cx="0" cy="0" rx="52" ry="17" fill="#eef6ff" />
            <ellipse cx="-28" cy="5" rx="30" ry="13" fill="#eef6ff" />
            <ellipse cx="26" cy="6" rx="34" ry="12" fill="#e2eefb" />
          </g>
        </motion.g>
      ))}

      {/* 먼 산 */}
      <path
        d="M -10 200 L 110 128 L 210 196 L 330 118 L 452 198 L 570 132 L 690 200 L 810 140 L 910 198 L 910 240 L -10 240 Z"
        fill="#4a5c74"
        opacity="0.6"
      />

      {/* 떠 있는 바위 */}
      {[
        [170, 176, 1],
        [612, 150, 0.8],
        [790, 202, 0.62],
      ].map(([x, y, scale], index) => (
        <motion.g
          key={index}
          animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
          transition={{ duration: 5 + index, repeat: Infinity, ease: 'easeInOut' }}
        >
          <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <path d="M -46 0 L -30 -16 L 30 -18 L 48 -2 L 22 26 L -18 24 Z" fill={`url(#${rock})`} stroke="#252d3a" strokeWidth="3" strokeLinejoin="round" />
            <path d="M -30 -16 L 30 -18 L 26 -8 L -26 -6 Z" fill="#7d8b6a" stroke="#252d3a" strokeWidth="2.5" />
            <path d="M -12 26 L -4 44 L 6 26 Z" fill="#36404f" />
          </g>
        </motion.g>
      ))}

      {/* 절벽 바닥 */}
      <path d="M -10 244 Q 220 232 450 246 Q 690 258 910 240 L 910 350 L -10 350 Z" fill={`url(#${ground})`} />
      <path d="M -10 244 Q 220 232 450 246 Q 690 258 910 240" stroke="#9db47f" strokeWidth="5" fill="none" opacity="0.85" />

      {/* 절벽 가장자리 바위 */}
      {[
        [80, 292, 34, 14],
        [330, 306, 26, 11],
        [700, 296, 38, 15],
      ].map(([x, y, rx, ry], index) => (
        <g key={index}>
          <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#5a6577" stroke="#2b3342" strokeWidth="3" />
          <ellipse cx={x - rx * 0.3} cy={y - ry * 0.4} rx={rx * 0.42} ry={ry * 0.36} fill="#79859a" opacity="0.7" />
        </g>
      ))}

      {/* 바람결 */}
      {!reduceMotion &&
        [
          [40, 214, 140],
          [420, 190, 190],
          [640, 226, 120],
        ].map(([x, y, w], index) => (
          <motion.path
            key={index}
            d={`M ${x} ${y} q ${w / 2} -14 ${w} 0`}
            stroke="#e2f1ff"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0], x: [0, 60, 120] }}
            transition={{ duration: 3.4 + index * 0.8, repeat: Infinity, ease: 'easeInOut', delay: index * 1.1 }}
          />
        ))}
    </Frame>
  )
}

// ── 별빛 유적 / 무한의 탑 ───────────────────────────────────

function RuinsBackdrop({ dim, endless }: { dim: boolean; endless: boolean }) {
  const uid = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const sky = `ruins-sky-${uid}`
  const stone = `ruins-stone-${uid}`
  const ground = `ruins-ground-${uid}`
  const halo = `ruins-halo-${uid}`

  const stars = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        x: 20 + ((index * 97) % 870),
        y: 14 + ((index * 53) % 170),
        r: index % 4 === 0 ? 2.6 : 1.5,
        delay: (index % 6) * 0.6,
      })),
    [],
  )

  return (
    <Frame dim={dim}>
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#0b1030" />
          <stop offset="55%" stopColor="#1a1b46" />
          <stop offset="100%" stopColor="#2b2357" />
        </linearGradient>
        <linearGradient id={stone} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#8d8fb4" />
          <stop offset="100%" stopColor="#3f3f66" />
        </linearGradient>
        <linearGradient id={ground} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a4673" />
          <stop offset="100%" stopColor="#221f3c" />
        </linearGradient>
        <radialGradient id={halo} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="900" height="340" fill={`url(#${sky})`} />

      {/* 별과 별자리 */}
      {stars.map((star, index) => (
        <motion.circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill="#e9e5ff"
          animate={reduceMotion ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3 + (index % 4), delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <g stroke="#a5b4fc" strokeWidth="1.4" opacity="0.5" fill="none">
        <path d="M 150 40 L 218 74 L 282 44 L 340 90" />
        <path d="M 600 36 L 664 78 L 742 50" />
      </g>

      {/* 큰 달 */}
      <circle cx="470" cy="78" r="54" fill={`url(#${halo})`} />
      <circle cx="470" cy="78" r="30" fill="#ddd6fe" opacity="0.92" />
      <circle cx="460" cy="70" r="7" fill="#c7bff5" opacity="0.7" />

      {/* 석조 구조물 */}
      {[
        [96, 240, 116],
        [232, 244, 84],
        [648, 242, 96],
        [790, 238, 130],
      ].map(([x, baseY, height], index) => (
        <g key={index}>
          <rect x={x} y={baseY - height} width="38" height={height} rx="4" fill={`url(#${stone})`} stroke="#241f3f" strokeWidth="3" />
          <rect x={x + 5} y={baseY - height} width="11" height={height} fill="#a9a9d0" opacity="0.45" />
          <rect x={x - 8} y={baseY - height - 14} width="54" height="14" rx="4" fill="#5c5a86" stroke="#241f3f" strokeWidth="3" />
          <rect x={x - 8} y={baseY - 12} width="54" height="14" rx="4" fill="#5c5a86" stroke="#241f3f" strokeWidth="3" />
          {/* 새겨진 별 문양 */}
          <path d={`M ${x + 19} ${baseY - height / 2 - 9} l 3 7 l 7 2 l -7 2 l -3 7 l -3 -7 l -7 -2 l 7 -2 Z`} fill="#c4b5fd" opacity="0.85" />
        </g>
      ))}

      {/* 가운데 고대 장치 */}
      <g transform="translate(450 214)">
        <circle cx="0" cy="0" r="62" fill={`url(#${halo})`} />
        <motion.g
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '0px', originY: '0px' }}
        >
          <circle cx="0" cy="0" r="38" stroke="#a5b4fc" strokeWidth="3.5" fill="none" opacity="0.8" />
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (index / 6) * Math.PI * 2
            return (
              <circle key={index} cx={Math.cos(angle) * 38} cy={Math.sin(angle) * 38} r="4.6" fill="#ddd6fe" />
            )
          })}
        </motion.g>
        <circle cx="0" cy="0" r="16" fill="#312e81" stroke="#a5b4fc" strokeWidth="3" />
        <circle cx="-4" cy="-4" r="4" fill="#e9e5ff" opacity="0.8" />
      </g>

      {/* 바닥 */}
      <path d="M -10 244 Q 230 236 460 246 Q 700 256 910 240 L 910 350 L -10 350 Z" fill={`url(#${ground})`} />
      <path d="M -10 244 Q 230 236 460 246 Q 700 256 910 240" stroke="#8b83c7" strokeWidth="4" fill="none" opacity="0.8" />
      <g stroke="#6f68a8" strokeWidth="2.4" opacity="0.6">
        <path d="M 70 268 h 150" />
        <path d="M 300 290 h 180" />
        <path d="M 560 266 h 160" />
      </g>

      {/* 부서진 조각 */}
      {[
        [180, 316, 28],
        [520, 324, 22],
        [742, 310, 32],
      ].map(([x, y, w], index) => (
        <path
          key={index}
          d={`M ${x - w} ${y} l ${w * 0.4} ${-w * 0.6} l ${w * 0.8} ${w * 0.1} l ${w * 0.5} ${w * 0.5} Z`}
          fill="#4a4673"
          stroke="#241f3f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      ))}

      {endless && (
        <g opacity="0.55">
          {/* 끝없이 이어지는 계단 실루엣 */}
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <rect
              key={index}
              x={330 + index * 42}
              y={238 - index * 26}
              width="46"
              height="26"
              fill="#2b2652"
              stroke="#4a4673"
              strokeWidth="2.5"
            />
          ))}
        </g>
      )}

      <Motes color="#c4b5fd" count={14} seed={3} />
    </Frame>
  )
}
