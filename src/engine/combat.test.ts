import { describe, expect, it } from 'vitest'
import { ACTIONS, DUNGEON_ENTRY } from '../data/battleConfig'
import { findSkill } from '../data/skillConfig'
import type { BattleState } from '../types/battle'
import type { TaskEvent } from '../types/task'
import { calcRewards, createBattle, deriveCombatStats, takeTurn } from './combat'
import { addKeyProgress, countCompletionsOn, entryStatus, rollOverDay } from './dungeon'
import { makeBattlePet } from './petCombat'
import { monsterForFloor } from './tower'

const monster = monsterForFloor(1)

const ALL_SKILLS = ['starlight_arrow', 'sprout_heal', 'light_shield']

function battleAt(level: number, skills: string[] = ALL_SKILLS, petId: string | null = null) {
  return createBattle({
    id: 'b1',
    monster,
    stats: deriveCombatStats(level),
    startedOn: '2025-09-25',
    skillIds: skills,
    pet: makeBattlePet(petId),
  })
}

/** 층 몬스터를 바꿔 끼운 전투 (보스 패턴 검증용) */
function battleOn(
  floor: number,
  level: number,
  skills: string[] = ALL_SKILLS,
  petId: string | null = null,
) {
  return createBattle({
    id: `b-${floor}`,
    monster: monsterForFloor(floor),
    stats: deriveCombatStats(level),
    startedOn: '2025-09-25',
    skillIds: skills,
    pet: makeBattlePet(petId),
  })
}

const arrow = { kind: 'skill', skillId: 'starlight_arrow' } as const
const heal = { kind: 'skill', skillId: 'sprout_heal' } as const
const shieldUp = { kind: 'skill', skillId: 'light_shield' } as const
const bind = { kind: 'skill', skillId: 'vine_bind' } as const
const focus = { kind: 'skill', skillId: 'focus_mind' } as const

/** 항상 같은 값을 주는 난수. 0.99면 치명타가 뜨지 않는다. */
const steady = () => 0.99

function statusOf(list: BattleState['playerStatuses'], id: string) {
  return list.find((status) => status.id === id)
}

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

describe('기본 행동', () => {
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
    expect(start.player.hp - defended.player.hp).toBeLessThan(
      start.player.hp - attacked.player.hp,
    )
  })

  it('방어하면 MP가 회복된다', () => {
    const base = battleAt(1)
    const start = { ...base, player: { ...base.player, mp: 0 } }
    const { battle } = takeTurn(start, 'defend', steady)
    expect(battle.player.mp).toBe(ACTIONS.defend.mpGain)
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
    const finished = { ...battleAt(1), status: 'won' as const }
    expect(takeTurn(finished, 'attack', steady).battle).toBe(finished)
  })

  it('일정 턴마다 강공격을 예고하고 더 큰 피해를 준다', () => {
    // 레벨이 높으면 예고 전에 몬스터가 죽으므로 1레벨로 확인한다
    let state = battleAt(1)
    state = takeTurn(state, 'attack', steady).battle
    const normalDamage = state.player.maxHp - state.player.hp

    state = takeTurn(state, 'attack', steady).battle // 예고 발생
    expect(state.monsterCharging).toBe(true)
    expect(state.intent?.kind).toBe('heavy')

    const before = state.player.hp
    state = takeTurn(state, 'attack', steady).battle
    expect(before - state.player.hp).toBeGreaterThan(normalDamage)
    expect(state.monsterCharging).toBe(false)
  })
})

