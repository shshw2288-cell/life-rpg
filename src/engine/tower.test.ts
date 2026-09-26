import { describe, expect, it } from 'vitest'
import { BOSS_INTERVAL, BOSS_TEMPLATES } from '../data/towerConfig'
import { COSMETICS, SHOP_ITEMS, findCosmetic, findItem } from '../data/shopConfig'
import { calcRewards, createBattle, deriveCombatStats, takeTurn, useItemTurn } from './combat'
import { canChallenge, firstClearBonus, isBossFloor, monsterForFloor, nextBossFloor } from './tower'

const steady = () => 0.99

describe('탑 층 구성', () => {
  it('10층마다 보스가 나온다', () => {
    expect(isBossFloor(10)).toBe(true)
    expect(isBossFloor(20)).toBe(true)
    expect(isBossFloor(9)).toBe(false)
    expect(isBossFloor(11)).toBe(false)
  })

  it('층이 올라갈수록 몬스터가 강해진다', () => {
    const low = monsterForFloor(1)
    const mid = monsterForFloor(5)
    const high = monsterForFloor(9)
    expect(mid.hp).toBeGreaterThan(low.hp)
    expect(high.hp).toBeGreaterThan(mid.hp)
    expect(high.attack).toBeGreaterThan(low.attack)
    expect(high.goldReward).toBeGreaterThan(low.goldReward)
  })

  it('보스는 같은 구간 일반 몬스터보다 훨씬 강하다', () => {
    const boss = monsterForFloor(10)
    const normal = monsterForFloor(9)
    expect(boss.isBoss).toBe(true)
    expect(boss.hp).toBeGreaterThan(normal.hp * 2)
    expect(boss.goldReward).toBeGreaterThan(normal.goldReward * 2)
    expect(boss.pattern).toBeDefined()
  })

  it('보스는 종류가 순환한다', () => {
    expect(monsterForFloor(10).name).toBe(BOSS_TEMPLATES[0].name)
    expect(monsterForFloor(20).name).toBe(BOSS_TEMPLATES[1].name)
    const cycle = BOSS_TEMPLATES.length * BOSS_INTERVAL
    expect(monsterForFloor(10 + cycle).name).toBe(BOSS_TEMPLATES[0].name)
  })

  it('같은 층은 항상 같은 몬스터가 나온다', () => {
    expect(monsterForFloor(7)).toEqual(monsterForFloor(7))
  })

  it('다음 보스 층을 알려준다', () => {
    expect(nextBossFloor(1)).toBe(10)
    expect(nextBossFloor(10)).toBe(10)
    expect(nextBossFloor(11)).toBe(20)
  })

  it('깬 층 + 1까지만 도전할 수 있다', () => {
    expect(canChallenge(1, 0)).toBe(true)
    expect(canChallenge(2, 0)).toBe(false)
    expect(canChallenge(3, 5)).toBe(true)
  })

  it('보스를 처음 깰 때만 추가 보상을 준다', () => {
    expect(firstClearBonus(10, 9)).toBeGreaterThan(0)
    expect(firstClearBonus(10, 10)).toBe(0)
    expect(firstClearBonus(9, 8)).toBe(0)
  })

  it('보스는 재료를 확정으로 준다', () => {
    const rewards = calcRewards(monsterForFloor(10), () => 0.99)
    expect(rewards.materials.lumi_shard).toBeGreaterThan(0)
  })
})

