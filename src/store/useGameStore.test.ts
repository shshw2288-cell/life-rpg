import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DIFFICULTY_TABLE } from '../data/gameConfig'
import { getGameDate } from '../lib/date'

// persist 미들웨어가 쓰는 localStorage를 대체한다.
const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
})

const { useGameStore } = await import('./useGameStore')

const today = getGameDate(new Date())

beforeEach(() => {
  memory.clear()
  useGameStore.getState().resetAll()
})

describe('과제 등록과 완료', () => {
  it('과제를 추가하면 목록에 들어간다', () => {
    useGameStore.getState().addTask({
      type: 'daily',
      title: '운동하기',
      difficulty: 3,
      repeatDays: [],
    })
    const tasks = useGameStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0]).toMatchObject({ title: '운동하기', createdOn: today })
  })

  it('완료하면 EXP와 Gold가 오르고 이벤트가 남는다', () => {
    const store = useGameStore.getState()
    store.addTask({ type: 'daily', title: '운동', difficulty: 3, repeatDays: [] })
    const task = useGameStore.getState().tasks[0]

    useGameStore.getState().completeTask(task.id)

    const state = useGameStore.getState()
    expect(state.character.exp).toBe(DIFFICULTY_TABLE[3].exp)
    expect(state.character.gold).toBe(DIFFICULTY_TABLE[3].gold)
    expect(state.events[0]).toMatchObject({ action: 'complete', localDate: today })
  })

  it('운동 기록 수치가 이벤트에 저장된다', () => {
    useGameStore.getState().addTask({
      type: 'daily',
      title: '달리기',
      difficulty: 2,
      repeatDays: [],
      metric: { unit: '분', target: 30 },
    })
    const task = useGameStore.getState().tasks[0]
    useGameStore.getState().completeTask(task.id, 45)

    expect(useGameStore.getState().events[0]).toMatchObject({ metricValue: 45, metricUnit: '분' })
  })

  it('할 일을 완료하면 완료 날짜가 기록된다', () => {
    useGameStore.getState().addTask({ type: 'todo', title: '보고서', difficulty: 4 })
    const task = useGameStore.getState().tasks[0]
    useGameStore.getState().completeTask(task.id)

    const updated = useGameStore.getState().tasks[0]
    expect(updated.type === 'todo' && updated.completedOn).toBe(today)
  })

  it('삭제해도 지난 기록은 남는다', () => {
    useGameStore.getState().addTask({ type: 'daily', title: '독서', difficulty: 1, repeatDays: [] })
    const task = useGameStore.getState().tasks[0]
    useGameStore.getState().completeTask(task.id)
    useGameStore.getState().archiveTask(task.id)

    const state = useGameStore.getState()
    expect(state.tasks[0].archivedAt).toBeDefined()
    expect(state.events).toHaveLength(1)
  })
})

describe('습관 기록', () => {
  it('좋은 습관을 반복하면 보상이 줄어든다', () => {
    useGameStore.getState().addTask({
      type: 'habit',
      title: '물 마시기',
      difficulty: 3,
      polarity: 'positive',
    })
    const task = useGameStore.getState().tasks[0]

    useGameStore.getState().recordHabit(task.id, 'positive')
    const firstGain = useGameStore.getState().events[0].expDelta

    useGameStore.getState().recordHabit(task.id, 'positive')
    const secondGain = useGameStore.getState().events[1].expDelta

    expect(secondGain).toBeLessThan(firstGain)
  })

  it('나쁜 습관은 HP를 깎는다', () => {
    useGameStore.getState().addTask({
      type: 'habit',
      title: '야식',
      difficulty: 4,
      polarity: 'negative',
    })
    const task = useGameStore.getState().tasks[0]
    const before = useGameStore.getState().character.hp

    useGameStore.getState().recordHabit(task.id, 'negative')

    expect(useGameStore.getState().character.hp).toBe(before - DIFFICULTY_TABLE[4].damage)
  })
})

describe('레벨업', () => {
  it('EXP가 쌓이면 레벨이 오르고 HP가 회복된다', () => {
    useGameStore.getState().addTask({
      type: 'habit',
      title: '공부',
      difficulty: 5,
      polarity: 'both',
    })
    const task = useGameStore.getState().tasks[0]

    useGameStore.getState().recordHabit(task.id, 'negative') // HP를 먼저 깎아둔다
    for (let i = 0; i < 30; i += 1) {
      useGameStore.getState().recordHabit(task.id, 'positive')
    }

    const character = useGameStore.getState().character
    expect(character.level).toBeGreaterThan(1)
    expect(character.hp).toBe(character.maxHp)
  })
})