describe('스킬 장착과 사용', () => {
  it('장착한 스킬만 전투에 들어온다', () => {
    const state = battleAt(1, ['starlight_arrow', 'sprout_heal'])
    expect(state.skills.map((slot) => slot.id)).toEqual(['starlight_arrow', 'sprout_heal'])
  })

  it('장착하지 않은 스킬은 쓸 수 없다', () => {
    const start = battleAt(1, ['starlight_arrow'])
    expect(takeTurn(start, heal, steady).battle).toBe(start)
  })

  it('별빛 화살은 MP를 쓰고 일반 공격보다 세다', () => {
    const start = battleAt(1)
    const attacked = takeTurn(start, 'attack', steady).battle
    const skilled = takeTurn(start, arrow, steady).battle
    expect(start.monster.hp - skilled.monster.hp).toBeGreaterThan(
      start.monster.hp - attacked.monster.hp,
    )
    expect(skilled.player.mp).toBe(start.player.mp - findSkill('starlight_arrow')!.mpCost)
  })

  it('MP가 부족하면 쓸 수 없고 상태가 그대로다', () => {
    const base = battleAt(1)
    const start = { ...base, player: { ...base.player, mp: 0 } }
    expect(takeTurn(start, arrow, steady).battle).toBe(start)
  })

  it('새싹 회복은 HP를 채우고 대기시간·사용 횟수가 줄어든다', () => {
    const base = battleAt(1)
    const start = { ...base, player: { ...base.player, hp: 10 } }
    const { battle } = takeTurn(start, heal, steady)

    expect(battle.player.hp).toBeGreaterThan(10 - 1) // 회복 후 반격을 맞아도 늘어 있다
    const slot = battle.skills.find((entry) => entry.id === 'sprout_heal')!
    expect(slot.usesLeft).toBe(findSkill('sprout_heal')!.maxUses! - 1)
    // 이번 라운드 끝에 1 줄었으므로 cooldown - 1
    expect(slot.cooldown).toBe(findSkill('sprout_heal')!.cooldown - 1)
  })

  it('무한 회복이 되지 않는다 — 전투당 사용 횟수가 소진된다', () => {
    let state: BattleState = {
      ...battleAt(1),
      // 회복만 반복할 수 있도록 MP와 HP를 넉넉히 둔다
      player: { hp: 200, maxHp: 400, mp: 999, maxMp: 999 },
      playerStats: { ...battleAt(1).playerStats, maxHp: 400, defense: 999 },
    }
    const maxUses = findSkill('sprout_heal')!.maxUses!

    let used = 0
    for (let round = 0; round < 40 && state.status === 'active'; round += 1) {
      const before = state.skills.find((entry) => entry.id === 'sprout_heal')!.usesLeft
      const next = takeTurn(state, heal, steady).battle
      if (next === state) {
        // 대기시간이면 한 턴 흘려보낸다
        state = takeTurn(state, 'defend', steady).battle
        continue
      }
      if (next.skills.find((entry) => entry.id === 'sprout_heal')!.usesLeft! < (before ?? 0)) {
        used += 1
      }
      state = next
    }

    expect(used).toBe(maxUses)
    expect(state.skills.find((entry) => entry.id === 'sprout_heal')!.usesLeft).toBe(0)
  })

  it('대기시간 중에는 쓸 수 없다', () => {
    const start = battleAt(1)
    const after = takeTurn(start, shieldUp, steady).battle
    expect(after.skills.find((entry) => entry.id === 'light_shield')!.cooldown).toBeGreaterThan(0)
    expect(takeTurn(after, shieldUp, steady).battle).toBe(after)
  })

  it('빛의 보호막은 정해진 턴 동안 피해를 줄인다', () => {
    const start = battleAt(1)
    const plain = takeTurn(start, 'attack', steady).battle
    const plainDamage = start.player.hp - plain.player.hp

    const shielded = takeTurn(start, shieldUp, steady).battle
    expect(statusOf(shielded.playerStatuses, 'shield')).toBeDefined()
    const shieldedDamage = start.player.hp - shielded.player.hp
    expect(shieldedDamage).toBeLessThan(plainDamage)

    // 지속시간이 끝나면 사라진다
    const later = takeTurn(shielded, 'attack', steady).battle
    expect(statusOf(later.playerStatuses, 'shield')).toBeUndefined()
  })

  it('집중은 다음 공격을 강하게 하고 쓰면 사라진다', () => {
    const start = battleAt(1, ['focus_mind', 'starlight_arrow'])
    const plain = takeTurn(start, arrow, steady).battle
    const plainDamage = start.monster.hp - plain.monster.hp

    const focused = takeTurn(start, focus, steady).battle
    expect(statusOf(focused.playerStatuses, 'focus')).toBeDefined()

    const burst = takeTurn(focused, arrow, steady).battle
    expect(focused.monster.hp - burst.monster.hp).toBeGreaterThan(plainDamage)
    expect(statusOf(burst.playerStatuses, 'focus')).toBeUndefined()
  })

  it('덩굴 묶기는 적의 다음 공격을 약하게 한다', () => {
    const start = battleAt(1, ['vine_bind', 'starlight_arrow'])
    const plain = takeTurn(start, arrow, steady).battle
    const plainDamage = start.player.hp - plain.player.hp

    const bound = takeTurn(start, bind, steady).battle
    expect(start.player.hp - bound.player.hp).toBeLessThan(plainDamage)
    // 적이 한 번 공격하면 묶임은 풀린다 (영구 봉쇄 불가)
    expect(statusOf(bound.monsterStatuses, 'weaken')).toBeUndefined()
  })
})

