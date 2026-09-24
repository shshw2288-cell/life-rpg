import { describe, expect, it } from 'vitest'
import type { DailyTask, Task, TaskEvent } from '../types/task'
import { calcStreak, isScheduledOn, planSettlement } from './schedule'

function daily(overrides: Partial<DailyTask> & { id: string }): DailyTask {
  return {
    type: 'daily',
    title: overrides.id,
    difficulty: 3,
    repeatDays: [],
    createdOn: '2025-09-01',
    createdAt: '2025-09-01T08:00:00.000Z',
    updatedAt: '2025-09-01T08:00:00.000Z',
    ...overrides,
  }
}

function event(overrides: Partial<TaskEvent> & { taskId: string; localDate: string }): TaskEvent {
  return {
    id: `${overrides.taskId}-${overrides.localDate}`,
    action: 'complete',
    timestamp: `${overrides.localDate}T10:00:00.000Z`,
    expDelta: 0,
    goldDelta: 0,
    hpDelta: 0,
    ...overrides,
  }
}

describe('isScheduledOn', () => {
  it('요일을 지정하지 않으면 매일 예정이다', () => {
    expect(isScheduledOn(daily({ id: 'a' }), '2025-09-25')).toBe(true)
  })

  it('지정한 요일에만 예정된다', () => {
    const task = daily({ id: 'a', repeatDays: [1, 3, 5] })
    expect(isScheduledOn(task, '2025-09-25')).toBe(false) // 목요일
    expect(isScheduledOn(task, '2025-09-26')).toBe(true) // 금요일
  })

  it('생성 전 날짜는 예정에 포함하지 않는다', () => {
    const task = daily({ id: 'a', createdOn: '2025-09-25' })
    expect(isScheduledOn(task, '2025-09-24')).toBe(false)
    expect(isScheduledOn(task, '2025-09-25')).toBe(true)
  })

  it('보관된 과제는 예정에서 빠진다', () => {
    const task = daily({ id: 'a', archivedAt: '2025-09-20T00:00:00.000Z' })
    expect(isScheduledOn(task, '2025-09-25')).toBe(false)
  })
})

describe('planSettlement', () => {
  const base = { maxHp: 50, settledDates: [] as string[] }

  it('오늘은 아직 끝나지 않았으므로 정산하지 않는다', () => {
    const tasks: Task[] = [daily({ id: 'a' })]
    const plan = planSettlement({
      ...base,
      tasks,
      events: [],
      lastSettledDate: '2025-09-24',
      today: '2025-09-25',
    })
    expect(plan.days).toEqual([])
    expect(plan.totalDamage).toBe(0)
  })

  it('놓친 예정일에 난이도만큼 피해를 준다', () => {
    const tasks: Task[] = [daily({ id: 'a', difficulty: 3 })]
    const plan = planSettlement({
      ...base,
      tasks,
      events: [],
      lastSettledDate: '2025-09-22',
      today: '2025-09-25',
    })
    expect(plan.days.map((day) => day.date)).toEqual(['2025-09-23', '2025-09-24'])
    expect(plan.totalDamage).toBe(14) // 난이도 3 = 7 피해 x 2일
  })

  it('완료한 날은 피해가 없다', () => {
    const tasks: Task[] = [daily({ id: 'a' })]
    const events = [event({ taskId: 'a', localDate: '2025-09-23' })]
    const plan = planSettlement({
      ...base,
      tasks,
      events,
      lastSettledDate: '2025-09-22',
      today: '2025-09-25',
    })
    expect(plan.days.find((day) => day.date === '2025-09-23')?.damage).toBe(0)
    expect(plan.totalDamage).toBe(7)
  })

  it('이미 정산한 날짜는 다시 정산하지 않는다 (중복 방지)', () => {
    const tasks: Task[] = [daily({ id: 'a' })]
    const plan = planSettlement({
      ...base,
      settledDates: ['2025-09-23'],
      tasks,
      events: [],
      lastSettledDate: '2025-09-22',
      today: '2025-09-25',
    })
    expect(plan.days.map((day) => day.date)).toEqual(['2025-09-24'])
    expect(plan.totalDamage).toBe(7)
  })

  it('이미 피해 이벤트가 있는 과제는 건너뛴다 (2차 안전장치)', () => {
    const tasks: Task[] = [daily({ id: 'a' })]
    const events = [
      event({ taskId: 'a', localDate: '2025-09-24', action: 'miss_penalty', hpDelta: -7 }),
    ]
    const plan = planSettlement({
      ...base,
      tasks,
      events,
      lastSettledDate: '2025-09-23',
      today: '2025-09-25',
    })
    expect(plan.totalDamage).toBe(0)
  })

  it('하루 피해는 최대 HP의 30%를 넘지 않는다', () => {
    const tasks: Task[] = [
      daily({ id: 'a', difficulty: 5 }),
      daily({ id: 'b', difficulty: 5 }),
      daily({ id: 'c', difficulty: 5 }),
    ]
    const plan = planSettlement({
      ...base,
      tasks,
      events: [],
      lastSettledDate: '2025-09-23',
      today: '2025-09-25',
    })
    expect(plan.days[0].rawDamage).toBe(48)
    expect(plan.days[0].damage).toBe(15) // 50 * 0.3
  })

  it('오래 비운 기간은 최근 7일만 정산하고 나머지는 건너뛴다', () => {
    const tasks: Task[] = [daily({ id: 'a', difficulty: 1 })]
    const plan = planSettlement({
      ...base,
      tasks,
      events: [],
      lastSettledDate: '2025-09-01',
      today: '2025-09-25',
    })
    expect(plan.days).toHaveLength(7)
    expect(plan.days[0].date).toBe('2025-09-18')
    expect(plan.skippedDays).toBe(16)
  })

  it('예정 요일이 아닌 날은 피해가 없다', () => {
    const tasks: Task[] = [daily({ id: 'a', repeatDays: [0] })] // 일요일만
    const plan = planSettlement({
      ...base,
      tasks,
      events: [],
      lastSettledDate: '2025-09-23',
      today: '2025-09-25',
    })
    expect(plan.totalDamage).toBe(0)
  })
})

describe('calcStreak', () => {
  it('완료 기록이 없으면 0이다', () => {
    expect(calcStreak([], '2025-09-25')).toBe(0)
  })

  it('오늘 포함 연속 일수를 센다', () => {
    const events = [
      event({ taskId: 'a', localDate: '2025-09-23' }),
      event({ taskId: 'a', localDate: '2025-09-24' }),
      event({ taskId: 'a', localDate: '2025-09-25' }),
    ]
    expect(calcStreak(events, '2025-09-25')).toBe(3)
  })

  it('오늘 아직 안 했으면 어제까지의 연속일을 유지한다', () => {
    const events = [
      event({ taskId: 'a', localDate: '2025-09-23' }),
      event({ taskId: 'a', localDate: '2025-09-24' }),
    ]
    expect(calcStreak(events, '2025-09-25')).toBe(2)
  })

  it('하루라도 비면 끊긴다', () => {
    const events = [
      event({ taskId: 'a', localDate: '2025-09-20' }),
      event({ taskId: 'a', localDate: '2025-09-24' }),
    ]
    expect(calcStreak(events, '2025-09-25')).toBe(1)
  })
})
