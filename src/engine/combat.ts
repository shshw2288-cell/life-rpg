import {
  ACTIONS,
  COMBAT_SCALING,
  MONSTER_HEAVY_MULTIPLIER,
  MONSTER_HEAVY_TURN_INTERVAL,
} from '../data/battleConfig'
import { findMonster, type MonsterDef } from '../data/monsterConfig'
import type {
  BattleLogEntry,
  BattleState,
  CombatStats,
  PlayerAction,
} from '../types/battle'
import type { Rng } from './pets'

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
  monster: MonsterDef
  stats: CombatStats
  startedOn: string
}): BattleState {
  const { id, monster, stats, startedOn } = params
  return {
    id,
    monsterId: monster.id,
    startedOn,
    turn: 1,
    status: 'active',
    player: { hp: stats.maxHp, maxHp: stats.maxHp, mp: stats.maxMp, maxMp: stats.maxMp },
    playerStats: stats,
    monster: { hp: monster.hp, maxHp: monster.hp },
    defending: false,
    monsterCharging: false,
    log: [
      { turn: 1, side: 'system', text: `${monster.name}이(가) 나타났다!` },
    ],
    rewardGranted: false,
  }
}

function roll(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

/** 플레이어 공격 피해 */
function playerAttackDamage(state: BattleState, monster: MonsterDef, rng: Rng) {
  const variance = roll(rng, ACTIONS.attack.varianceMin, ACTIONS.attack.varianceMax)
  const crit = rng() < state.playerStats.critChance
  const raw = state.playerStats.attack * variance * (crit ? COMBAT_SCALING.critMultiplier : 1)
  return { damage: Math.max(1, Math.round(raw - monster.defense)), crit }
}

/** 스킬 피해 */
function skillDamage(state: BattleState, monster: MonsterDef, rng: Rng) {
  const crit = rng() < state.playerStats.critChance
  const raw =
    state.playerStats.attack * ACTIONS.skill.power * (crit ? COMBAT_SCALING.critMultiplier : 1)
  const defense = monster.defense * ACTIONS.skill.defensePierce
  return { damage: Math.max(1, Math.round(raw - defense)), crit }
}

/** 몬스터가 주는 피해 */
function monsterDamage(state: BattleState, monster: MonsterDef, heavy: boolean, rng: Rng) {
  const variance = roll(rng, ACTIONS.attack.varianceMin, ACTIONS.attack.varianceMax)
  const raw = monster.attack * variance * (heavy ? MONSTER_HEAVY_MULTIPLIER : 1)
  const afterDefense = raw - state.playerStats.defense
  const afterGuard = state.defending ? afterDefense * ACTIONS.defend.damageTaken : afterDefense
  return Math.max(1, Math.round(afterGuard))
}

export interface TurnResult {
  battle: BattleState
  /** 이번 턴에 추가된 로그만 따로 준다. 애니메이션에 쓸 수 있다. */
  added: BattleLogEntry[]
}

/**
 * 한 턴을 진행한다. 플레이어가 먼저 행동하고, 몬스터가 살아 있으면 반격한다.
 * 이미 끝난 전투이거나 MP가 부족한 스킬 선택은 상태를 바꾸지 않는다.
 */
export function takeTurn(state: BattleState, action: PlayerAction, rng: Rng): TurnResult {
  if (state.status !== 'active') return { battle: state, added: [] }

  const monster = findMonster(state.monsterId)
  if (!monster) return { battle: state, added: [] }

  if (action === 'skill' && state.player.mp < ACTIONS.skill.mpCost) {
    return { battle: state, added: [] }
  }

  const added: BattleLogEntry[] = []
  const turn = state.turn
  let next: BattleState = { ...state, defending: false }

  // 1) 플레이어 행동
  if (action === 'attack') {
    const { damage, crit } = playerAttackDamage(next, monster, rng)
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
    const { damage, crit } = skillDamage(next, monster, rng)
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

  // 2) 몬스터 사망 확인
  if (next.monster.hp <= 0) {
    added.push({ turn, side: 'system', text: `${monster.name}을(를) 쓰러뜨렸다!` })
    return {
      battle: { ...next, status: 'won', log: [...next.log, ...added] },
      added,
    }
  }

  // 3) 몬스터 행동
  const heavy = next.monsterCharging
  const damage = monsterDamage(next, monster, heavy, rng)
  next = {
    ...next,
    player: { ...next.player, hp: Math.max(0, next.player.hp - damage) },
    monsterCharging: false,
  }
  added.push({
    turn,
    side: 'monster',
    text: heavy
      ? `${monster.name}의 강타! (${damage})`
      : `${monster.name}의 공격 (${damage})`,
    damage,
  })

  // 4) 플레이어 사망 확인
  if (next.player.hp <= 0) {
    added.push({ turn, side: 'system', text: '루미가 쓰러졌다... 다음에 다시 도전하자.' })
    return {
      battle: { ...next, status: 'lost', log: [...next.log, ...added] },
      added,
    }
  }

  // 5) 다음 턴 준비. 일정 턴마다 강공격을 예고한다.
  const nextTurn = turn + 1
  const charging = nextTurn % MONSTER_HEAVY_TURN_INTERVAL === 0
  if (charging) {
    added.push({ turn, side: 'monster', text: `${monster.name}이(가) 기운을 모으고 있다...` })
  }

  return {
    battle: {
      ...next,
      turn: nextTurn,
      monsterCharging: charging,
      log: [...next.log, ...added],
    },
    added,
  }
}

/** 승리 보상을 계산한다. 지급 여부는 호출하는 쪽에서 rewardGranted로 관리한다. */
export function calcRewards(monster: MonsterDef, rng: Rng) {
  const materials: Record<string, number> = {}
  if (rng() < monster.materialChance) {
    materials[monster.materialId] = 1
  }
  return { gold: monster.goldReward, materials }
}
