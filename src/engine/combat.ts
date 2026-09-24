import {
  ACTIONS,
  COMBAT_SCALING,
  MONSTER_HEAVY_MULTIPLIER,
  MONSTER_HEAVY_TURN_INTERVAL,
} from '../data/battleConfig'
import type { BossMove } from '../data/towerConfig'
import type {
  BattleLogEntry,
  BattleState,
  CombatStats,
  PlayerAction,
} from '../types/battle'
import type { Rng } from './pets'
import type { FloorMonster } from './tower'

/**
 * 전투 계산. 순수 함수만 두며 React·저장소·Math.random 을 직접 쓰지 않는다.
 * 난수는 전부 rng 인자로 주입받는다.
 */

/**
 * 레벨에서 전투 능력치를 만든다.
 *
 * 지금 프로젝트에는 STR/INT/CON/PER 능력치와 장비가 없다(PRD 5장에서 2단계).
 * 생기면 bonus 인자로 넘기기만 하면 되도록 자리를 열어 둔다.
 *   STR -> attack, INT -> maxMp, CON -> maxHp·defense, PER -> critChance
 * 지금은 동행 펫의 효과가 이 자리로 들어온다.
 */
export function deriveCombatStats(level: number, bonus: Partial<CombatStats> = {}): CombatStats {
  const steps = Math.max(0, level - 1)
  return {
    maxHp: Math.round(COMBAT_SCALING.baseHp + COMBAT_SCALING.hpPerLevel * steps + (bonus.maxHp ?? 0)),
    attack: Math.round(
      COMBAT_SCALING.baseAttack + COMBAT_SCALING.attackPerLevel * steps + (bonus.attack ?? 0),
    ),
    defense: Math.round(
      COMBAT_SCALING.baseDefense + COMBAT_SCALING.defensePerLevel * steps + (bonus.defense ?? 0),
    ),
    maxMp: Math.round(COMBAT_SCALING.baseMp + COMBAT_SCALING.mpPerLevel * steps + (bonus.maxMp ?? 0)),
    critChance: COMBAT_SCALING.baseCritChance + (bonus.critChance ?? 0),
  }
}

export function createBattle(params: {
  id: string
  monster: FloorMonster
  stats: CombatStats
  startedOn: string
}): BattleState {
  const { id, monster, stats, startedOn } = params
  return {
    id,
    floor: monster.floor,
    monsterDef: monster,
    startedOn,
    turn: 1,
    status: 'active',
    player: { hp: stats.maxHp, maxHp: stats.maxHp, mp: stats.maxMp, maxMp: stats.maxMp },
    playerStats: stats,
    monster: { hp: monster.hp, maxHp: monster.hp },
    defending: false,
    monsterCharging: false,
    patternIndex: 0,
    log: [
      {
        turn: 1,
        side: 'system',
        text: `${monster.floor}층 — ${monster.name}${monster.isBoss ? ' (보스)' : ''}이(가) 나타났다!`,
      },
    ],
    rewardGranted: false,
    revivedOnce: false,
  }
}