describe('보스 패턴', () => {
  it('행동을 고르기 전에 다음 의도를 알려준다', () => {
    const state = battleOn(10, 1)
    expect(state.intent).not.toBeNull()
    expect(state.intent?.intent.length).toBeGreaterThan(0)
  })

  it('시작의 숲 보스는 예고 → 강공격 → 빈틈 순으로 움직인다', () => {
    let state = battleOn(10, 1)
    const kinds: string[] = []
    for (let round = 0; round < 4; round += 1) {
      kinds.push(state.intent!.kind)
      state = takeTurn(state, 'defend', steady).battle
    }
    expect(kinds).toEqual(['attack', 'charge', 'heavy', 'rest'])
    // 빈틈 턴을 지나면 약점이 노출된다
    expect(statusOf(state.monsterStatuses, 'vulnerable')).toBeDefined()
  })

  it('약점이 노출되면 같은 공격이 더 아프다', () => {
    const base = battleOn(10, 40)
    const exposed = {
      ...base,
      monsterStatuses: [{ id: 'vulnerable' as const, turns: 2, value: 0.6 }],
    }
    const plain = takeTurn(base, 'attack', steady).battle
    const boosted = takeTurn(exposed, 'attack', steady).battle
    expect(base.monster.hp - boosted.monster.hp).toBeGreaterThan(
      base.monster.hp - plain.monster.hp,
    )
  })

  it('버섯 동굴 보스의 회복은 덩굴 묶기로 저지된다', () => {
    // 회복 준비 다음 턴이 회복이다 (patternIndex 2 = 재생 준비)
    const base = battleOn(20, 1, ['vine_bind'])
    const beforeHeal = {
      ...base,
      patternIndex: 3, // 다음 행동이 '재생'
      monster: { ...base.monster, hp: Math.round(base.monster.maxHp * 0.4) },
    }

    // 묶지 않으면 회복한다
    const healed = takeTurn(beforeHeal, 'defend', steady).battle
    expect(healed.monster.hp).toBeGreaterThan(beforeHeal.monster.hp)

    // 묶으면 회복하지 못한다
    const blocked = takeTurn(beforeHeal, bind, steady).battle
    expect(blocked.monster.hp).toBeLessThanOrEqual(beforeHeal.monster.hp)
  })

  it('버섯 동굴 보스의 회복은 큰 피해로도 저지된다', () => {
    const base = battleOn(20, 80, ['starlight_arrow'])
    const beforeHeal = {
      ...base,
      patternIndex: 3,
      monster: { ...base.monster, hp: base.monster.maxHp },
    }
    const blocked = takeTurn(beforeHeal, arrow, steady).battle
    // 회복했다면 피해를 준 만큼 다시 찼을 것이다
    expect(blocked.monster.hp).toBeLessThan(beforeHeal.monster.hp)
  })

  it('별빛 유적 보스는 보호막 단계에서 피해를 덜 받는다', () => {
    const base = battleOn(40, 40)
    const warded = { ...base, monsterStatuses: [{ id: 'guard' as const, turns: 2, value: 0.6 }] }
    const plain = takeTurn(base, 'attack', steady).battle
    const blocked = takeTurn(warded, 'attack', steady).battle
    expect(base.monster.hp - blocked.monster.hp).toBeLessThan(base.monster.hp - plain.monster.hp)
  })

  it('보스가 아닌 층에는 패턴이 없다', () => {
    expect(monsterForFloor(3).pattern).toBeUndefined()
    expect(monsterForFloor(30).pattern).toBeDefined()
  })
})

describe('중독', () => {
  it('중독은 라운드마다 피해를 주고 턴이 지나면 사라진다', () => {
    const base = battleAt(1)
    const poisoned: BattleState = {
      ...base,
      playerStats: { ...base.playerStats, defense: 9999 }, // 몬스터 피해를 지워 중독만 본다
      playerStatuses: [{ id: 'poison', turns: 1, value: 0.1 }],
    }
    const after = takeTurn(poisoned, 'defend', steady).battle
    expect(after.player.hp).toBeLessThan(poisoned.player.hp)
    expect(statusOf(after.playerStatuses, 'poison')).toBeUndefined()
  })
})

