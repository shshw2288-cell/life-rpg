import { describe, expect, it } from 'vitest'
import { FURNITURE, ROOM_GRID, STARTER_FURNITURE, findFurniture } from '../data/roomConfig'
import type { FurniturePlacement } from '../types/room'
import { achievedFurnitureIds, furnitureProgress, newlyAchievedFurniture } from './achievements'
import { canPlace, firstFreeSpot, placeFurniture, removeFurniture, resetPlacements, sanitizePlacements } from './room'
import { EMPTY_WORKOUT } from '../types/workout'

const desk = findFurniture('desk')!
const plant = findFurniture('plant_small')!
const window = findFurniture('window')!

describe('가구 배치', () => {
  it('바닥 가구는 바닥에만 놓을 수 있다', () => {
    expect(canPlace([], desk, 0, 3).ok).toBe(true)
    expect(canPlace([], desk, 0, 0).ok).toBe(false)
  })

  it('벽 가구는 벽에만 걸 수 있다', () => {
    expect(canPlace([], window, 0, 0).ok).toBe(true)
    expect(canPlace([], window, 0, 3).ok).toBe(false)
  })

  it('경계 밖으로 나가면 놓을 수 없다', () => {
    expect(canPlace([], desk, ROOM_GRID.cols - 1, 3).ok).toBe(false)
    expect(canPlace([], plant, ROOM_GRID.cols, 3).ok).toBe(false)
    expect(canPlace([], plant, 0, ROOM_GRID.rows).ok).toBe(false)
    expect(canPlace([], plant, -1, 3).ok).toBe(false)
  })

  it('다른 가구와 겹치면 놓을 수 없다', () => {
    const placements: FurniturePlacement[] = [{ furnitureId: 'desk', x: 0, y: 3 }]
    expect(canPlace(placements, plant, 0, 3).ok).toBe(false)
    expect(canPlace(placements, plant, 1, 3).ok).toBe(false) // 책상은 2칸
    expect(canPlace(placements, plant, 2, 3).ok).toBe(true)
  })

  it('놓을 수 없는 자리에는 아무 일도 하지 않는다', () => {
    expect(placeFurniture([], 'desk', 0, 0)).toBeNull()
    expect(placeFurniture([], '없는가구', 0, 3)).toBeNull()
  })

  it('이미 놓인 가구는 자리를 옮긴다 (두 개가 되지 않는다)', () => {
    const first = placeFurniture([], 'plant_small', 0, 3)!
    const moved = placeFurniture(first, 'plant_small', 4, 2)!
    expect(moved).toHaveLength(1)
    expect(moved[0]).toEqual({ furnitureId: 'plant_small', x: 4, y: 2 })
  })

  it('회수해도 보유 목록은 건드리지 않는다', () => {
    const placements = placeFurniture([], 'plant_small', 0, 3)!
    expect(removeFurniture(placements, 'plant_small')).toHaveLength(0)
  })

  it('배치를 초기화해도 보유 가구는 남는다', () => {
    const owned = [...STARTER_FURNITURE, 'trophy_forest']
    const reset = resetPlacements(owned)
    // 기본 배치에 없는 가구는 보관함으로 갈 뿐 사라지지 않는다
    expect(reset.every((placement) => owned.includes(placement.furnitureId))).toBe(true)
    expect(owned).toContain('trophy_forest')
  })

  it('저장된 배치가 규칙에 어긋나면 걸러낸다', () => {
    const broken: FurniturePlacement[] = [
      { furnitureId: 'desk', x: 0, y: 0 }, // 벽에 바닥 가구
      { furnitureId: 'plant_small', x: 99, y: 3 }, // 경계 밖
      { furnitureId: 'trophy_forest', x: 2, y: 3 }, // 가지고 있지 않음
      { furnitureId: 'bed', x: 0, y: 3 }, // 정상
    ]
    const cleaned = sanitizePlacements(broken, STARTER_FURNITURE)
    expect(cleaned).toEqual([{ furnitureId: 'bed', x: 0, y: 3 }])
  })

  it('빈 자리를 찾아 준다', () => {
    const spot = firstFreeSpot([], plant)
    expect(spot).not.toBeNull()
    expect(canPlace([], plant, spot!.x, spot!.y).ok).toBe(true)
  })

  it('가구 id가 중복되지 않는다', () => {
    expect(new Set(FURNITURE.map((item) => item.id)).size).toBe(FURNITURE.length)
  })
})

describe('성취로 여는 가구', () => {
  const empty = {
    subjects: [],
    workout: EMPTY_WORKOUT,
    tower: { highestCleared: 0, lastFloor: 1 },
    character: { level: 1 },
  }

  function subject(rounds: number) {
    return {
      id: `s-${rounds}`,
      name: '수학',
      difficulty: 3 as const,
      rounds,
      color: '#fff',
      createdOn: '2025-09-01',
      createdAt: '',
      updatedAt: '',
    }
  }

  it('아무 기록도 없으면 기본 가구만 준다', () => {
    expect(achievedFurnitureIds(empty).sort()).toEqual([...STARTER_FURNITURE].sort())
  })

  it('실제로 저장된 회독 수만 센다', () => {
    const source = { ...empty, subjects: [subject(6), subject(4)] }
    expect(achievedFurnitureIds(source)).toContain('bookshelf')
    expect(achievedFurnitureIds(source)).not.toContain('book_stack')
  })

  it('3대 기록 합계로 운동 가구가 열린다', () => {
    const source = {
      ...empty,
      workout: {
        ...EMPTY_WORKOUT,
        bigThreeBest: { bench: 40, squat: 40, deadlift: 40 },
      },
    }
    expect(achievedFurnitureIds(source)).toContain('dumbbell')
    expect(achievedFurnitureIds(source)).not.toContain('medal')
  })

  it('보스를 잡아야 트로피가 열린다', () => {
    const before = { ...empty, tower: { highestCleared: 9, lastFloor: 9 } }
    const after = { ...empty, tower: { highestCleared: 10, lastFloor: 10 } }
    expect(achievedFurnitureIds(before)).not.toContain('trophy_forest')
    expect(achievedFurnitureIds(after)).toContain('trophy_forest')
    expect(achievedFurnitureIds(after)).toContain('sprout_pot')
  })

  it('이미 가진 가구는 다시 주지 않는다 (중복 집계 방지)', () => {
    const source = { ...empty, subjects: [subject(12)] }
    const fresh = newlyAchievedFurniture(source, STARTER_FURNITURE)
    expect(fresh.map((def) => def.id)).toEqual(['bookshelf'])
    // 한 번 받은 뒤에는 비어 있다
    expect(newlyAchievedFurniture(source, [...STARTER_FURNITURE, 'bookshelf'])).toHaveLength(0)
  })

  it('진행도를 현재값과 목표값으로 알려준다', () => {
    const source = { ...empty, subjects: [subject(4)] }
    const entry = furnitureProgress(source).find((item) => item.def.id === 'bookshelf')!
    expect(entry.current).toBe(4)
    expect(entry.target).toBe(10)
    expect(entry.achieved).toBe(false)
    expect(entry.label).toContain('회독')
  })
})
