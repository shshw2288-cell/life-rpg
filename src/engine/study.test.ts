import { describe, expect, it } from 'vitest'
import { DIFFICULTY_TABLE } from '../data/gameConfig'
import { STUDY } from '../data/studyConfig'
import type { TaskEvent } from '../types/task'
import { activityByDate, buildMonthGrid, intensityOf, shiftMonth } from './calendar'
import { countRoundsOn, justReachedTarget, roundReward, totalRoundsOn } from './study'

function event(overrides: Partial<TaskEvent> & { localDate: string }): TaskEvent {
  return {
    id: `e-${Math.random()}`,
    taskId: 's1',
    action: 'study_round',
    timestamp: `${overrides.localDate}T10:00:00.000Z`,
    expDelta: 20,
    goldDelta: 10,
    hpDelta: 0,
    ...overrides,
  }
}

describe('회독 보상', () => {
  it('첫 회독은 난이도 기본 보상을 받는다', () => {
    expect(roundReward(3, 0).exp).toBe(DIFFICULTY_TABLE[3].exp)
  })

  it('같은 날 반복하면 보상이 줄어든다', () => {
    expect(roundReward(3, 3).exp).toBeLessThan(roundReward(3, 0).exp)
  })

  it('최저 비율 아래로는 내려가지 않는다', () => {
    const floor = DIFFICULTY_TABLE[5].exp * STUDY.diminishing.floorRatio
    expect(roundReward(5, 99).exp).toBeGreaterThanOrEqual(Math.round(floor))
  })

  it('목표 달성은 딱 그 회차에만 참이다', () => {
    expect(justReachedTarget(3, 3)).toBe(true)
    expect(justReachedTarget(4, 3)).toBe(false)
    expect(justReachedTarget(3, undefined)).toBe(false)
  })
})

describe('회독 집계', () => {
  const events = [
    event({ localDate: '2025-09-25' }),
    event({ localDate: '2025-09-25' }),
    event({ localDate: '2025-09-25', taskId: 's2' }),
    event({ localDate: '2025-09-24' }),
    event({ localDate: '2025-09-25', action: 'complete' }),
  ]

  it('과목별 당일 회독 수를 센다', () => {
    expect(countRoundsOn(events, 's1', '2025-09-25')).toBe(2)
    expect(countRoundsOn(events, 's2', '2025-09-25')).toBe(1)
  })

  it('과제 완료는 회독으로 세지 않는다', () => {
    expect(totalRoundsOn(events, '2025-09-25')).toBe(3)
  })
})

describe('달력 격자', () => {
  it('일요일부터 시작하고 7의 배수로 채운다', () => {
    const cells = buildMonthGrid(2025, 9)
    expect(cells.length % 7).toBe(0)
    expect(new Date(cells[0].date).getDay()).toBe(0)
  })

  it('그 달의 모든 날이 들어 있다', () => {
    const cells = buildMonthGrid(2025, 9).filter((cell) => cell.inMonth)
    expect(cells).toHaveLength(30)
    expect(cells[0].date).toBe('2025-09-01')
    expect(cells[29].date).toBe('2025-09-30')
  })

  it('앞뒤 다른 달 칸은 inMonth가 false다', () => {
    const cells = buildMonthGrid(2025, 9)
    expect(cells[0].inMonth).toBe(false) // 8월 31일 (일요일)
  })

  it('윤년 2월도 맞다', () => {
    const cells = buildMonthGrid(2024, 2).filter((cell) => cell.inMonth)
    expect(cells).toHaveLength(29)
  })

  it('달 이동은 해를 넘어간다', () => {
    expect(shiftMonth(2025, 12, 1)).toEqual({ year: 2026, month: 1 })
    expect(shiftMonth(2025, 1, -1)).toEqual({ year: 2024, month: 12 })
  })
})

describe('달력 활동 집계', () => {
  const events = [
    event({ localDate: '2025-09-25', action: 'complete' }),
    event({ localDate: '2025-09-25', action: 'study_round' }),
    event({ localDate: '2025-09-25', action: 'habit_positive' }),
    event({ localDate: '2025-09-24', action: 'miss_penalty', expDelta: 0, goldDelta: 0, hpDelta: -7 }),
  ]

  it('날짜별로 종류를 나눠 센다', () => {
    const map = activityByDate(events)
    const day = map.get('2025-09-25')!
    expect(day.completions).toBe(1)
    expect(day.rounds).toBe(1)
    expect(day.habits).toBe(1)
    expect(day.active).toBe(true)
  })

  it('피해를 받은 날은 HP가 음수다', () => {
    expect(activityByDate(events).get('2025-09-24')!.hp).toBe(-7)
  })

  it('활동이 많을수록 농도가 진해진다', () => {
    const quiet = activityByDate([event({ localDate: '2025-09-01', action: 'habit_positive' })])
    const busy = activityByDate(
      Array.from({ length: 6 }, () => event({ localDate: '2025-09-02', action: 'complete' })),
    )
    expect(intensityOf(quiet.get('2025-09-01'))).toBeLessThan(
      intensityOf(busy.get('2025-09-02')),
    )
    expect(intensityOf(undefined)).toBe(0)
  })
})
