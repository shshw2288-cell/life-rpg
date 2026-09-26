import { Lock, RotateCcw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell, Panel } from '../components/layout/PageShell'
import { findFurniture } from '../data/roomConfig'
import { furnitureProgress } from '../engine/achievements'
import { FurnitureSprite } from '../features/room/FurnitureSprite'
import { RoomScene } from '../features/room/RoomScene'
import { useGameStore } from '../store/useGameStore'

/**
 * 내 방(거점).
 *
 * 가구를 고른 뒤 빈 칸을 눌러 놓는다. 모바일에서도 같은 방식이라 드래그가 필요 없다.
 * 배치를 초기화해도 보유 가구는 사라지지 않는다.
 */
export function RoomPage() {
  const room = useGameStore((state) => state.room)
  const subjects = useGameStore((state) => state.subjects)
  const workout = useGameStore((state) => state.workout)
  const tower = useGameStore((state) => state.tower)
  const character = useGameStore((state) => state.character)
  const placeFurniture = useGameStore((state) => state.placeFurniture)
  const pickUpFurniture = useGameStore((state) => state.pickUpFurniture)
  const resetRoom = useGameStore((state) => state.resetRoom)
  const syncRoomUnlocks = useGameStore((state) => state.syncRoomUnlocks)

  const [placing, setPlacing] = useState<string | null>(null)

  // 화면에 들어올 때 새로 채운 조건이 있으면 가구를 받아 둔다
  useEffect(() => {
    syncRoomUnlocks()
  }, [syncRoomUnlocks])

  const progress = furnitureProgress({ subjects, workout, tower, character })
  const placedIds = new Set(room.placements.map((placement) => placement.furnitureId))
  const stored = room.owned.filter((id) => !placedIds.has(id))
  const locked = progress.filter((entry) => !entry.achieved)

  const handlePlace = (x: number, y: number) => {
    if (!placing) return
    placeFurniture(placing, x, y)
    setPlacing(null)
  }

  const handlePick = (furnitureId: string) => {
    // 놓여 있는 가구를 누르면 들어 올려 다시 배치 모드가 된다
    pickUpFurniture(furnitureId)
    setPlacing(furnitureId)
  }

  return (
    <PageShell
      title="내 방"
      description="모험과 현실에서 얻은 것을 전시하는 거점입니다. 가구를 고르고 빈 칸을 누르면 놓입니다."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          {placing && (
            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-emerald-500/70 bg-emerald-500/10 px-3 py-2">
              <p className="text-sm text-emerald-200">
                <span className="font-bold">{findFurniture(placing)?.name}</span> — 초록색 칸을 눌러
                놓으세요
              </p>
              <button
                type="button"
                onClick={() => setPlacing(null)}
                className="shrink-0 rounded-lg border border-emerald-500/60 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
              >
                취소
              </button>
            </div>
          )}

          <RoomScene
            placements={room.placements}
            placing={placing}
            onPlace={handlePlace}
            onPick={handlePick}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              놓인 가구를 누르면 들어 올려 다른 자리로 옮길 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => {
                resetRoom()
                setPlacing(null)
              }}
              className="flex items-center gap-1.5 rounded-lg border border-abyss-700 bg-abyss-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-abyss-700"
            >
              <RotateCcw size={13} aria-hidden />
              배치 초기화
            </button>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <Panel title={`보관함 (${stored.length})`}>
            {stored.length === 0 ? (
              <p className="text-xs text-slate-500">
                가진 가구를 모두 놓았습니다. 아래 목록의 조건을 채우면 새 가구가 늘어납니다.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-2">
                {stored.map((id) => {
                  const def = findFurniture(id)
                  if (!def) return null
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setPlacing(id)}
                        aria-pressed={placing === id}
                        className={`flex w-full flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 transition-colors ${
                          placing === id
                            ? 'border-emerald-400 bg-emerald-500/10'
                            : 'border-abyss-700 bg-abyss-800/60 hover:bg-abyss-700'
                        }`}
                      >
                        <span className="flex h-14 items-end">
                          <FurnitureSprite def={def} size={def.size.w > 1 ? 34 : 54} />
                        </span>
                        <span className="text-[11px] font-semibold text-slate-200">{def.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {def.area === 'wall' ? '벽' : '바닥'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          <Panel title={`성취로 여는 가구 (${locked.length})`}>
            {locked.length === 0 ? (
              <p className="text-xs text-emerald-400">
                모든 가구를 모았습니다. 방을 마음껏 꾸며 보세요!
              </p>
            ) : (
              <ul className="space-y-2.5">
                {locked.map((entry) => (
                  <li key={entry.def.id} className="rounded-lg border border-abyss-700 bg-abyss-800/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Lock size={13} aria-hidden className="shrink-0 text-slate-600" />
                      <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-300">
                        {entry.def.name}
                      </p>
                      <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                        {Math.min(entry.current, entry.target)} / {entry.target}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">{entry.label}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-abyss-700">
                      <div
                        className="h-full bg-ember-400"
                        style={{
                          width: `${Math.min(100, (entry.current / Math.max(1, entry.target)) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 border-t border-abyss-700 pt-2 text-[11px] text-slate-500">
              실제로 저장된 기록만 셉니다.{' '}
              <Link to="/study" className="text-ember-400 underline underline-offset-2">
                공부
              </Link>
              의 회독 수,{' '}
              <Link to="/workout" className="text-ember-400 underline underline-offset-2">
                운동
              </Link>
              의 3대 기록,{' '}
              <Link to="/dungeon" className="text-ember-400 underline underline-offset-2">
                모험
              </Link>
              의 보스 격파가 그대로 조건이 됩니다.
            </p>
          </Panel>

          <Panel title="다음 목표">
            <p className="flex items-start gap-2 text-xs text-slate-400">
              <Sparkles size={14} aria-hidden className="mt-0.5 shrink-0 text-ember-400" />
              현실에서 하나 해내면 캐릭터가 자라고, 그 힘으로 지역을 열면 그 증표가 이 방에
              쌓입니다.
            </p>
          </Panel>
        </aside>
      </div>
    </PageShell>
  )
}
