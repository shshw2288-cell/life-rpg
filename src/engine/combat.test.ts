import { describe, expect, it } from 'vitest'
import { ACTIONS, DUNGEON_ENTRY } from '../data/battleConfig'
import type { TaskEvent } from '../types/task'
import { calcRewards, createBattle, deriveCombatStats, takeTurn } from './combat'
import { countCompletionsOn, entryStatus, rollOverDay } from './dungeon'
import { monsterForFloor } from './tower'

const monster = monsterForFloor(1)

function battleAt(level: number) {
  return createBattle({
    id: 'b1',
    monster,
    stats: deriveCombatStats(level),
    startedOn: '2025-09-25',
  })
}

/** 항상 같은 값을 주는 난수. 0.99면 치명타가 뜨지 않는다. */
const steady = () => 0.99

describe('전투 능력치', () => {
  it('레벨이 오르면 전투 능력치도 오른다', () => {
    const low = deriveCombatStats(1)
    const high = deriveCombatStats(10)
    expect(high.maxHp).toBeGreaterThan(low.maxHp)
    expect(high.attack).toBeGreaterThan(low.attack)
    expect(high.maxMp).toBeGreaterThan(low.maxMp)
  })

  it('능력치·장비 보너스를 나중에 더할 수 있다', () => {
    const base = deriveCombatStats(5)
    const buffed = deriveCombatStats(5, { attack: 10, critChance: 0.2 })
    expect(buffed.attack).toBe(base.attack + 10)
    expect(buffed.critChance).toBeCloseTo(base.critChance + 0.2)
  })
})

describe('턴 진행', () => {
  it('공격하면 몬스터 HP가 줄고 내 HP도 줄어든다', () => {
    const start = battleAt(1)
    const { battle } = takeTurn(start, 'attack', steady)
    expect(battle.monster.hp).toBeLessThan(start.monster.hp)
    expect(battle.player.hp).toBeLessThan(start.player.hp)
    expect(battle.turn).toBe(2)
  })

  it('방어하면 받는 피해가 줄어든다', () => {
    const start = battleAt(1)
    const attacked = takeTurn(start, 'attack', steady).battle
    const defended = takeTurn(start, 'defend', steady).battle
    const attackDamage = start.player.hp - attacked.player.hp
    const defendDamage = start.player.hp - defended.player.hp
    expect(defendDamage).toBeLessThan(attackDamage)
  })

  it('방어하면 MP가 회복된다', () => {
    const start = { ...battleAt(1), player: { ...battleAt(1).player, mp: 0 } }
    const { battle } = takeTurn(start, 'defend', steady)
    expect(battle.player.mp).toBe(ACTIONS.defend.mpGain)
  })

  it('스킬은 MP를 쓰고 일반 공격보다 세다', () => {
    const start = battleAt(1)
    const attacked = takeTurn(start, 'attack', steady).battle
    const skilled = takeTurn(start, 'skill', steady).battle
    expect(start.monster.hp - skilled.monster.hp).toBeGreaterThan(
      start.monster.hp - attacked.monster.hp,
    )
    expect(skilled.player.mp).toBe(start.player.mp - ACTIONS.skill.mpCost)
  })

  it('MP가 부족하면 스킬을 쓸 수 없고 상태가 그대로다', () => {
    const base = battleAt(1)
    const start = { ...base, player: { ...base.player, mp: 0 } }
    const { battle } = takeTurn(start, 'skill', steady)
    expect(battle).toBe(start)
  })

  it('몬스터 HP가 0이 되면 승리로 끝난다', () => {
    const base = battleAt(1)
    const start = { ...base, monster: { ...base.monster, hp: 1 } }
    const { battle } = takeTurn(start, 'attack', steady)
    expect(battle.status).toBe('won')
    expect(battle.player.hp).toBe(start.player.hp) // 이긴 턴에는 반격을 받지 않는다
  })

  it('내 HP가 0이 되면 패배로 끝난다', () => {
    const base = battleAt(1)
    const start = { ...base, player: { ...base.player, hp: 1 } }
    const { battle } = takeTurn(start, 'attack', steady)
    expect(battle.status).toBe('lost')
  })

  it('끝난 전투에서는 행동해도 아무 일이 없다', () => {
    const base = battleAt(1)
    const finished = { ...base, status: 'won' as const }
    expect(takeTurn(finished, 'attack', steady).battle).toBe(finished)
  })

  it('일정 턴마다 강공격을 예고하고 더 큰 피해를 준다', () => {
    // 레벨이 높으면 예고 전에 몬스터가 죽으므로 1레벨로 확인한다
    let state = battleAt(1)
    state = takeTurn(state, 'attack', steady).battle
    const normalDamage = state.player.maxHp - state.player.hp

    state = takeTurn(state, 'attack', steady).battle // 예고 발생
    expect(state.monsterCharging).toBe(true)

    const before = state.player.hp
    state = takeTurn(state, 'attack', steady).battle
    expect(before - state.player.hp).toBeGreaterThan(normalDamage)
    expect(state.monsterCharging).toBe(false)
  })
})