describe('펫의 전투 역할', () => {
  it('공격형 펫은 공격 뒤에 따라 들어간다', () => {
    const withPet = battleAt(1, ALL_SKILLS, 'twiggy') // 공격형
    const alone = battleAt(1)
    const a = takeTurn(withPet, 'attack', steady).battle
    const b = takeTurn(alone, 'attack', steady).battle
    expect(withPet.monster.hp - a.monster.hp).toBeGreaterThan(alone.monster.hp - b.monster.hp)
    expect(a.pet!.usesLeft).toBe(withPet.pet!.usesLeft - 1)
  })

  it('공격형 펫은 대기시간이 지나야 다시 발동한다', () => {
    let state = battleAt(1, ALL_SKILLS, 'twiggy')
    const total = state.pet!.usesLeft
    state = takeTurn(state, 'attack', steady).battle
    expect(state.pet!.cooldown).toBeGreaterThan(0)
    const afterFirst = state.pet!.usesLeft
    state = takeTurn(state, 'attack', steady).battle
    expect(state.pet!.usesLeft).toBe(afterFirst) // 대기 중이라 발동하지 않았다
    expect(afterFirst).toBe(total - 1)
  })

  it('펫의 추가 타격이 다시 펫을 발동시키지 않는다', () => {
    const state = battleAt(1, ALL_SKILLS, 'twiggy')
    const after = takeTurn(state, 'attack', steady).battle
    // 한 라운드에 한 번만 줄어든다
    expect(after.pet!.usesLeft).toBe(state.pet!.usesLeft - 1)
  })

  it('적이 쓰러진 뒤에는 펫이 따라 들어가지 않는다', () => {
    const base = battleAt(1, ALL_SKILLS, 'twiggy')
    const start = { ...base, monster: { ...base.monster, hp: 1 } }
    const after = takeTurn(start, 'attack', steady).battle
    expect(after.status).toBe('won')
    expect(after.pet!.usesLeft).toBe(base.pet!.usesLeft)
  })

  it('회복형 펫은 정해진 턴마다 회복시킨다', () => {
    let state = battleAt(1, ALL_SKILLS, 'tide') // 회복형
    state = { ...state, player: { ...state.player, hp: 5, maxHp: 400 }, playerStats: { ...state.playerStats, defense: 9999 } }
    const usesBefore = state.pet!.usesLeft

    const interval = state.pet!.interval
    for (let round = 0; round < interval; round += 1) {
      state = takeTurn(state, 'defend', steady).battle
    }
    expect(state.pet!.usesLeft).toBe(usesBefore - 1)
    expect(state.player.hp).toBeGreaterThan(5)
  })

  it('방어형 펫은 위험한 한 방을 한 번만 줄여준다', () => {
    // 최대 HP의 22%를 넘는 큰 피해가 들어와야 발동한다 (12층 몬스터 vs 1레벨)
    const guarded = battleOn(12, 1, ALL_SKILLS, 'pebble')
    expect(guarded.pet!.role).toBe('guard')
    const alone = battleOn(12, 1)

    const a = takeTurn(guarded, 'attack', steady).battle
    const b = takeTurn(alone, 'attack', steady).battle
    expect(guarded.player.hp - a.player.hp).toBeLessThan(alone.player.hp - b.player.hp)
    expect(a.pet!.usesLeft).toBe(0)

    // 두 번째 큰 공격은 막아주지 않는다 (전투당 1회)
    const c = takeTurn(a, 'attack', steady).battle
    expect(c.pet!.usesLeft).toBe(0)
  })

  it('지원형 펫은 중독을 풀어준다', () => {
    const base = battleAt(1, ALL_SKILLS, 'dewdrop') // 지원형
    expect(base.pet!.role).toBe('support')
    const poisoned = { ...base, playerStatuses: [{ id: 'poison' as const, turns: 3, value: 0.05 }] }
    const after = takeTurn(poisoned, 'defend', steady).battle
    expect(statusOf(after.playerStatuses, 'poison')).toBeUndefined()
    expect(after.pet!.cleanseLeft).toBe(0)
  })

  it('펫이 없어도 전투는 정상 진행된다', () => {
    const state = battleAt(1, ALL_SKILLS, null)
    expect(state.pet).toBeNull()
    expect(takeTurn(state, 'attack', steady).battle.turn).toBe(2)
  })

  it('전투를 새로 만들면 펫의 횟수와 대기시간이 초기화된다', () => {
    const first = battleAt(1, ALL_SKILLS, 'twiggy')
    const used = takeTurn(first, 'attack', steady).battle
    expect(used.pet!.usesLeft).toBeLessThan(first.pet!.usesLeft)

    const second = battleAt(1, ALL_SKILLS, 'twiggy')
    expect(second.pet!.usesLeft).toBe(first.pet!.usesLeft)
    expect(second.pet!.cooldown).toBe(0)
  })

  it('전투를 새로 만들면 스킬 대기시간도 초기화된다', () => {
    const first = takeTurn(battleAt(1), shieldUp, steady).battle
    expect(first.skills.find((slot) => slot.id === 'light_shield')!.cooldown).toBeGreaterThan(0)
    const second = battleAt(1)
    expect(second.skills.every((slot) => slot.cooldown === 0)).toBe(true)
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

  it('무료 입장은 하루 1회다', () => {
    const status = entryStatus({ today: '2025-09-25', day, towerKeys: 0, keyProgress: 0 })
    expect(status.freeLeft).toBe(DUNGEON_ENTRY.baseDaily)
    expect(status.remaining).toBe(1)
  })

  it('열쇠를 가지고 있으면 그만큼 더 들어갈 수 있다', () => {
    const status = entryStatus({ today: '2025-09-25', day, towerKeys: 5, keyProgress: 0 })
    expect(status.remaining).toBe(6)
  })

  it('하루 입장 횟수에 상한이 없다', () => {
    const used = { date: '2025-09-25', entriesUsed: 12 }
    const status = entryStatus({ today: '2025-09-25', day: used, towerKeys: 40, keyProgress: 0 })
    expect(status.freeLeft).toBe(0)
    expect(status.remaining).toBe(40)
  })

  it('과제를 완료하면 열쇠가 쌓인다', () => {
    let keys = { keyProgress: 0, towerKeys: 0, earned: 0 }
    for (let i = 0; i < DUNGEON_ENTRY.completionsPerKey; i += 1) {
      keys = addKeyProgress(keys.keyProgress, keys.towerKeys)
    }
    expect(keys.towerKeys).toBe(1)
    expect(keys.keyProgress).toBe(0)
  })

  it('열쇠는 계속 쌓인다 (상한 없음)', () => {
    let keys = { keyProgress: 0, towerKeys: 0, earned: 0 }
    for (let i = 0; i < DUNGEON_ENTRY.completionsPerKey * 7; i += 1) {
      keys = addKeyProgress(keys.keyProgress, keys.towerKeys)
    }
    expect(keys.towerKeys).toBe(7)
  })

  it('다음 열쇠까지 남은 개수를 알려준다', () => {
    const status = entryStatus({ today: '2025-09-25', day, towerKeys: 0, keyProgress: 1 })
    expect(status.completionsToNextKey).toBe(DUNGEON_ENTRY.completionsPerKey - 1)
  })

  it('습관 기록은 열쇠 적립으로 세지 않는다', () => {
    const events: TaskEvent[] = [
      completion('2025-09-25'),
      { ...completion('2025-09-25'), action: 'habit_positive' },
      { ...completion('2025-09-25'), action: 'habit_positive' },
      { ...completion('2025-09-25'), action: 'habit_positive' },
    ]
    expect(countCompletionsOn(events, '2025-09-25')).toBe(1)
  })

  it('날짜가 바뀌면 무료 입장이 다시 찬다', () => {
    const used = { date: '2025-09-24', entriesUsed: 3 }
    const status = entryStatus({ today: '2025-09-25', day: used, towerKeys: 0, keyProgress: 0 })
    expect(status.freeLeft).toBe(1)
    expect(rollOverDay(used, '2025-09-25')).toEqual({ date: '2025-09-25', entriesUsed: 0 })
  })

  it('같은 날 무료 입장을 쓰면 열쇠가 필요하다', () => {
    const used = { date: '2025-09-25', entriesUsed: 1 }
    expect(rollOverDay(used, '2025-09-25')).toBe(used)
    const status = entryStatus({ today: '2025-09-25', day: used, towerKeys: 0, keyProgress: 0 })
    expect(status.remaining).toBe(0)
  })
})
