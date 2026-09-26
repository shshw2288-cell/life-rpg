import {
  DEFAULT_PLACEMENTS,
  ROOM_GRID,
  findFurniture,
  type FurnitureDef,
} from '../data/roomConfig'
import type { FurniturePlacement } from '../types/room'

/**
 * 내 방 배치 규칙. 순수 함수만 둔다.
 *
 * 격자 위쪽 ROOM_GRID.wallRows 줄은 벽, 나머지는 바닥이다.
 * 경계를 벗어나거나 이미 찬 칸과 겹치면 놓을 수 없다.
 */

/** 가구가 차지하는 칸들 */
export function cellsOf(def: FurnitureDef, x: number, y: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = []
  for (let dx = 0; dx < def.size.w; dx += 1) {
    for (let dy = 0; dy < def.size.h; dy += 1) cells.push({ x: x + dx, y: y + dy })
  }
  return cells
}

function isWall(y: number): boolean {
  return y < ROOM_GRID.wallRows
}

export interface PlaceCheck {
  ok: boolean
  reason?: string
}

/** 여기에 놓을 수 있는가 */
export function canPlace(
  placements: FurniturePlacement[],
  def: FurnitureDef,
  x: number,
  y: number,
): PlaceCheck {
  if (x < 0 || y < 0 || x + def.size.w > ROOM_GRID.cols || y + def.size.h > ROOM_GRID.rows) {
    return { ok: false, reason: '방 밖으로 나갑니다' }
  }

  const cells = cellsOf(def, x, y)
  const wantsWall = def.area === 'wall'
  if (cells.some((cell) => isWall(cell.y) !== wantsWall)) {
    return { ok: false, reason: wantsWall ? '벽에만 걸 수 있습니다' : '바닥에만 놓을 수 있습니다' }
  }

  const taken = new Set<string>()
  for (const placement of placements) {
    if (placement.furnitureId === def.id) continue // 자기 자신을 옮기는 중
    const other = findFurniture(placement.furnitureId)
    if (!other) continue
    for (const cell of cellsOf(other, placement.x, placement.y)) taken.add(`${cell.x},${cell.y}`)
  }
  if (cells.some((cell) => taken.has(`${cell.x},${cell.y}`))) {
    return { ok: false, reason: '다른 가구와 겹칩니다' }
  }

  return { ok: true }
}

/** 놓기(이미 놓여 있으면 그 자리로 옮긴다). 놓을 수 없으면 null. */
export function placeFurniture(
  placements: FurniturePlacement[],
  furnitureId: string,
  x: number,
  y: number,
): FurniturePlacement[] | null {
  const def = findFurniture(furnitureId)
  if (!def) return null
  const check = canPlace(placements, def, x, y)
  if (!check.ok) return null
  return [...placements.filter((item) => item.furnitureId !== furnitureId), { furnitureId, x, y }]
}

/** 회수 — 보유 목록에서는 사라지지 않고 배치에서만 내려온다 */
export function removeFurniture(
  placements: FurniturePlacement[],
  furnitureId: string,
): FurniturePlacement[] {
  return placements.filter((item) => item.furnitureId !== furnitureId)
}

/** 배치 초기화. 기본 배치 중 보유한 것만 남긴다 (보유 가구는 그대로 유지된다). */
export function resetPlacements(owned: string[]): FurniturePlacement[] {
  const have = new Set(owned)
  return DEFAULT_PLACEMENTS.filter((placement) => have.has(placement.furnitureId)).map(
    (placement) => ({ ...placement }),
  )
}

/** 저장된 배치에서 규칙에 어긋난 것을 걸러낸다 (설정이 바뀌어도 화면이 깨지지 않게) */
export function sanitizePlacements(
  placements: FurniturePlacement[],
  owned: string[],
): FurniturePlacement[] {
  const have = new Set(owned)
  const result: FurniturePlacement[] = []
  for (const placement of placements) {
    if (!have.has(placement.furnitureId)) continue
    const def = findFurniture(placement.furnitureId)
    if (!def) continue
    if (result.some((item) => item.furnitureId === placement.furnitureId)) continue
    if (!canPlace(result, def, placement.x, placement.y).ok) continue
    result.push({ ...placement })
  }
  return result
}

/** 빈 칸 중 이 가구를 놓을 수 있는 첫 자리. 새로 얻은 가구를 자동으로 놓을 때 쓴다. */
export function firstFreeSpot(
  placements: FurniturePlacement[],
  def: FurnitureDef,
): { x: number; y: number } | null {
  for (let y = 0; y < ROOM_GRID.rows; y += 1) {
    for (let x = 0; x < ROOM_GRID.cols; x += 1) {
      if (canPlace(placements, def, x, y).ok) return { x, y }
    }
  }
  return null
}
