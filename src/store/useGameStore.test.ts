import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DIFFICULTY_TABLE } from '../data/gameConfig'
import { getGameDate } from '../lib/date'

// persist 미들웨어는 window.localStorage를 쓴다. node 환경이라 둘 다 대체한다.
const memory = new Map<string, string>()
const storageStub = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
}
vi.stubGlobal('localStorage', storageStub)
vi.stubGlobal('window', { localStorage: storageStub })

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

describe('던전', () => {
  function addDaily(title: string) {
    useGameStore.getState().addTask({ type: 'daily', title, difficulty: 1, repeatDays: [] })
    return useGameStore.getState().tasks.at(-1)!
  }

  /** 전투가 끝날 때까지 공격만 반복한다 */
  function fightToEnd(limit = 200) {
    for (let i = 0; i < limit; i += 1) {
      const battle = useGameStore.getState().battle
      if (!battle || battle.status !== 'active') return
      useGameStore.getState().battleAction('attack')
    }
  }

  it('기본 입장 1회를 쓰면 더 들어갈 수 없다', () => {
    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().battle).not.toBeNull()
    expect(useGameStore.getState().dungeonDay.entriesUsed).toBe(1)

    useGameStore.getState().leaveBattle()
    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().battle).toBeNull() // 남은 횟수 없음
  })

  it('과제를 3개 완료하면 입장 기회가 1회 늘어난다', () => {
    useGameStore.getState().enterDungeon()
    useGameStore.getState().leaveBattle()

    for (const title of ['a', 'b', 'c']) {
      const task = addDaily(title)
      useGameStore.getState().completeTask(task.id)
    }

    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().battle).not.toBeNull()
    expect(useGameStore.getState().dungeonDay.entriesUsed).toBe(2)
  })

  it('입장 기회가 없으면 입장 횟수가 늘지 않는다', () => {
    useGameStore.getState().enterDungeon()
    useGameStore.getState().leaveBattle()
    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().dungeonDay.entriesUsed).toBe(1)
  })

  it('전투 중에는 다시 입장해도 전투가 새로 시작되지 않는다', () => {
    useGameStore.getState().enterDungeon()
    const battleId = useGameStore.getState().battle?.id
    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().battle?.id).toBe(battleId)
    expect(useGameStore.getState().dungeonDay.entriesUsed).toBe(1)
  })

  it('승리하면 Gold를 한 번만 받는다 (연타·새로고침 방지)', () => {
    // 레벨을 올려 확실히 이기게 만든다
    useGameStore.setState({
      character: { ...useGameStore.getState().character, level: 30, gold: 0 },
    })
    useGameStore.getState().enterDungeon()
    fightToEnd()

    const afterFight = useGameStore.getState()
    expect(afterFight.battle?.status).toBe('won')
    expect(afterFight.battle?.rewardGranted).toBe(true)
    const goldAfterWin = afterFight.character.gold
    expect(goldAfterWin).toBeGreaterThan(0)

    // 끝난 전투에 계속 행동을 보내도 보상이 늘지 않는다
    for (let i = 0; i < 5; i += 1) useGameStore.getState().battleAction('attack')
    expect(useGameStore.getState().character.gold).toBe(goldAfterWin)
  })

  it('패배해도 생활 HP와 과제 기록은 그대로다', () => {
    const task = addDaily('운동')
    useGameStore.getState().completeTask(task.id)
    const hpBefore = useGameStore.getState().character.hp
    const eventsBefore = useGameStore.getState().events.length

    // 전투 HP만 1로 만들어 패배를 유도한다
    useGameStore.getState().enterDungeon()
    const battle = useGameStore.getState().battle!
    useGameStore.setState({ battle: { ...battle, player: { ...battle.player, hp: 1 } } })
    useGameStore.getState().battleAction('attack')

    const state = useGameStore.getState()
    expect(state.battle?.status).toBe('lost')
    expect(state.character.hp).toBe(hpBefore)
    expect(state.events).toHaveLength(eventsBefore)
    expect(state.tasks).toHaveLength(1)
  })

  it('전투 상태가 저장되어 새로고침해도 이어진다', async () => {
    useGameStore.getState().enterDungeon()
    useGameStore.getState().battleAction('attack')

    // persist 미들웨어의 저장은 다음 틱에 끝난다
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect([...memory.keys()]).toContain('life-rpg-save')
    const saved = JSON.parse(memory.get('life-rpg-save')!)
    expect(saved.state.battle.turn).toBe(2)
    expect(saved.state.battle.status).toBe('active')
    expect(saved.state.dungeonDay.entriesUsed).toBe(1)
  })

  it('게임 날짜가 바뀌면 입장 횟수가 초기화된다', () => {
    useGameStore.getState().enterDungeon()
    useGameStore.getState().leaveBattle()
    expect(useGameStore.getState().dungeonDay.entriesUsed).toBe(1)

    // 어제 날짜로 기록을 바꾸면 오늘 기준으로 초기화되어야 한다
    useGameStore.setState({ dungeonDay: { date: '2000-01-01', entriesUsed: 3 } })
    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().battle).not.toBeNull()
    expect(useGameStore.getState().dungeonDay).toEqual({ date: today, entriesUsed: 1 })
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
