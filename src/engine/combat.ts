import {
  ACTIONS,
  AMBIENT_POISON,
  COMBAT_SCALING,
  MONSTER_HEAVY_MULTIPLIER,
  STATUS_INFO,
} from '../data/battleConfig'
import { PET_COMBAT } from '../data/petRoleConfig'
import { findSkill } from '../data/skillConfig'
import type {
  BattleLogEntry,
  BattlePetState,
  BattleState,
  BattleStep,
  BossAction,
  BossIntent,
  CombatStats,
  PlayerAction,
  StatusEffect,
  StatusId,
} from '../types/battle'
import { initSkillStates } from './skills'
import type { Rng } from './pets'
import type { FloorMonster } from './tower'

/**
 * 전투 계산. 순수 함수만 두며 React·저장소·Math.random 을 직접 쓰지 않는다.
 * 난수는 전부 rng 인자로 주입받는다.
 *
 * 한 라운드의 순서 (여기서만 정의한다):
 *   1) 플레이어 행동 (공격 / 방어 / 스킬)
 *   2) 공격형 펫의 추가 타격 — 펫의 타격은 다시 펫을 발동시키지 않는다
 *   3) 적이 쓰러졌으면 즉시 승리 (반격·펫 행동 없음)
 *   4) 몬스터 행동 — 예고(intent)에 적힌 대로만 한다
 *   5) 회복형·지원형 펫의 주기 발동
 *   6) 상태이상 피해와 지속시간 감소
 *   7) 부활 확인 → 사망 확인
 *   8) 대기시간 감소 → 다음 턴 예고 계산
 */

/**
 * 레벨에서 전투 능력치를 만든다.
 *
 * 지금 프로젝트에는 STR/INT/CON/PER 능력치와 장비가 없다(PRD 5장에서 2단계).
 * 생기면 bonus 인자로 넘기기만 하면 되도록 자리를 열어 둔다.
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

// ── 상태이상 도우미 ───────────────────────────────────────────

function statusValue(list: StatusEffect[], id: StatusId): number {
  return list.find((status) => status.id === id)?.value ?? 0
}

function hasStatus(list: StatusEffect[], id: StatusId): boolean {
  return list.some((status) => status.id === id)
}

/** 같은 상태가 이미 있으면 새 값으로 덮어쓴다 (겹쳐 쌓이지 않는다) */
function addStatus(list: StatusEffect[], effect: StatusEffect): StatusEffect[] {
  return [...list.filter((status) => status.id !== effect.id), { ...effect }]
}

function removeStatus(list: StatusEffect[], id: StatusId): StatusEffect[] {
  return list.filter((status) => status.id !== id)
}

/**
 * 몬스터 차례에 붙는 상태는 그 라운드가 곧바로 끝나면서 1턴이 깎인다.
 * 데이터에 적힌 지속시간이 '플레이어가 실제로 겪는 턴 수'가 되도록 한 턴을 더해 준다.
 * (플레이어가 거는 상태는 몬스터 차례를 한 번 겪으므로 그대로 쓴다.)
 */
function lingering(status: StatusEffect): StatusEffect {
  return { ...status, turns: status.turns + 1 }
}

/** 라운드 끝에 남은 턴을 1씩 줄이고 끝난 것을 버린다 */
function tickStatuses(list: StatusEffect[]): StatusEffect[] {
  return list
    .map((status) => ({ ...status, turns: status.turns - 1 }))
    .filter((status) => status.turns > 0)
}

// ── 전투 생성 ────────────────────────────────────────────────