describe('보스 전투', () => {
  function bossBattle(level = 40) {
    return createBattle({
      id: 'b',
      monster: monsterForFloor(10),
      stats: deriveCombatStats(level),
      startedOn: '2025-09-25',
    })
  }

  it('패턴대로 행동하며 예고 턴에는 피해를 주지 않는다', () => {
    // 미루기 대왕 패턴: attack, charge, heavy, attack
    let state = bossBattle()
    const hpStart = state.player.hp

    state = takeTurn(state, 'defend', steady).battle // 1턴: attack
    const afterAttack = state.player.hp
    expect(afterAttack).toBeLessThan(hpStart)

    state = takeTurn(state, 'defend', steady).battle // 2턴: charge
    expect(state.player.hp).toBe(afterAttack)
    expect(state.monsterCharging).toBe(true)

    state = takeTurn(state, 'defend', steady).battle // 3턴: heavy
    expect(state.player.hp).toBeLessThan(afterAttack)
  })

  it('저지하지 않으면 보스가 체력을 되돌린다', () => {
    // 무한 스크롤 히드라(20층) 패턴: 포자, 공격, 재생 준비, 재생, 휘감기
    let state = createBattle({
      id: 'b2',
      monster: monsterForFloor(20),
      stats: deriveCombatStats(60),
      startedOn: '2025-09-25',
      skillIds: ['starlight_arrow'],
    })
    // 먼저 두 대 때려 체력을 깎아야 회복이 눈에 보인다
    state = takeTurn(state, 'attack', steady).battle
    state = takeTurn(state, 'attack', steady).battle
    state = takeTurn(state, 'defend', steady).battle // 재생 준비
    const before = state.monster.hp
    expect(before).toBeLessThan(state.monster.maxHp)

    // 저지 조건을 채우지 않고 방어만 하면 회복한다
    state = takeTurn(state, 'defend', steady).battle
    expect(state.monster.hp).toBeGreaterThan(before)
  })
})

describe('전투 아이템', () => {
  function battle() {
    const state = createBattle({
      id: 'b',
      monster: monsterForFloor(1),
      stats: deriveCombatStats(1),
      startedOn: '2025-09-25',
    })
    return { ...state, player: { ...state.player, hp: 10, mp: 0 } }
  }

  it('회복 아이템은 HP를 채우고 한 턴을 소모한다', () => {
    const start = battle()
    const { battle: next } = useItemTurn(
      start,
      { kind: 'heal', ratio: 0.5, name: '샘물 물약' },
      steady,
    )
    expect(next.player.hp).toBeGreaterThan(10 - 1)
    expect(next.turn).toBe(2)
  })

  it('MP 아이템은 MP를 채운다', () => {
    const start = battle()
    const { battle: next } = useItemTurn(
      start,
      { kind: 'mana', ratio: 1, name: '별빛 엘릭서' },
      steady,
    )
    expect(next.player.mp).toBeGreaterThan(0)
  })

  it('부활의 부적이 있으면 쓰러지지 않는다', () => {
    const start = { ...battle(), player: { ...battle().player, hp: 1 } }
    const { battle: next } = takeTurn(start, 'attack', steady, { reviveRatio: 0.5 })
    expect(next.status).toBe('active')
    expect(next.revivedOnce).toBe(true)
  })

  it('부활은 한 번뿐이다', () => {
    const base = battle()
    const start = { ...base, player: { ...base.player, hp: 1 }, revivedOnce: true }
    const { battle: next } = takeTurn(start, 'attack', steady, { reviveRatio: 0.5 })
    expect(next.status).toBe('lost')
  })
})

describe('상점 카탈로그', () => {
  it('아이템과 꾸미기 id가 중복되지 않는다', () => {
    expect(new Set(SHOP_ITEMS.map((i) => i.id)).size).toBe(SHOP_ITEMS.length)
    expect(new Set(COSMETICS.map((c) => c.id)).size).toBe(COSMETICS.length)
  })

  it('세 부위 모두 꾸미기가 있다', () => {
    for (const slot of ['hat', 'face', 'aura'] as const) {
      expect(COSMETICS.some((cosmetic) => cosmetic.slot === slot)).toBe(true)
    }
  })

  it('id로 찾을 수 있다', () => {
    expect(findItem('small_potion')?.name).toBeTruthy()
    expect(findCosmetic('crown')?.slot).toBe('hat')
    expect(findItem('없는아이템')).toBeUndefined()
  })
})
