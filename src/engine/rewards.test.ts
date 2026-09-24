import { describe, expect, it } from 'vitest'
import { DIFFICULTY_TABLE, HABIT_DIMINISHING } from '../data/gameConfig'
import { stageForLevel, didEvolve, levelsUntilNextStage } from './evolution'
import { progressPets } from './pets'
import { completionReward, negativeHabitPenalty, positiveHabitReward } from './rewards'

describe('보상 계산', () => {
  it('완료 보상은 난이도 표를 따른다', () => {
    expect(completionReward(3)).toEqual({ exp: 20, gold: 10, hp: 0 })
  })

  it('첫 습관 기록은 기본 보상을 전부 받는다', () => {
    const reward = positiveHabitReward(3, 0)
    expect(reward.exp).toBe(DIFFICULTY_TABLE[3].exp)
  })

  it('같은 날 반복할수록 보상이 줄어든다', () => {
    const first = positiveHabitReward(3, 0)
    const fourth = positiveHabitReward(3, 3)
    expect(fourth.exp).toBeLessThan(first.exp)
  })

  it('보상이 최저 비율 아래로는 떨어지지 않는다', () => {
    const many = positiveHabitReward(5, 50)
    const floor = DIFFICULTY_TABLE[5].exp * HABIT_DIMINISHING.floorRatio
    expect(many.exp).toBeGreaterThanOrEqual(Math.round(floor))
  })

  it('부정 습관은 HP만 깎는다', () => {
    const penalty = negativeHabitPenalty(4)
    expect(penalty).toEqual({ exp: 0, gold: 0, hp: -DIFFICULTY_TABLE[4].damage })
  })
})

describe('진화 단계', () => {
  it('레벨에 맞는 단계를 고른다', () => {
    expect(stageForLevel(1).id).toBe('spore')
    expect(stageForLevel(5).id).toBe('sprout')
    expect(stageForLevel(12).id).toBe('explorer')
    expect(stageForLevel(20).id).toBe('guardian')
    expect(stageForLevel(99).id).toBe('cosmic')
  })

  it('단계 경계를 넘을 때만 진화로 본다', () => {
    expect(didEvolve(4, 5)).toBe(true)
    expect(didEvolve(5, 6)).toBe(false)
  })

  it('다음 진화까지 남은 레벨을 센다', () => {
    expect(levelsUntilNextStage(3)).toBe(2)
    expect(levelsUntilNextStage(99)).toBe(0)
  })
})

describe('펫 시스템', () => {
  const ids = () => {
    let count = 0
    return () => `id-${(count += 1)}`
  }

  it('확률에 걸리면 알을 얻는다', () => {
    const result = progressPets({ eggs: [], pets: [], today: '2025-09-25', rng: () => 0, newId: ids() })
    expect(result.eggs).toHaveLength(1)
    expect(result.newEgg).toBeDefined()
  })

  it('확률에 걸리지 않으면 알이 생기지 않는다', () => {
    const result = progressPets({ eggs: [], pets: [], today: '2025-09-25', rng: () => 0.99, newId: ids() })
    expect(result.eggs).toHaveLength(0)
  })

  it('완료할 때마다 알의 진행도가 오른다', () => {
    const egg = { id: 'e1', progress: 0, required: 10, obtainedOn: '2025-09-20' }
    const result = progressPets({
      eggs: [egg],
      pets: [],
      today: '2025-09-25',
      rng: () => 0.99,
      newId: ids(),
    })
    expect(result.eggs[0].progress).toBe(1)
  })

  it('진행도가 차면 부화한다', () => {
    const egg = { id: 'e1', progress: 9, required: 10, obtainedOn: '2025-09-20' }
    const result = progressPets({
      eggs: [egg],
      pets: [],
      today: '2025-09-25',
      rng: () => 0.99,
      newId: ids(),
    })
    expect(result.eggs).toHaveLength(0)
    expect(result.pets).toHaveLength(1)
    expect(result.hatched?.hatchedOn).toBe('2025-09-25')
  })
})