describe('보상 계산', () => {
  it('확률에 걸리면 재료를 준다', () => {
    const rewards = calcRewards(monster, () => 0)
    expect(rewards.gold).toBe(monster.goldReward)
    expect(rewards.materials[monster.materialId]).toBe(1)
  })

  it('확률에 걸리지 않으면 Gold만 준다', () => {
    const rewards = calcRewards(monster, () => 0.99)
    expect(rewards.materials).toEqual({})
  })
})

describe('던전 입장 횟수', () => {
  const day = { date: '2025-09-25', entriesUsed: 0 }

  function completion(date: string): TaskEvent {
    return {
      id: `e-${Math.random()}`,
      taskId: 't1',
      action: 'complete',
      localDate: date,
      timestamp: `${date}T10:00:00.000Z`,
      expDelta: 10,
      goldDelta: 5,
      hpDelta: 0,
    }
  }

  it('기본 입장 횟수는 하루 1회다', () => {
    const status = entryStatus({ today: '2025-09-25', day, completionsToday: 0 })
    expect(status.total).toBe(DUNGEON_ENTRY.baseDaily)
    expect(status.remaining).toBe(1)
  })

  it('과제를 완료하면 입장 기회가 늘어난다', () => {
    const status = entryStatus({ today: '2025-09-25', day, completionsToday: 3 })
    expect(status.total).toBe(2)
    expect(status.earned).toBe(1)
  })

  it('하루 최대 횟수를 넘지 않는다', () => {
    const status = entryStatus({ today: '2025-09-25', day, completionsToday: 99 })
    expect(status.total).toBe(DUNGEON_ENTRY.maxDaily)
    expect(status.completionsToNext).toBe(0)
  })

  it('습관 기록은 입장 기회로 세지 않는다', () => {
    const events: TaskEvent[] = [
      completion('2025-09-25'),
      { ...completion('2025-09-25'), action: 'habit_positive' },
      { ...completion('2025-09-25'), action: 'habit_positive' },
      { ...completion('2025-09-25'), action: 'habit_positive' },
    ]
    expect(countCompletionsOn(events, '2025-09-25')).toBe(1)
  })

  it('날짜가 바뀌면 사용 횟수가 0으로 초기화된다', () => {
    const used = { date: '2025-09-24', entriesUsed: 3 }
    const status = entryStatus({ today: '2025-09-25', day: used, completionsToday: 0 })
    expect(status.used).toBe(0)
    expect(status.remaining).toBe(1)
    expect(rollOverDay(used, '2025-09-25')).toEqual({ date: '2025-09-25', entriesUsed: 0 })
  })

  it('같은 날이면 사용 횟수를 유지한다', () => {
    const used = { date: '2025-09-25', entriesUsed: 1 }
    expect(rollOverDay(used, '2025-09-25')).toBe(used)
    expect(entryStatus({ today: '2025-09-25', day: used, completionsToday: 0 }).remaining).toBe(0)
  })
})