export function createBattle(params: {
  id: string
  monster: FloorMonster
  stats: CombatStats
  startedOn: string
  /** 장착한 스킬 (전투 중 변경 불가) */
  skillIds?: string[]
  /** 동행 펫 (전투 중 교체 불가) */
  pet?: BattlePetState | null
}): BattleState {
  const { id, monster, stats, startedOn, skillIds = [], pet = null } = params

  const base: BattleState = {
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
    intent: null,
    playerStatuses: [],
    monsterStatuses: [],
    skills: initSkillStates(skillIds),
    pet: pet ? { ...pet } : null,
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

  const intent = computeIntent(base)
  return { ...base, intent, monsterCharging: intent.kind === 'heavy' }
}

// ── 예고(intent) ─────────────────────────────────────────────

const NORMAL_ATTACK: BossAction = { id: 'strike', label: '공격', intent: '평범한 공격', kind: 'attack', power: 1 }
const NORMAL_HEAVY: BossAction = {
  id: 'heavy',
  label: '강타',
  intent: '강공격!',
  hint: '방어하면 피해가 크게 줄어듭니다',
  kind: 'heavy',
  power: MONSTER_HEAVY_MULTIPLIER,
}

/** 이번 턴(state.turn)에 몬스터가 할 행동 */
function actionForTurn(state: BattleState): BossAction {
  const pattern = state.monsterDef.pattern
  if (pattern && pattern.length > 0) {
    return pattern[state.patternIndex % pattern.length]
  }
  const interval = Math.max(2, state.monsterDef.heavyInterval)
  return state.turn % interval === 0 ? NORMAL_HEAVY : NORMAL_ATTACK
}

function intentOf(action: BossAction): BossIntent {
  return {
    actionId: action.id,
    label: action.label,
    intent: action.intent,
    hint: action.hint,
    kind: action.kind,
    dangerous: action.kind === 'heavy' || action.kind === 'charge' || action.kind === 'heal_prep',
  }
}

function computeIntent(state: BattleState): BossIntent {
  return intentOf(actionForTurn(state))
}

// ── 피해 계산 ────────────────────────────────────────────────

function roll(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

/** 몬스터가 받는 피해에 약점 노출·보호막을 반영한다 */
function applyMonsterModifiers(state: BattleState, raw: number): number {
  const vulnerable = statusValue(state.monsterStatuses, 'vulnerable')
  const guard = statusValue(state.monsterStatuses, 'guard')
  return Math.max(1, Math.round(raw * (1 + vulnerable) * (1 - guard)))
}

function playerAttackDamage(state: BattleState, rng: Rng) {
  const variance = roll(rng, ACTIONS.attack.varianceMin, ACTIONS.attack.varianceMax)
  const crit = rng() < state.playerStats.critChance
  const focus = statusValue(state.playerStatuses, 'focus')
  const raw =
    state.playerStats.attack * variance * (crit ? COMBAT_SCALING.critMultiplier : 1) * (1 + focus)
  return { damage: applyMonsterModifiers(state, raw - state.monsterDef.defense), crit }
}

function skillAttackDamage(
  state: BattleState,
  power: number,
  defensePierce: number,
  rng: Rng,
) {
  const crit = rng() < state.playerStats.critChance
  const focus = statusValue(state.playerStatuses, 'focus')
  const raw =
    state.playerStats.attack * power * (crit ? COMBAT_SCALING.critMultiplier : 1) * (1 + focus)
  const defense = state.monsterDef.defense * defensePierce
  return { damage: applyMonsterModifiers(state, raw - defense), crit }
}

/** 몬스터의 공격이 플레이어에게 주는 피해. 방어·보호막·묶임·방어형 펫을 모두 반영한다. */
function monsterDamage(
  state: BattleState,
  power: number,
  rng: Rng,
): { damage: number; petGuard: boolean } {
  const variance = roll(rng, ACTIONS.attack.varianceMin, ACTIONS.attack.varianceMax)
  const weaken = statusValue(state.monsterStatuses, 'weaken')
  const raw = state.monsterDef.attack * variance * power * (1 - weaken)

  const afterDefense = raw - state.playerStats.defense
  const afterGuard = state.defending ? afterDefense * ACTIONS.defend.damageTaken : afterDefense
  const afterShield = afterGuard * (1 - statusValue(state.playerStatuses, 'shield'))

  let damage = Math.max(1, Math.round(afterShield))

  // 방어형 펫: 위험한 한 방을 전투당 한 번 막아준다
  const pet = state.pet
  let petGuard = false
  if (
    pet &&
    pet.role === 'guard' &&
    pet.usesLeft > 0 &&
    damage >= state.player.maxHp * PET_COMBAT.guard.threshold
  ) {
    petGuard = true
    damage = Math.max(1, Math.round(damage * (1 - pet.value)))
  }

  return { damage, petGuard }
}

// ── 턴 진행 ─────────────────────────────────────────────────

export interface TurnResult {
  battle: BattleState
  /** 이번 턴에 추가된 로그만 따로 준다. */
  added: BattleLogEntry[]
  /** 연출을 재생하기 위한 구조화된 단계. 저장하지 않는다. */
  steps: BattleStep[]
}

export interface TurnOptions {
  /** 부활의 부적을 가지고 있으면 회복 비율, 없으면 null */
  reviveRatio?: number | null
}

const NO_CHANGE = (state: BattleState): TurnResult => ({ battle: state, added: [], steps: [] })

/**
 * 한 턴을 진행한다.
 * 이미 끝난 전투이거나 쓸 수 없는 스킬을 고르면 상태를 전혀 바꾸지 않는다.
 */
export function takeTurn(
  state: BattleState,
  action: PlayerAction,
  rng: Rng,
  options: TurnOptions = {},
): TurnResult {
  if (state.status !== 'active') return NO_CHANGE(state)

  const added: BattleLogEntry[] = []
  const steps: BattleStep[] = []
  const turn = state.turn
  let next: BattleState = { ...state, defending: false }
  /** 이번 라운드에 몬스터에게 준 피해 (회복 저지 판정에 쓴다) */
  let roundDamage = 0
  /** 공격형 펫이 따라 들어갈 수 있는 행동이었는지 */
  let wasOffensive = false

  if (action === 'attack') {
    const { damage, crit } = playerAttackDamage(next, rng)
    roundDamage += damage
    wasOffensive = true
    next = {
      ...next,
      monster: { ...next.monster, hp: Math.max(0, next.monster.hp - damage) },
      player: {
        ...next.player,
        mp: Math.min(next.player.maxMp, next.player.mp + ACTIONS.attack.mpGain),
      },
      playerStatuses: removeStatus(next.playerStatuses, 'focus'),
    }
    added.push({
      turn,
      side: 'player',
      text: crit ? `치명타! 루미의 공격 (${damage})` : `루미의 공격 (${damage})`,
      damage,
      crit,
    })
    steps.push({ kind: 'player_attack', damage, crit })
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
    steps.push({ kind: 'player_defend' })
  } else {
    const used = castSkill(next, action.skillId, turn, rng)
    if (!used) return NO_CHANGE(state)
    next = used.next
    roundDamage += used.damage
    wasOffensive = used.offensive
    added.push(...used.added)
    steps.push(...used.steps)
  }

  return resolveAfterPlayerAction(next, turn, added, steps, rng, options, roundDamage, wasOffensive)
}

/** 스킬 한 번. 쓸 수 없으면 null 을 돌려주고 호출한 쪽이 상태를 그대로 둔다. */
function castSkill(
  state: BattleState,
  skillId: string,
  turn: number,
  rng: Rng,
): {
  next: BattleState
  added: BattleLogEntry[]
  steps: BattleStep[]
  damage: number
  offensive: boolean
} | null {
  const slot = state.skills.find((entry) => entry.id === skillId)
  const skill = findSkill(skillId)
  if (!slot || !skill) return null
  if (slot.cooldown > 0) return null
  if (slot.usesLeft !== null && slot.usesLeft <= 0) return null
  if (state.player.mp < skill.mpCost) return null

  const added: BattleLogEntry[] = []
  const steps: BattleStep[] = []
  let damage = 0
  let offensive = false

  let next: BattleState = {
    ...state,
    player: { ...state.player, mp: state.player.mp - skill.mpCost },
    skills: state.skills.map((entry) =>
      entry.id === skillId
        ? {
            ...entry,
            cooldown: skill.cooldown,
            usesLeft: entry.usesLeft === null ? null : entry.usesLeft - 1,
          }
        : entry,
    ),
  }

  if (skill.kind === 'damage') {
    const result = skillAttackDamage(next, skill.power ?? 1, skill.defensePierce ?? 1, rng)
    damage = result.damage
    offensive = true
    next = {
      ...next,
      monster: { ...next.monster, hp: Math.max(0, next.monster.hp - damage) },
      playerStatuses: removeStatus(next.playerStatuses, 'focus'),
    }
    added.push({
      turn,
      side: 'player',
      text: `${result.crit ? '치명타! ' : ''}${skill.name} (${damage})`,
      damage,
      crit: result.crit,
    })
    steps.push({ kind: 'player_skill', skillId, name: skill.name, damage, crit: result.crit })
  } else if (skill.kind === 'heal') {
    const amount = Math.round(next.player.maxHp * (skill.healRatio ?? 0))
    const healed = Math.min(next.player.maxHp, next.player.hp + amount) - next.player.hp
    next = { ...next, player: { ...next.player, hp: next.player.hp + healed } }
    added.push({ turn, side: 'player', text: `${skill.name} — HP +${healed}` })
    steps.push({ kind: 'player_heal', name: skill.name, amount: healed })
  } else if (skill.kind === 'buff' && skill.selfStatus) {
    next = { ...next, playerStatuses: addStatus(next.playerStatuses, skill.selfStatus) }
    added.push({
      turn,
      side: 'player',
      text: `${skill.name} — ${skill.selfStatus.turns}턴 동안 효과 발동`,
    })
    steps.push({ kind: 'player_buff', name: skill.name, status: skill.selfStatus.id })
  } else if (skill.kind === 'debuff' && skill.enemyStatus) {
    next = { ...next, monsterStatuses: addStatus(next.monsterStatuses, skill.enemyStatus) }
    added.push({
      turn,
      side: 'player',
      text: `${skill.name} — ${next.monsterDef.name}을(를) 묶었다`,
    })
    steps.push({ kind: 'enemy_debuff', name: skill.name, status: skill.enemyStatus.id })
  }

  return { next, added, steps, damage, offensive }
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
  if (state.status !== 'active') return NO_CHANGE(state)

  const turn = state.turn
  const added: BattleLogEntry[] = []
  const steps: BattleStep[] = []
  let next: BattleState = { ...state, defending: false }

  if (effect.kind === 'heal') {
    const amount = Math.round(next.player.maxHp * effect.ratio)
    const healed = Math.min(next.player.maxHp, next.player.hp + amount) - next.player.hp
    next = { ...next, player: { ...next.player, hp: next.player.hp + healed } }
    added.push({ turn, side: 'player', text: `${effect.name} 사용 — HP +${healed}` })
    steps.push({ kind: 'player_item', heal: healed, name: effect.name })
  } else {
    const amount = Math.round(next.player.maxMp * effect.ratio)
    const restored = Math.min(next.player.maxMp, next.player.mp + amount) - next.player.mp
    next = { ...next, player: { ...next.player, mp: next.player.mp + restored } }
    added.push({ turn, side: 'player', text: `${effect.name} 사용 — MP +${restored}` })
    steps.push({ kind: 'player_item', mana: restored, name: effect.name })
  }

  return resolveAfterPlayerAction(next, turn, added, steps, rng, options, 0, false)
}

// ── 라운드 마무리 ────────────────────────────────────────────

function winNow(
  state: BattleState,
  turn: number,
  added: BattleLogEntry[],
  steps: BattleStep[],
): TurnResult {
  const entry: BattleLogEntry = {
    turn,
    side: 'system',
    text: `${state.monsterDef.name}을(를) 쓰러뜨렸다!`,
  }
  return {
    battle: { ...state, status: 'won', log: [...state.log, ...added, entry] },
    added: [...added, entry],
    steps: [...steps, { kind: 'win' }],
  }
}

function resolveAfterPlayerAction(
  state: BattleState,
  turn: number,
  added: BattleLogEntry[],
  steps: BattleStep[],
  rng: Rng,
  options: TurnOptions,
  roundDamageIn: number,
  wasOffensive: boolean,
): TurnResult {
  let next = state
  let roundDamage = roundDamageIn

  // 2) 공격형 펫의 추가 타격 — 펫의 타격은 다시 펫을 발동시키지 않는다
  if (wasOffensive && next.monster.hp > 0) {
    const followUp = strikerFollowUp(next, turn)
    if (followUp) {
      next = followUp.next
      roundDamage += followUp.damage
      added.push(...followUp.added)
      steps.push(...followUp.steps)
    }
  }

  // 3) 중독 피해. 이번 라운드에 새로 걸린 중독은 아직 아프지 않다.
  const poison = applyPoison(next, turn)
  next = poison.next
  added.push(...poison.added)
  steps.push(...poison.steps)

  // 4) 적이 쓰러졌으면 반격 없이 승리
  if (next.monster.hp <= 0) return winNow(next, turn, added, steps)

  {
    const dead = settleDeath(next, turn, added, steps, options)
    next = dead.next
    if (dead.result) return dead.result
  }

  // 5) 몬스터 행동
  const monsterResult = monsterTurn(next, turn, rng, roundDamage)
  next = monsterResult.next
  added.push(...monsterResult.added)
  steps.push(...monsterResult.steps)

  // 6) 주기형 펫 (쓰러진 뒤에는 발동하지 않는다)
  if (next.player.hp > 0) {
    const support = petUpkeep(next, turn)
    next = support.next
    added.push(...support.added)
    steps.push(...support.steps)
  }

  // 7) 상태이상 지속시간 감소
  next = {
    ...next,
    playerStatuses: tickStatuses(next.playerStatuses),
    monsterStatuses: tickStatuses(next.monsterStatuses),
  }

  if (next.monster.hp <= 0) return winNow(next, turn, added, steps)

  {
    const dead = settleDeath(next, turn, added, steps, options)
    next = dead.next
    if (dead.result) return dead.result
  }

  // 8) 대기시간 감소 → 다음 턴 예고
  const nextTurn = turn + 1
  next = {
    ...next,
    turn: nextTurn,
    skills: next.skills.map((slot) => ({ ...slot, cooldown: Math.max(0, slot.cooldown - 1) })),
    pet: next.pet ? { ...next.pet, cooldown: Math.max(0, next.pet.cooldown - 1) } : null,
  }

  const intent = computeIntent(next)
  next = {
    ...next,
    intent,
    // 강공격 예고는 다음 턴 행동이 강타일 때만 켠다
    monsterCharging: intent.kind === 'heavy',
    log: [...next.log, ...added],
  }

  return { battle: next, added, steps }
}

/** 공격형 펫의 추가 타격 */
function strikerFollowUp(state: BattleState, turn: number) {
  const pet = state.pet
  if (!pet || pet.role !== 'striker' || pet.cooldown > 0 || pet.usesLeft <= 0) return null

  const raw = state.playerStats.attack * pet.value - state.monsterDef.defense * 0.5
  const damage = applyMonsterModifiers(state, raw)

  const next: BattleState = {
    ...state,
    monster: { ...state.monster, hp: Math.max(0, state.monster.hp - damage) },
    pet: { ...pet, cooldown: PET_COMBAT.striker.cooldown, usesLeft: pet.usesLeft - 1 },
  }

  return {
    next,
    damage,
    added: [
      {
        turn,
        side: 'pet' as const,
        text: `${pet.name}의 ${pet.abilityName} (${damage})`,
        damage,
      },
    ],
    steps: [{ kind: 'pet_attack' as const, name: `${pet.name} · ${pet.abilityName}`, damage }],
  }
}

/** 회복형·지원형 펫의 주기 발동 */
function petUpkeep(state: BattleState, turn: number) {
  const added: BattleLogEntry[] = []
  const steps: BattleStep[] = []
  let next = state
  const pet = next.pet
  if (!pet) return { next, added, steps }

  let updated = { ...pet }

  if (pet.role === 'healer' && pet.cooldown <= 0 && pet.usesLeft > 0 && next.player.hp < next.player.maxHp) {
    const amount = Math.round(next.player.maxHp * pet.value)
    const healed = Math.min(next.player.maxHp, next.player.hp + amount) - next.player.hp
    next = { ...next, player: { ...next.player, hp: next.player.hp + healed } }
    updated = { ...updated, cooldown: pet.interval, usesLeft: pet.usesLeft - 1 }
    added.push({ turn, side: 'pet', text: `${pet.name}의 ${pet.abilityName} — HP +${healed}` })
    steps.push({ kind: 'pet_heal', name: `${pet.name} · ${pet.abilityName}`, amount: healed })
  }

  if (pet.role === 'support') {
    // 중독은 대기시간과 상관없이 남은 횟수가 있으면 바로 풀어준다
    if (updated.cleanseLeft > 0 && hasStatus(next.playerStatuses, 'poison')) {
      next = { ...next, playerStatuses: removeStatus(next.playerStatuses, 'poison') }
      updated = { ...updated, cleanseLeft: updated.cleanseLeft - 1 }
      added.push({ turn, side: 'pet', text: `${pet.name}이(가) 중독을 풀어주었다` })
      steps.push({
        kind: 'pet_support',
        name: `${pet.name} · ${pet.abilityName}`,
        cleansed: 'poison',
      })
    }
    if (pet.cooldown <= 0 && updated.usesLeft > 0 && next.player.mp < next.player.maxMp) {
      const amount = Math.round(next.player.maxMp * pet.value)
      const restored = Math.min(next.player.maxMp, next.player.mp + amount) - next.player.mp
      next = { ...next, player: { ...next.player, mp: next.player.mp + restored } }
      updated = { ...updated, cooldown: pet.interval, usesLeft: updated.usesLeft - 1 }
      added.push({ turn, side: 'pet', text: `${pet.name}의 ${pet.abilityName} — MP +${restored}` })
      steps.push({
        kind: 'pet_support',
        name: `${pet.name} · ${pet.abilityName}`,
        mana: restored,
      })
    }
  }

  return { next: { ...next, pet: updated }, added, steps }
}

/** 몬스터 차례. 예고(intent)에 적힌 행동만 한다. */
function monsterTurn(
  state: BattleState,
  turn: number,
  rng: Rng,
  roundDamage: number,
): { next: BattleState; added: BattleLogEntry[]; steps: BattleStep[] } {
  const added: BattleLogEntry[] = []
  const steps: BattleStep[] = []
  const action = actionForTurn(state)
  const name = state.monsterDef.name
  let next = state

  if (action.kind === 'charge') {
    added.push({ turn, side: 'monster', text: `${name}이(가) ${action.label} — ${action.intent}` })
    steps.push({ kind: 'monster_charge' })
  } else if (action.kind === 'heal_prep') {
    added.push({ turn, side: 'monster', text: `${name}이(가) ${action.label}에 들어갔다` })
    steps.push({ kind: 'monster_prep', what: action.label })
  } else if (action.kind === 'guard') {
    if (action.selfStatus) {
      next = {
        ...next,
        monsterStatuses: addStatus(next.monsterStatuses, lingering(action.selfStatus)),
      }
    }
    added.push({ turn, side: 'monster', text: `${name}이(가) ${action.label} — 피해가 줄어든다` })
    steps.push({ kind: 'monster_guard' })
  } else if (action.kind === 'rest') {
    if (action.selfStatus) {
      next = {
        ...next,
        monsterStatuses: addStatus(next.monsterStatuses, lingering(action.selfStatus)),
      }
    }
    added.push({ turn, side: 'monster', text: `${name}: ${action.intent}` })
    steps.push({ kind: 'monster_rest' })
  } else if (action.kind === 'heal') {
    const blocked = isInterrupted(next, action, roundDamage)
    if (blocked) {
      added.push({ turn, side: 'system', text: `${name}의 ${action.label}을(를) 저지했다!` })
      steps.push({ kind: 'monster_interrupted', what: action.label })
    } else {
      const amount = Math.round(next.monster.maxHp * (action.healRatio ?? 0))
      next = {
        ...next,
        monster: { ...next.monster, hp: Math.min(next.monster.maxHp, next.monster.hp + amount) },
      }
      added.push({ turn, side: 'monster', text: `${name}이(가) 체력을 ${amount} 회복했다` })
      steps.push({ kind: 'monster_heal', amount })
    }
  } else {
    const heavy = action.kind === 'heavy'
    const { damage, petGuard } = monsterDamage(next, action.power ?? 1, rng)

    if (petGuard && next.pet) {
      added.push({
        turn,
        side: 'pet',
        text: `${next.pet.name}의 ${next.pet.abilityName} — 피해를 크게 줄였다`,
      })
      steps.push({
        kind: 'pet_guard',
        name: `${next.pet.name} · ${next.pet.abilityName}`,
        reduced: Math.round(next.pet.value * 100),
      })
      next = { ...next, pet: { ...next.pet, usesLeft: next.pet.usesLeft - 1 } }
    }

    next = {
      ...next,
      player: { ...next.player, hp: Math.max(0, next.player.hp - damage) },
      // 공격했으면 묶임은 소모된다
      monsterStatuses: removeStatus(next.monsterStatuses, 'weaken'),
    }
    added.push({
      turn,
      side: 'monster',
      text: heavy ? `${name}의 ${action.label}! (${damage})` : `${name}의 ${action.label} (${damage})`,
      damage,
    })
    steps.push(heavy ? { kind: 'monster_heavy', damage } : { kind: 'monster_attack', damage })

    // 지정된 상태이상 + 지역 특징에 따른 중독
    const inflict =
      action.inflict ??
      (!heavy && next.monsterDef.poisonChance > 0 && rng() < next.monsterDef.poisonChance
        ? { id: 'poison' as const, turns: AMBIENT_POISON.turns, value: AMBIENT_POISON.value }
        : undefined)

    if (inflict && next.player.hp > 0) {
      next = { ...next, playerStatuses: addStatus(next.playerStatuses, lingering(inflict)) }
      added.push({ turn, side: 'monster', text: `루미가 ${statusName(inflict.id)} 상태가 되었다` })
    }
  }

  // 보스는 패턴을 한 칸 진행한다
  if (next.monsterDef.pattern) {
    next = { ...next, patternIndex: next.patternIndex + 1 }
  }

  return { next, added, steps }
}

/** 회복 등의 행동을 막았는지 판정한다. 데이터에 적힌 조건만 본다. */
function isInterrupted(state: BattleState, action: BossAction, roundDamage: number): boolean {
  const rule = action.interrupt
  if (!rule) return false
  if (rule.status && hasStatus(state.monsterStatuses, rule.status)) return true
  if (rule.damageRatio && roundDamage >= state.monster.maxHp * rule.damageRatio) return true
  return false
}

/**
 * 중독 피해.
 * 몬스터 차례보다 먼저 처리하므로, 몬스터가 이번 라운드에 새로 건 중독은 다음 라운드부터 아프다.
 */
function applyPoison(state: BattleState, turn: number) {
  const added: BattleLogEntry[] = []
  const steps: BattleStep[] = []
  let next = state

  const playerPoison = statusValue(next.playerStatuses, 'poison')
  if (playerPoison > 0 && next.player.hp > 0) {
    const damage = Math.max(1, Math.round(next.player.maxHp * playerPoison))
    next = { ...next, player: { ...next.player, hp: Math.max(0, next.player.hp - damage) } }
    added.push({ turn, side: 'system', text: `중독 피해 (${damage})`, damage })
    steps.push({ kind: 'status_damage', side: 'player', amount: damage, status: 'poison' })
  }

  const monsterPoison = statusValue(next.monsterStatuses, 'poison')
  if (monsterPoison > 0 && next.monster.hp > 0) {
    const damage = Math.max(1, Math.round(next.monster.maxHp * monsterPoison))
    next = { ...next, monster: { ...next.monster, hp: Math.max(0, next.monster.hp - damage) } }
    added.push({ turn, side: 'system', text: `${next.monsterDef.name}이(가) 중독 피해 (${damage})` })
    steps.push({ kind: 'status_damage', side: 'monster', amount: damage, status: 'poison' })
  }

  return { next, added, steps }
}

/** 쓰러졌으면 부활을 시도하고, 그래도 0이면 패배로 끝낸다 */
function settleDeath(
  state: BattleState,
  turn: number,
  added: BattleLogEntry[],
  steps: BattleStep[],
  options: TurnOptions,
): { next: BattleState; result: TurnResult | null } {
  if (state.player.hp > 0) return { next: state, result: null }

  const revive = tryRevive(state, turn, options.reviveRatio ?? null)
  const next = revive.next
  added.push(...revive.added)
  if (revive.used) steps.push({ kind: 'revive', hp: next.player.hp })
  if (next.player.hp > 0) return { next, result: null }

  const entry: BattleLogEntry = {
    turn,
    side: 'system',
    text: '루미가 쓰러졌다... 다음에 다시 도전하자.',
  }
  return {
    next,
    result: {
      battle: { ...next, status: 'lost', log: [...next.log, ...added, entry] },
      added: [...added, entry],
      steps: [...steps, { kind: 'lose' }],
    },
  }
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

function statusName(id: StatusId): string {
  return STATUS_INFO[id].label
}

/** 승리 보상을 계산한다. 지급 여부는 호출하는 쪽에서 rewardGranted로 관리한다. */
export function calcRewards(monster: FloorMonster, rng: Rng) {
  const materials: Record<string, number> = {}
  if (rng() < monster.materialChance) {
    materials[monster.materialId] = monster.isBoss ? 3 : 1
  }
  return { gold: monster.goldReward, materials }
}