function roll(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

function playerAttackDamage(state: BattleState, rng: Rng) {
  const variance = roll(rng, ACTIONS.attack.varianceMin, ACTIONS.attack.varianceMax)
  const crit = rng() < state.playerStats.critChance
  const raw = state.playerStats.attack * variance * (crit ? COMBAT_SCALING.critMultiplier : 1)
  return { damage: Math.max(1, Math.round(raw - state.monsterDef.defense)), crit }
}

function skillDamage(state: BattleState, rng: Rng) {
  const crit = rng() < state.playerStats.critChance
  const raw =
    state.playerStats.attack * ACTIONS.skill.power * (crit ? COMBAT_SCALING.critMultiplier : 1)
  const defense = state.monsterDef.defense * ACTIONS.skill.defensePierce
  return { damage: Math.max(1, Math.round(raw - defense)), crit }
}

function monsterDamage(state: BattleState, heavy: boolean, rng: Rng) {
  const variance = roll(rng, ACTIONS.attack.varianceMin, ACTIONS.attack.varianceMax)
  const raw = state.monsterDef.attack * variance * (heavy ? MONSTER_HEAVY_MULTIPLIER : 1)
  const afterDefense = raw - state.playerStats.defense
  const afterGuard = state.defending ? afterDefense * ACTIONS.defend.damageTaken : afterDefense
  return Math.max(1, Math.round(afterGuard))
}

/** 이번 턴에 몬스터가 할 행동을 정한다 */
function decideMonsterMove(state: BattleState): BossMove {
  const pattern = state.monsterDef.pattern
  if (pattern && pattern.length > 0) {
    return pattern[state.patternIndex % pattern.length]
  }
  // 일반 몬스터는 예고된 턴에만 강타
  return state.monsterCharging ? 'heavy' : 'attack'
}

export interface TurnResult {
  battle: BattleState
  /** 이번 턴에 추가된 로그만 따로 준다. 애니메이션에 쓸 수 있다. */
  added: BattleLogEntry[]
}

/** 몬스터 차례를 처리한다. 플레이어 행동 뒤에 호출한다. */
function monsterTurn(
  state: BattleState,
  turn: number,
  rng: Rng,
): { next: BattleState; added: BattleLogEntry[] } {
  const added: BattleLogEntry[] = []
  const move = decideMonsterMove(state)
  const name = state.monsterDef.name
  let next = state

  if (move === 'charge') {
    added.push({ turn, side: 'monster', text: `${name}이(가) 기운을 모으고 있다...` })
    next = { ...next, monsterCharging: true }
  } else if (move === 'heal') {
    const amount = Math.round(next.monster.maxHp * (next.monsterDef.healRatio ?? 0.08))
    next = {
      ...next,
      monster: { ...next.monster, hp: Math.min(next.monster.maxHp, next.monster.hp + amount) },
    }
    added.push({ turn, side: 'monster', text: `${name}이(가) 체력을 ${amount} 회복했다` })
  } else {
    const heavy = move === 'heavy'
    const damage = monsterDamage(next, heavy, rng)
    next = {
      ...next,
      player: { ...next.player, hp: Math.max(0, next.player.hp - damage) },
      monsterCharging: false,
    }
    added.push({
      turn,
      side: 'monster',
      text: heavy ? `${name}의 강타! (${damage})` : `${name}의 공격 (${damage})`,
      damage,
    })
  }

  // 보스는 패턴을 한 칸 진행한다
  if (next.monsterDef.pattern) {
    next = { ...next, patternIndex: next.patternIndex + 1 }
  }

  return { next, added }
}

/** 플레이어가 쓰러졌을 때 부활의 부적을 쓸 수 있으면 살린다 */
function tryRevive(
  state: BattleState,
  turn: number,
  reviveRatio: number | null,
): { next: BattleState; added: BattleLogEntry[]; used: boolean } {
  if (state.player.hp > 0 || reviveRatio === null || state.revivedOnce) {
    return { next: state, added: [], used: false }
  }
  const hp = Math.max(1, Math.round(state.player.maxHp * reviveRatio))
  return {
    next: { ...state, player: { ...state.player, hp }, revivedOnce: true },
    added: [{ turn, side: 'system', text: `부활의 부적이 빛났다! HP ${hp}로 다시 일어섰다.` }],
    used: true,
  }
}

function finishIfDead(
  state: BattleState,
  turn: number,
  added: BattleLogEntry[],
): TurnResult | null {
  if (state.player.hp > 0) return null
  const entry: BattleLogEntry = {
    turn,
    side: 'system',
    text: '루미가 쓰러졌다... 다음에 다시 도전하자.',
  }
  return {
    battle: { ...state, status: 'lost', log: [...state.log, ...added, entry] },
    added: [...added, entry],
  }
}

export interface TurnOptions {
  /** 부활의 부적을 가지고 있으면 회복 비율, 없으면 null */
  reviveRatio?: number | null
}

/**
 * 한 턴을 진행한다. 플레이어가 먼저 행동하고, 몬스터가 살아 있으면 반격한다.
 * 이미 끝난 전투이거나 MP가 부족한 스킬 선택은 상태를 바꾸지 않는다.
 */
export function takeTurn(
  state: BattleState,
  action: PlayerAction,
  rng: Rng,
  options: TurnOptions = {},
): TurnResult {
  if (state.status !== 'active') return { battle: state, added: [] }
  if (action === 'skill' && state.player.mp < ACTIONS.skill.mpCost) {
    return { battle: state, added: [] }
  }

  const added: BattleLogEntry[] = []
  const turn = state.turn
  let next: BattleState = { ...state, defending: false }

  // 1) 플레이어 행동
  if (action === 'attack') {
    const { damage, crit } = playerAttackDamage(next, rng)
    next = {
      ...next,
      monster: { ...next.monster, hp: Math.max(0, next.monster.hp - damage) },
      player: {
        ...next.player,
        mp: Math.min(next.player.maxMp, next.player.mp + ACTIONS.attack.mpGain),
      },
    }
    added.push({
      turn,
      side: 'player',
      text: crit ? `치명타! 루미의 공격 (${damage})` : `루미의 공격 (${damage})`,
      damage,
      crit,
    })
  } else if (action === 'defend') {
    next = {
      ...next,
      defending: true,
      player: {
        ...next.player,
        mp: Math.min(next.player.maxMp, next.player.mp + ACTIONS.defend.mpGain),
      },
    }
    added.push({ turn, side: 'player', text: `루미가 몸을 웅크렸다 (MP +${ACTIONS.defend.mpGain})` })
  } else {
    const { damage, crit } = skillDamage(next, rng)
    next = {
      ...next,
      monster: { ...next.monster, hp: Math.max(0, next.monster.hp - damage) },
      player: { ...next.player, mp: next.player.mp - ACTIONS.skill.mpCost },
    }
    added.push({
      turn,
      side: 'player',
      text: `${crit ? '치명타! ' : ''}${ACTIONS.skill.name} (${damage})`,
      damage,
      crit,
    })
  }

  return resolveAfterPlayerAction(next, turn, added, rng, options)
}

/**
 * 전투 중 아이템을 쓴다. 한 턴을 소모하며 몬스터가 반격한다.
 */
export function useItemTurn(
  state: BattleState,
  effect: { kind: 'heal' | 'mana'; ratio: number; name: string },
  rng: Rng,
  options: TurnOptions = {},
): TurnResult {
  if (state.status !== 'active') return { battle: state, added: [] }

  const turn = state.turn
  const added: BattleLogEntry[] = []
  let next: BattleState = { ...state, defending: false }

  if (effect.kind === 'heal') {
    const amount = Math.round(next.player.maxHp * effect.ratio)
    const healed = Math.min(next.player.maxHp, next.player.hp + amount) - next.player.hp
    next = { ...next, player: { ...next.player, hp: next.player.hp + healed } }
    added.push({ turn, side: 'player', text: `${effect.name} 사용 — HP +${healed}` })
  } else {
    const amount = Math.round(next.player.maxMp * effect.ratio)
    const restored = Math.min(next.player.maxMp, next.player.mp + amount) - next.player.mp
    next = { ...next, player: { ...next.player, mp: next.player.mp + restored } }
    added.push({ turn, side: 'player', text: `${effect.name} 사용 — MP +${restored}` })
  }

  return resolveAfterPlayerAction(next, turn, added, rng, options)
}

/** 플레이어 행동 이후의 공통 처리: 몬스터 사망 확인 → 반격 → 플레이어 사망 확인 */
function resolveAfterPlayerAction(
  state: BattleState,
  turn: number,
  added: BattleLogEntry[],
  rng: Rng,
  options: TurnOptions,
): TurnResult {
  let next = state

  if (next.monster.hp <= 0) {
    const entry: BattleLogEntry = {
      turn,
      side: 'system',
      text: `${next.monsterDef.name}을(를) 쓰러뜨렸다!`,
    }
    return {
      battle: { ...next, status: 'won', log: [...next.log, ...added, entry] },
      added: [...added, entry],
    }
  }

  const monsterResult = monsterTurn(next, turn, rng)
  next = monsterResult.next
  added.push(...monsterResult.added)

  const revive = tryRevive(next, turn, options.reviveRatio ?? null)
  next = revive.next
  added.push(...revive.added)

  const dead = finishIfDead(next, turn, added)
  if (dead) return dead

  // 다음 턴 준비. 일반 몬스터는 일정 턴마다 강타를 예고한다.
  const nextTurn = turn + 1
  let charging = next.monsterCharging
  if (!next.monsterDef.pattern) {
    charging = nextTurn % MONSTER_HEAVY_TURN_INTERVAL === 0
    if (charging) {
      added.push({
        turn,
        side: 'monster',
        text: `${next.monsterDef.name}이(가) 기운을 모으고 있다...`,
      })
    }
  }

  return {
    battle: { ...next, turn: nextTurn, monsterCharging: charging, log: [...next.log, ...added] },
    added,
  }
}

/** 승리 보상을 계산한다. 지급 여부는 호출하는 쪽에서 rewardGranted로 관리한다. */
export function calcRewards(monster: FloorMonster, rng: Rng) {
  const materials: Record<string, number> = {}
  if (rng() < monster.materialChance) {
    materials[monster.materialId] = monster.isBoss ? 3 : 1
  }
  return { gold: monster.goldReward, materials }
}
