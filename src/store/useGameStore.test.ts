import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DIFFICULTY_TABLE } from '../data/gameConfig'
import { GACHA, PET_SPECIES } from '../data/petConfig'
import { findCosmetic, findItem } from '../data/shopConfig'
import { MAX_WEIGHT, WEIGHT_STEP } from '../data/workoutConfig'
import { STARTING_TOWER_KEYS } from '../data/battleConfig'
import { useBattleAnimStore } from '../features/dungeon/battleAnimStore'
import { addDays, getGameDate } from '../lib/date'

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
  useBattleAnimStore.getState().reset()
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
    // 시작 지급된 열쇠를 비워 하루 제한만 남긴다
    useGameStore.setState({ towerKeys: 0 })

    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().battle).not.toBeNull()
    expect(useGameStore.getState().dungeonDay.entriesUsed).toBe(1)

    useGameStore.getState().leaveBattle()
    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().battle).toBeNull() // 남은 횟수 없음
  })

  it('처음 시작할 때 탑의 열쇠 1개를 준다', () => {
    expect(useGameStore.getState().towerKeys).toBe(STARTING_TOWER_KEYS)
  })

  it('과제를 3개 완료하면 열쇠가 1개 쌓인다', () => {
    useGameStore.setState({ towerKeys: 0, keyProgress: 0 })

    for (const title of ['a', 'b', 'c']) {
      const task = addDaily(title)
      useGameStore.getState().completeTask(task.id)
    }

    expect(useGameStore.getState().towerKeys).toBe(1)
    expect(useGameStore.getState().keyProgress).toBe(0)
  })

  it('열쇠는 날짜가 바뀌어도 사라지지 않고 계속 쌓인다', () => {
    useGameStore.setState({ towerKeys: 0, keyProgress: 0 })
    for (let index = 0; index < 9; index += 1) {
      const task = addDaily(`t${index}`)
      useGameStore.getState().completeTask(task.id)
    }
    expect(useGameStore.getState().towerKeys).toBe(3)

    // 어제 날짜로 바꿔도 열쇠는 그대로다
    useGameStore.setState({ dungeonDay: { date: addDays(today, -1), entriesUsed: 5 } })
    expect(useGameStore.getState().towerKeys).toBe(3)
  })

  it('무료 입장을 쓴 뒤에는 열쇠로 들어간다', () => {
    useGameStore.setState({ towerKeys: 1, keyProgress: 0 })

    useGameStore.getState().enterDungeon() // 무료 입장
    expect(useGameStore.getState().dungeonDay.entriesUsed).toBe(1)
    expect(useGameStore.getState().towerKeys).toBe(1)

    useGameStore.getState().leaveBattle()
    useGameStore.getState().enterDungeon() // 열쇠 사용
    expect(useGameStore.getState().battle).not.toBeNull()
    expect(useGameStore.getState().towerKeys).toBe(0)
  })

  it('무료 입장도 열쇠도 없으면 들어갈 수 없다', () => {
    useGameStore.setState({ towerKeys: 0, keyProgress: 0 })
    useGameStore.getState().enterDungeon()
    useGameStore.getState().leaveBattle()
    useGameStore.getState().enterDungeon()
    expect(useGameStore.getState().battle).toBeNull()
  })

  it('열쇠가 많으면 하루에 몇 번이든 들어갈 수 있다', () => {
    useGameStore.setState({ towerKeys: 5, keyProgress: 0 })
    for (let index = 0; index < 6; index += 1) {
      useGameStore.getState().enterDungeon()
      expect(useGameStore.getState().battle).not.toBeNull()
      useGameStore.getState().leaveBattle()
    }
    expect(useGameStore.getState().towerKeys).toBe(0)
    expect(useGameStore.getState().dungeonDay.entriesUsed).toBe(1)
  })

  it('이미 깬 층도 다시 들어갈 수 있다', () => {
    useGameStore.setState({
      tower: { highestCleared: 5, lastFloor: 5 },
      towerKeys: 3,
    })
    for (const floor of [1, 3, 5]) {
      useGameStore.getState().enterDungeon(floor)
      expect(useGameStore.getState().battle?.floor).toBe(floor)
      useGameStore.getState().leaveBattle()
    }
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

describe('완료한 할 일 자동 정리', () => {
  it('오늘 완료한 할 일은 목록에 남는다', () => {
    useGameStore.getState().addTask({ type: 'todo', title: '보고서', difficulty: 2 })
    const task = useGameStore.getState().tasks[0]
    useGameStore.getState().completeTask(task.id)

    useGameStore.getState().archiveStaleTodos()
    expect(useGameStore.getState().tasks[0].archivedAt).toBeUndefined()
  })

  it('어제 완료한 할 일은 목록에서 내려간다', () => {
    useGameStore.getState().addTask({ type: 'todo', title: '지난 보고서', difficulty: 2 })
    const task = useGameStore.getState().tasks[0]
    useGameStore.getState().completeTask(task.id)

    // 완료 날짜를 어제로 바꿔 하루가 지난 상황을 만든다
    useGameStore.setState({
      tasks: useGameStore.getState().tasks.map((item) =>
        item.id === task.id ? { ...item, completedOn: addDays(today, -1) } : item,
      ),
    })
    useGameStore.getState().archiveStaleTodos()

    expect(useGameStore.getState().tasks[0].archivedAt).toBeDefined()
  })

  it('끝내지 않은 할 일은 며칠이 지나도 남는다', () => {
    useGameStore.getState().addTask({ type: 'todo', title: '미룬 일', difficulty: 2 })
    useGameStore.getState().archiveStaleTodos()
    expect(useGameStore.getState().tasks[0].archivedAt).toBeUndefined()
  })

  it('반복 과제는 정리 대상이 아니다', () => {
    useGameStore.getState().addTask({ type: 'daily', title: '운동', difficulty: 3, repeatDays: [] })
    const task = useGameStore.getState().tasks[0]
    useGameStore.getState().completeTask(task.id)
    useGameStore.getState().archiveStaleTodos()
    expect(useGameStore.getState().tasks[0].archivedAt).toBeUndefined()
  })

  it('정리해도 기록은 남는다', () => {
    useGameStore.getState().addTask({ type: 'todo', title: '지난 일', difficulty: 2 })
    const task = useGameStore.getState().tasks[0]
    useGameStore.getState().completeTask(task.id)
    useGameStore.setState({
      tasks: useGameStore.getState().tasks.map((item) => ({
        ...item,
        completedOn: addDays(today, -3),
      })),
    })
    useGameStore.getState().archiveStaleTodos()

    expect(useGameStore.getState().events).toHaveLength(1)
    expect(useGameStore.getState().tasks[0].title).toBe('지난 일')
  })
})

describe('공부 과목과 회독', () => {
  function addSubject(name: string, targetRounds?: number) {
    useGameStore.getState().addSubject({
      name,
      difficulty: 3,
      color: '#f59e0b',
      ...(targetRounds ? { targetRounds } : {}),
    })
    return useGameStore.getState().subjects.at(-1)!
  }

  it('과목을 추가하면 회독 0으로 시작한다', () => {
    const subject = addSubject('시스템 프로그래밍')
    expect(subject).toMatchObject({ name: '시스템 프로그래밍', rounds: 0, createdOn: today })
  })

  it('+를 누르면 회독 수가 오르고 보상을 받는다', () => {
    const subject = addSubject('자료구조')
    useGameStore.getState().addRound(subject.id)

    const state = useGameStore.getState()
    expect(state.subjects[0].rounds).toBe(1)
    expect(state.character.exp).toBeGreaterThan(0)
    expect(state.events[0]).toMatchObject({ action: 'study_round', localDate: today })
  })

  it('같은 날 반복하면 보상이 줄어든다', () => {
    const subject = addSubject('영어')
    useGameStore.getState().addRound(subject.id)
    useGameStore.getState().addRound(subject.id)

    const events = useGameStore.getState().events
    expect(events[1].expDelta).toBeLessThan(events[0].expDelta)
  })

  it('목표 회독을 채우면 보너스 Gold를 준다', () => {
    const subject = addSubject('알고리즘', 2)
    useGameStore.getState().addRound(subject.id)
    const goldAfterFirst = useGameStore.getState().character.gold
    useGameStore.getState().addRound(subject.id)

    const events = useGameStore.getState().events
    expect(events[1].goldDelta).toBeGreaterThan(events[0].goldDelta)
    expect(useGameStore.getState().character.gold).toBeGreaterThan(goldAfterFirst * 2)
  })

  it('− 버튼은 회독 수만 되돌리고 기록은 남긴다', () => {
    const subject = addSubject('통계')
    useGameStore.getState().addRound(subject.id)
    useGameStore.getState().undoRound(subject.id)

    expect(useGameStore.getState().subjects[0].rounds).toBe(0)
    expect(useGameStore.getState().events).toHaveLength(1)
  })

  it('0회독에서는 더 내려가지 않는다', () => {
    const subject = addSubject('철학')
    useGameStore.getState().undoRound(subject.id)
    expect(useGameStore.getState().subjects[0].rounds).toBe(0)
  })

  it('삭제해도 회독 기록은 남는다', () => {
    const subject = addSubject('물리')
    useGameStore.getState().addRound(subject.id)
    useGameStore.getState().archiveSubject(subject.id)

    expect(useGameStore.getState().subjects[0].archivedAt).toBeDefined()
    expect(useGameStore.getState().events).toHaveLength(1)
  })
})

describe('운동 기록', () => {
  it('종목을 추가하면 무게 0으로 시작한다', () => {
    useGameStore.getState().addExercise('chest', '벤치프레스')
    const exercise = useGameStore.getState().workout.exercises[0]
    expect(exercise).toMatchObject({ group: 'chest', name: '벤치프레스', weight: 0, best: 0 })
  })

  it('같은 부위에 같은 이름은 중복으로 안 들어간다', () => {
    useGameStore.getState().addExercise('chest', '벤치프레스')
    useGameStore.getState().addExercise('chest', '벤치프레스')
    expect(useGameStore.getState().workout.exercises).toHaveLength(1)
  })

  it('다른 부위에는 같은 이름을 쓸 수 있다', () => {
    useGameStore.getState().addExercise('chest', '프레스')
    useGameStore.getState().addExercise('shoulders', '프레스')
    expect(useGameStore.getState().workout.exercises).toHaveLength(2)
  })

  it('빈 이름은 무시한다', () => {
    useGameStore.getState().addExercise('back', '   ')
    expect(useGameStore.getState().workout.exercises).toHaveLength(0)
  })

  it('+ 는 5kg씩 올리고 최고 기록을 갱신한다', () => {
    useGameStore.getState().addExercise('legs', '스쿼트', 60)
    const id = useGameStore.getState().workout.exercises[0].id

    useGameStore.getState().adjustExerciseWeight(id, WEIGHT_STEP)
    const exercise = useGameStore.getState().workout.exercises[0]
    expect(exercise.weight).toBe(65)
    expect(exercise.best).toBe(65)
  })

  it('− 로 내려도 최고 기록은 남는다', () => {
    useGameStore.getState().addExercise('legs', '스쿼트', 100)
    const id = useGameStore.getState().workout.exercises[0].id

    useGameStore.getState().adjustExerciseWeight(id, -WEIGHT_STEP * 2)
    const exercise = useGameStore.getState().workout.exercises[0]
    expect(exercise.weight).toBe(90)
    expect(exercise.best).toBe(100)
  })

  it('무게는 0 아래로 내려가지 않는다', () => {
    useGameStore.getState().addExercise('back', '풀업', 5)
    const id = useGameStore.getState().workout.exercises[0].id
    useGameStore.getState().adjustExerciseWeight(id, -WEIGHT_STEP * 3)
    expect(useGameStore.getState().workout.exercises[0].weight).toBe(0)
  })

  it('상한을 넘지 않는다', () => {
    useGameStore.getState().addExercise('back', '데드리프트', MAX_WEIGHT)
    const id = useGameStore.getState().workout.exercises[0].id
    useGameStore.getState().adjustExerciseWeight(id, 100)
    expect(useGameStore.getState().workout.exercises[0].weight).toBe(MAX_WEIGHT)
  })

  it('종목을 지울 수 있다', () => {
    useGameStore.getState().addExercise('chest', '딥스')
    const id = useGameStore.getState().workout.exercises[0].id
    useGameStore.getState().removeExercise(id)
    expect(useGameStore.getState().workout.exercises).toHaveLength(0)
  })

  it('3대 기록도 5kg씩 오르내리고 최고치를 기억한다', () => {
    useGameStore.getState().adjustBigThree('bench', WEIGHT_STEP * 4)
    expect(useGameStore.getState().workout.bigThree.bench).toBe(20)

    useGameStore.getState().adjustBigThree('bench', -WEIGHT_STEP)
    const workout = useGameStore.getState().workout
    expect(workout.bigThree.bench).toBe(15)
    expect(workout.bigThreeBest.bench).toBe(20)
  })

  it('3대 무게를 직접 입력할 수 있다', () => {
    useGameStore.getState().setBigThree('deadlift', 140)
    expect(useGameStore.getState().workout.bigThree.deadlift).toBe(140)
    expect(useGameStore.getState().workout.bigThreeBest.deadlift).toBe(140)
  })

  it('이상한 값은 0으로 처리한다', () => {
    useGameStore.getState().setBigThree('squat', Number.NaN)
    expect(useGameStore.getState().workout.bigThree.squat).toBe(0)
  })

  it('운동 기록도 백업에 들어간다', () => {
    useGameStore.getState().addExercise('chest', '벤치프레스', 80)
    useGameStore.getState().setBigThree('bench', 80)
    const saved = useGameStore.getState().exportSave()
    expect(saved.workout.exercises).toHaveLength(1)
    expect(saved.workout.bigThree.bench).toBe(80)
  })
})

describe('할 일을 과목에 연결', () => {
  function setup() {
    useGameStore.getState().addSubject({ name: '자료구조', difficulty: 3, color: '#f59e0b' })
    useGameStore.getState().addTask({ type: 'todo', title: '3장 문제 풀기', difficulty: 2 })
    const subject = useGameStore.getState().subjects[0]
    const task = useGameStore.getState().tasks[0]
    return { subject, task }
  }

  it('할 일을 과목에 붙인다', () => {
    const { subject, task } = setup()
    useGameStore.getState().assignTaskToSubject(task.id, subject.id)
    expect(useGameStore.getState().tasks[0].subjectId).toBe(subject.id)
  })

  it('연결을 해제할 수 있다', () => {
    const { subject, task } = setup()
    useGameStore.getState().assignTaskToSubject(task.id, subject.id)
    useGameStore.getState().assignTaskToSubject(task.id, null)
    expect(useGameStore.getState().tasks[0].subjectId).toBeUndefined()
  })

  it('없는 과목에는 붙지 않는다', () => {
    const { task } = setup()
    useGameStore.getState().assignTaskToSubject(task.id, '없는-과목')
    expect(useGameStore.getState().tasks[0].subjectId).toBeUndefined()
  })

  it('연결된 할 일도 평소처럼 완료된다', () => {
    const { subject, task } = setup()
    useGameStore.getState().assignTaskToSubject(task.id, subject.id)
    useGameStore.getState().completeTask(task.id)

    const state = useGameStore.getState()
    expect(state.tasks[0].type === 'todo' && state.tasks[0].completedOn).toBe(today)
    expect(state.tasks[0].subjectId).toBe(subject.id)
    expect(state.character.gold).toBeGreaterThan(0)
  })
})

describe('탑과 상점', () => {
  /** 전투 능력치는 입장 시점에 정해지므로 레벨은 입장 전에 올려둬야 한다 */
  function levelUpTo(level: number) {
    useGameStore.setState({ character: { ...useGameStore.getState().character, level } })
  }

  function winCurrentBattle() {
    for (let i = 0; i < 100; i += 1) {
      const battle = useGameStore.getState().battle
      if (!battle || battle.status !== 'active') return
      useGameStore.getState().battleAction('attack')
      // 화면이 없는 테스트에서는 연출이 끝난 것으로 친다
      useBattleAnimStore.getState().reset()
    }
  }

  it('처음에는 1층만 도전할 수 있다', () => {
    useGameStore.getState().enterDungeon(2)
    expect(useGameStore.getState().battle).toBeNull()

    useGameStore.getState().enterDungeon(1)
    expect(useGameStore.getState().battle?.floor).toBe(1)
  })

  it('이기면 다음 층이 열린다', () => {
    levelUpTo(60)
    useGameStore.getState().enterDungeon(1)
    winCurrentBattle()
    expect(useGameStore.getState().tower.highestCleared).toBe(1)
    expect(useGameStore.getState().battle?.status).toBe('won')
  })

  it('보스 층은 첫 격파 보너스를 한 번만 준다', () => {
    useGameStore.setState({
      tower: { highestCleared: 9, lastFloor: 9 },
      character: { ...useGameStore.getState().character, level: 60, gold: 0 },
      towerKeys: 5,
    })
    useGameStore.getState().enterDungeon(10)
    expect(useGameStore.getState().battle?.monsterDef.isBoss).toBe(true)
    winCurrentBattle()

    const firstRun = useGameStore.getState()
    expect(firstRun.battle?.rewards?.firstClearBonus).toBeGreaterThan(0)
    const goldAfterFirst = firstRun.character.gold

    // 같은 보스를 다시 잡으면 보너스가 없다
    useGameStore.getState().leaveBattle()
    useGameStore.getState().enterDungeon(10)
    winCurrentBattle()
    expect(useGameStore.getState().battle?.rewards?.firstClearBonus).toBeUndefined()
    expect(useGameStore.getState().character.gold).toBeGreaterThan(goldAfterFirst)
  })

  it('탑의 열쇠는 하루 제한을 넘어 입장하게 해준다', () => {
    useGameStore.getState().enterDungeon(1) // 기본 1회 소진
    useGameStore.getState().leaveBattle()
    useGameStore.setState({ towerKeys: 1 })

    useGameStore.getState().enterDungeon(1)
    expect(useGameStore.getState().battle).not.toBeNull()
    expect(useGameStore.getState().towerKeys).toBe(0)
  })

  it('상점에서 아이템을 사면 Gold가 줄고 인벤토리에 들어온다', () => {
    const item = findItem('small_potion')!
    useGameStore.setState({
      character: { ...useGameStore.getState().character, gold: item.price },
    })
    useGameStore.getState().buyShopItem('small_potion')
    expect(useGameStore.getState().inventory.small_potion).toBe(1)
    expect(useGameStore.getState().character.gold).toBe(0)
  })

  it('Gold가 모자라면 살 수 없다', () => {
    useGameStore.setState({ character: { ...useGameStore.getState().character, gold: 0 } })
    useGameStore.getState().buyShopItem('large_potion')
    expect(useGameStore.getState().inventory.large_potion ?? 0).toBe(0)
  })

  it('탑의 열쇠와 뽑기권은 각자의 칸으로 들어간다', () => {
    useGameStore.setState({
      character: { ...useGameStore.getState().character, gold: 10000 },
      towerKeys: 0,
    })
    useGameStore.getState().buyShopItem('tower_key')
    useGameStore.getState().buyShopItem('gacha_ticket')
    expect(useGameStore.getState().towerKeys).toBe(1)
    expect(useGameStore.getState().petTickets).toBe(GACHA.startingTickets + 1)
  })

  it('전투 중 물약을 쓰면 HP가 차고 개수가 줄어든다', () => {
    useGameStore.setState({
      character: { ...useGameStore.getState().character, gold: 10000 },
    })
    useGameStore.getState().buyShopItem('large_potion')
    useGameStore.getState().enterDungeon(1)

    const battle = useGameStore.getState().battle!
    useGameStore.setState({ battle: { ...battle, player: { ...battle.player, hp: 5 } } })

    useGameStore.getState().useBattleItem('large_potion')
    expect(useGameStore.getState().battle!.player.hp).toBeGreaterThan(5)
    expect(useGameStore.getState().inventory.large_potion).toBe(0)
  })

  it('연출이 재생되는 동안 들어온 입력은 무시한다', () => {
    // 한 방에 끝나지 않도록 낮은 레벨로 도전한다
    useGameStore.getState().enterDungeon(1)
    useGameStore.getState().battleAction('attack')

    const afterFirst = useGameStore.getState().battle!
    expect(useBattleAnimStore.getState().playing).toBe(true)

    // 연출 중 연타
    useGameStore.getState().battleAction('attack')
    useGameStore.getState().battleAction('skill')
    expect(useGameStore.getState().battle!.turn).toBe(afterFirst.turn)
    expect(useGameStore.getState().battle!.monster.hp).toBe(afterFirst.monster.hp)

    // 연출이 끝나면 다시 받는다
    useBattleAnimStore.getState().reset()
    useGameStore.getState().battleAction('attack')
    expect(useGameStore.getState().battle!.monster.hp).toBeLessThan(afterFirst.monster.hp)
  })

  it('연출 단계가 순서대로 만들어진다', () => {
    levelUpTo(5)
    useGameStore.getState().enterDungeon(1)
    useGameStore.getState().battleAction('attack')

    const anim = useBattleAnimStore.getState()
    const steps = [anim.current, ...anim.queue].filter(Boolean)
    expect(steps[0]?.kind).toBe('player_attack')
    // 플레이어 행동 다음에는 몬스터 차례가 온다
    expect(steps.slice(1).some((step) => step?.kind.startsWith('monster'))).toBe(true)
  })

  it('전투를 나가면 남은 연출도 정리된다', () => {
    levelUpTo(60)
    useGameStore.getState().enterDungeon(1)
    useGameStore.getState().battleAction('attack')
    useGameStore.getState().leaveBattle()

    expect(useBattleAnimStore.getState().playing).toBe(false)
    expect(useBattleAnimStore.getState().current).toBeNull()
  })

  it('없는 아이템은 쓸 수 없다', () => {
    useGameStore.getState().enterDungeon(1)
    const before = useGameStore.getState().battle!.turn
    useGameStore.getState().useBattleItem('small_potion')
    expect(useGameStore.getState().battle!.turn).toBe(before)
  })

  it('꾸미기를 사면 바로 착용되고 Gold가 줄어든다', () => {
    const cosmetic = findCosmetic('crown')!
    useGameStore.setState({
      character: { ...useGameStore.getState().character, gold: cosmetic.price },
    })
    useGameStore.getState().buyCosmetic('crown')
    expect(useGameStore.getState().ownedCosmetics).toContain('crown')
    expect(useGameStore.getState().cosmetics.hat).toBe('crown')
    expect(useGameStore.getState().character.gold).toBe(0)
  })

  it('가지지 않은 꾸미기는 장착할 수 없다', () => {
    useGameStore.getState().equipCosmetic('hat', 'crown')
    expect(useGameStore.getState().cosmetics.hat).toBeNull()
  })

  it('같은 꾸미기를 두 번 사지 않는다', () => {
    useGameStore.setState({ character: { ...useGameStore.getState().character, gold: 10000 } })
    useGameStore.getState().buyCosmetic('ribbon')
    const goldAfter = useGameStore.getState().character.gold
    useGameStore.getState().buyCosmetic('ribbon')
    expect(useGameStore.getState().character.gold).toBe(goldAfter)
    expect(useGameStore.getState().ownedCosmetics.filter((id) => id === 'ribbon')).toHaveLength(1)
  })
})

describe('펫 뽑기와 동행 효과', () => {
  it('처음에 뽑기권 5장을 준다', () => {
    expect(useGameStore.getState().petTickets).toBe(GACHA.startingTickets)
  })

  it('뽑으면 뽑기권이 줄고 펫이 늘어난다', () => {
    const results = useGameStore.getState().drawPet(1)
    expect(results).toHaveLength(1)
    expect(useGameStore.getState().petTickets).toBe(GACHA.startingTickets - 1)
    expect(useGameStore.getState().pets.length).toBeGreaterThan(0)
  })

  it('뽑기권이 모자라면 뽑히지 않는다', () => {
    useGameStore.setState({ petTickets: 0 })
    expect(useGameStore.getState().drawPet(1)).toEqual([])
    expect(useGameStore.getState().pets).toHaveLength(0)
  })

  it('5연차는 뽑기권 5장을 쓴다', () => {
    useGameStore.getState().drawPet(5)
    expect(useGameStore.getState().petTickets).toBe(0)
  })

  it('첫 펫은 자동으로 동행이 된다', () => {
    useGameStore.getState().drawPet(1)
    const state = useGameStore.getState()
    expect(state.activePetId).toBe(state.pets[0].speciesId)
  })

  it('보유하지 않은 펫은 동행으로 지정할 수 없다', () => {
    useGameStore.getState().setActivePet('eclipse_dragon')
    expect(useGameStore.getState().activePetId).toBeNull()
  })

  it('Gold로 뽑기권을 살 수 있다', () => {
    useGameStore.setState({
      character: { ...useGameStore.getState().character, gold: GACHA.ticketGoldCost },
      petTickets: 0,
    })
    useGameStore.getState().buyTicket(1)
    expect(useGameStore.getState().petTickets).toBe(1)
    expect(useGameStore.getState().character.gold).toBe(0)
  })

  it('Gold가 모자라면 뽑기권을 살 수 없다', () => {
    useGameStore.setState({
      character: { ...useGameStore.getState().character, gold: 0 },
      petTickets: 0,
    })
    useGameStore.getState().buyTicket(1)
    expect(useGameStore.getState().petTickets).toBe(0)
  })

  it('EXP 펫을 동행하면 과제 보상이 늘어난다', () => {
    useGameStore.getState().addTask({ type: 'daily', title: '공부', difficulty: 3, repeatDays: [] })
    const task = useGameStore.getState().tasks[0]

    // 동행 없이 완료
    useGameStore.getState().completeTask(task.id)
    const plain = useGameStore.getState().events[0].expDelta

    // S등급 EXP 펫을 강제로 보유·동행시킨 뒤 다시 완료
    const expPet = PET_SPECIES.find((s) => s.effect === 'exp' && s.grade === 'S')!
    useGameStore.setState({
      pets: [{ id: 'p1', speciesId: expPet.id, hatchedOn: today }],
      activePetId: expPet.id,
      events: [],
    })
    useGameStore.getState().completeTask(task.id)
    const boosted = useGameStore.getState().events[0].expDelta

    expect(boosted).toBeGreaterThan(plain)
  })

  it('전투 펫을 동행하면 던전 전투 능력치가 오른다', () => {
    useGameStore.getState().enterDungeon()
    const plainHp = useGameStore.getState().battle!.player.maxHp

    // S등급에는 HP 펫이 없으므로 A등급 중 가장 강한 HP 펫을 쓴다
    const hpPet = PET_SPECIES.find((s) => s.effect === 'hp' && s.grade === 'A')!
    useGameStore.setState({
      pets: [{ id: 'p1', speciesId: hpPet.id, hatchedOn: today }],
      activePetId: hpPet.id,
      battle: null,
      dungeonDay: { date: today, entriesUsed: 0 },
    })
    useGameStore.getState().enterDungeon()

    expect(useGameStore.getState().battle!.player.maxHp).toBeGreaterThan(plainHp)
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
