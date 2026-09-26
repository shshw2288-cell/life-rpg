import { describe, expect, it } from 'vitest'
import { GATED_REGIONS, REGIONS, findRegion } from '../data/regionConfig'
import { BOSS_INTERVAL } from '../data/towerConfig'
import {
  allRegionStatuses,
  clearedRegionIds,
  newlyClearedRegion,
  regionFloors,
  regionForFloor,
  regionStatus,
} from './regions'
import { isBossFloor } from './tower'

describe('지역 구성', () => {
  it('지역이 탑의 층을 빈틈없이 덮는다', () => {
    for (let floor = 1; floor <= 60; floor += 1) {
      expect(regionForFloor(floor)).toBeDefined()
    }
    expect(regionForFloor(1).id).toBe('forest')
    expect(regionForFloor(10).id).toBe('forest')
    expect(regionForFloor(11).id).toBe('cave')
    expect(regionForFloor(30).id).toBe('cliff')
    expect(regionForFloor(31).id).toBe('ruins')
    expect(regionForFloor(41).id).toBe('endless')
    expect(regionForFloor(999).id).toBe('endless')
  })

  it('지역마다 일반 전투 3개 이상과 보스 1개가 있다', () => {
    for (const region of GATED_REGIONS) {
      const floors: number[] = []
      for (let floor = region.floors.from; floor <= (region.floors.to ?? 0); floor += 1) {
        floors.push(floor)
      }
      const bosses = floors.filter(isBossFloor)
      expect(bosses).toHaveLength(1)
      expect(floors.length - bosses.length).toBeGreaterThanOrEqual(3)
      expect(region.bossFloor! % BOSS_INTERVAL).toBe(0)
    }
  })

  it('지역 id와 보상 id가 중복되지 않는다', () => {
    expect(new Set(REGIONS.map((region) => region.id)).size).toBe(REGIONS.length)
    const rewards = REGIONS.map((region) => region.firstClearReward?.id).filter(Boolean)
    expect(new Set(rewards).size).toBe(rewards.length)
  })
})

describe('지역 해금', () => {
  it('첫 지역은 처음부터 열려 있다', () => {
    expect(regionStatus(findRegion('forest')!, 0).unlocked).toBe(true)
  })

  it('앞 지역의 보스를 잡아야 다음 지역이 열린다', () => {
    expect(regionStatus(findRegion('cave')!, 9).unlocked).toBe(false)
    expect(regionStatus(findRegion('cave')!, 10).unlocked).toBe(true)
    expect(regionStatus(findRegion('ruins')!, 29).unlocked).toBe(false)
    expect(regionStatus(findRegion('ruins')!, 30).unlocked).toBe(true)
  })

  it('잠긴 이유를 알려준다', () => {
    expect(regionStatus(findRegion('cliff')!, 0).lockReason).toContain('버섯 동굴')
  })

  it('기존 진행도를 그대로 인정한다 (지역 기능 이전 세이브)', () => {
    // 지역 개념 없이 25층까지 오른 저장 데이터
    expect(clearedRegionIds(25)).toEqual(['forest', 'cave'])
    const statuses = allRegionStatuses(25)
    expect(statuses.filter((status) => status.unlocked).map((status) => status.region.id)).toEqual([
      'forest',
      'cave',
      'cliff',
    ])
  })

  it('진행도를 별도로 저장하지 않고 층 수만으로 계산한다', () => {
    const status = regionStatus(findRegion('forest')!, 6)
    expect(status.clearedFloors).toBe(6)
    expect(status.totalFloors).toBe(10)
    expect(status.nextFloor).toBe(7)
  })

  it('다 깬 지역은 다시 도전할 수 있다', () => {
    const floors = regionFloors(findRegion('forest')!, 40)
    expect(floors).toHaveLength(10)
    expect(floors[0]).toBe(1)
    expect(floors[9]).toBe(10)
  })

  it('아직 못 간 층은 목록에 나오지 않는다', () => {
    expect(regionFloors(findRegion('forest')!, 3)).toEqual([1, 2, 3, 4])
  })
})

describe('첫 클리어 보상', () => {
  it('보스 층을 처음 깨면 그 지역을 돌려준다', () => {
    expect(newlyClearedRegion(10, [])?.id).toBe('forest')
    expect(newlyClearedRegion(20, [])?.id).toBe('cave')
  })

  it('이미 받은 지역은 다시 주지 않는다', () => {
    expect(newlyClearedRegion(10, ['forest'])).toBeUndefined()
  })

  it('보스 층이 아니면 주지 않는다', () => {
    expect(newlyClearedRegion(9, [])).toBeUndefined()
    expect(newlyClearedRegion(41, [])).toBeUndefined()
  })
})
