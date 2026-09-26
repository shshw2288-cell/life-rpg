import { useId } from 'react'
import { LumiAvatar } from '../../components/character/LumiAvatar'
import { findSpecies } from '../../data/petConfig'
import { ROOM_GRID, findFurniture } from '../../data/roomConfig'
import { canPlace } from '../../engine/room'
import { stageForLevel } from '../../engine/evolution'
import { useGameStore } from '../../store/useGameStore'
import type { FurniturePlacement } from '../../types/room'
import { PetSprite } from '../pets/PetSprite'
import { FurnitureShapes } from './FurnitureSprite'

/**
 * 내 방 화면.
 *
 * 위 두 줄은 벽, 아래 두 줄은 바닥인 격자다.
 * 가구를 고른 뒤(placing) 빈 칸을 누르면 그 자리에 놓인다 — 모바일에서도 같은 방식으로 쓴다.
 */
export function RoomScene({
  placements,
  placing,
  onPlace,
  onPick,
}: {
  placements: FurniturePlacement[]
  /** 지금 놓으려고 고른 가구 id. null이면 배치 모드가 아니다. */
  placing: string | null
  onPlace: (x: number, y: number) => void
  onPick: (furnitureId: string) => void
}) {
  const uid = useId().replace(/:/g, '')
  const level = useGameStore((state) => state.character.level)
  const cosmetics = useGameStore((state) => state.cosmetics)
  const activePetId = useGameStore((state) => state.activePetId)
  const stage = stageForLevel(level)
  const petSpecies = activePetId ? findSpecies(activePetId) : undefined

  const placingDef = placing ? findFurniture(placing) : undefined

  const gridStyle = {
    gridTemplateColumns: `repeat(${ROOM_GRID.cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${ROOM_GRID.rows}, minmax(0, 1fr))`,
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-abyss-700">
      {/* 벽과 바닥 */}
      <svg
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`wall-${uid}`} x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#3b3355" />
            <stop offset="100%" stopColor="#2d2744" />
          </linearGradient>
          <linearGradient id={`floor-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5f36" />
            <stop offset="100%" stopColor="#5f3f23" />
          </linearGradient>
        </defs>
        <rect width="600" height="160" fill={`url(#wall-${uid})`} />
        {/* 벽지 무늬 */}
        <g opacity="0.16" fill="#cbb7ff">
          {Array.from({ length: 24 }, (_, index) => (
            <circle key={index} cx={25 + (index % 8) * 75} cy={26 + Math.floor(index / 8) * 52} r="6" />
          ))}
        </g>
        <rect y="160" width="600" height="240" fill={`url(#floor-${uid})`} />
        {/* 마루 결 */}
        <g stroke="#4a2f19" strokeWidth="2" opacity="0.5">
          {[196, 236, 280, 328, 380].map((y) => (
            <path key={y} d={`M 0 ${y} H 600`} />
          ))}
        </g>
        <rect y="154" width="600" height="12" fill="#4a3a63" />
      </svg>

      {/* 빈 칸 (배치 모드에서만 누를 수 있다) */}
      <div className="relative grid aspect-[8/5] w-full gap-0.5 p-1.5" style={gridStyle}>
        {Array.from({ length: ROOM_GRID.cols * ROOM_GRID.rows }, (_, index) => {
          const x = index % ROOM_GRID.cols
          const y = Math.floor(index / ROOM_GRID.cols)
          const allowed = placingDef ? canPlace(placements, placingDef, x, y) : { ok: false }
          return (
            <button
              key={index}
              type="button"
              onClick={() => onPlace(x, y)}
              disabled={!placingDef || !allowed.ok}
              aria-label={`${x + 1}열 ${y + 1}행${allowed.ok ? ' — 여기에 놓기' : ''}`}
              className={`rounded transition-colors ${
                placingDef
                  ? allowed.ok
                    ? 'border-2 border-dashed border-emerald-400/70 bg-emerald-400/10 hover:bg-emerald-400/25'
                    : 'border border-dashed border-white/5'
                  : 'cursor-default'
              }`}
              style={{ gridColumn: x + 1, gridRow: y + 1 }}
            />
          )
        })}
      </div>

      {/* 놓인 가구 */}
      <div className="pointer-events-none absolute inset-0 grid gap-0.5 p-1.5" style={gridStyle}>
        {placements.map((placement) => {
          const def = findFurniture(placement.furnitureId)
          if (!def) return null
          return (
            <button
              key={placement.furnitureId}
              type="button"
              onClick={() => onPick(placement.furnitureId)}
              title={`${def.name} — 눌러서 옮기기`}
              className="pointer-events-auto flex items-end justify-center rounded transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember-400"
              style={{
                gridColumn: `${placement.x + 1} / span ${def.size.w}`,
                gridRow: `${placement.y + 1} / span ${def.size.h}`,
              }}
            >
              <svg
                viewBox={`0 0 ${100 * def.size.w} ${100 * def.size.h}`}
                className="h-full w-full"
                role="img"
                aria-label={def.name}
              >
                <FurnitureShapes art={def.art} />
              </svg>
            </button>
          )
        })}
      </div>

      {/* 루미와 동행 펫 — 방 한가운데 앞쪽에 선다 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex items-end justify-center gap-1">
        <LumiAvatar stage={stage} size={104} cosmetics={cosmetics} shadow />
        {petSpecies && <PetSprite species={petSpecies} size={52} idle />}
      </div>
    </div>
  )
}

