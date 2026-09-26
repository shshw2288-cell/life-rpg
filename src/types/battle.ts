import type { FloorMonster } from '../engine/tower'
import type { GameDate } from '../lib/date'
import type { PetRole } from './pet'

/**
 * 플레이어가 한 턴에 고르는 행동.
 * 공격과 방어는 언제나 쓸 수 있고, 스킬은 장착한 것만 쓸 수 있다.
 */
export type PlayerAction = 'attack' | 'defend' | { kind: 'skill'; skillId: string }

export type BattleStatus = 'active' | 'won' | 'lost'

export interface CombatStats {
  maxHp: number
  attack: number
  defense: number
  maxMp: number
  critChance: number
}

/**
 * 전투 중 붙는 상태.
 *
 * 적용 시점을 한 곳에 모아 둔다.
 *   shield     (내 쪽) 받는 피해를 value 비율만큼 줄인다
 *   focus      (내 쪽) 다음 공격 피해를 value 비율만큼 올리고 쓰면 사라진다
 *   poison     (양쪽)  라운드 끝에 value 만큼 피해
 *   weaken     (적)    다음 공격 피해를 value 비율만큼 줄이고, 회복 저지 조건이 된다
 *   vulnerable (적)    받는 피해가 value 비율만큼 늘어난다
 *   guard      (적)    받는 피해가 value 비율만큼 줄어든다
 */
export type StatusId = 'shield' | 'focus' | 'poison' | 'weaken' | 'vulnerable' | 'guard'

export interface StatusEffect {
  id: StatusId
  /** 남은 턴. 라운드 끝에 1씩 줄고 0이 되면 사라진다. */
  turns: number
  /** 효과 크기. 뜻은 상태마다 다르다. */
  value: number
}

/** 보스가 턴마다 하는 행동. 전부 데이터로 정의한다. */
export interface BossAction {
  id: string
  /** 로그에 남길 행동 이름 */
  label: string
  /** 플레이어가 행동을 고르기 전에 보는 예고 */
  intent: string
  /** 대응 힌트 */
  hint?: string
  kind: 'attack' | 'heavy' | 'charge' | 'heal' | 'heal_prep' | 'guard' | 'rest'
  /** 피해 배율 (attack/heavy) */
  power?: number
  /** 플레이어에게 거는 상태 */
  inflict?: StatusEffect
  /** 자신에게 거는 상태 */
  selfStatus?: StatusEffect
  /** heal일 때 회복하는 최대 HP 비율 */
  healRatio?: number
  /**
   * 이 행동을 막을 수 있는 조건.
   * 플레이어 차례가 먼저 오므로, 그 턴에 준 피해와 적에게 건 상태로 판정한다.
   */
  interrupt?: {
    /** 이 비율 이상(최대 HP 대비)의 피해를 주면 막는다 */
    damageRatio?: number
    /** 적에게 이 상태가 걸려 있으면 막는다 */
    status?: StatusId
    note: string
  }
}

/** 몬스터가 다음 턴에 할 행동 예고 */
export interface BossIntent {
  actionId: string
  label: string
  intent: string
  hint?: string
  kind: BossAction['kind']
  /** 강공격 계열이면 경고 색을 쓴다 */
  dangerous: boolean
}

/** 이번 전투에 가져온 스킬 한 칸 */
export interface BattleSkillState {
  id: string
  /** 남은 대기 턴 */
  cooldown: number
  /** 남은 사용 횟수. 제한이 없으면 null */
  usesLeft: number | null
}

/** 이번 전투에 동행한 펫 */
export interface BattlePetState {
  speciesId: string
  name: string
  role: PetRole
  abilityName: string
  /** 역할별 효과 크기 (뜻은 역할마다 다르다) */
  value: number
  /** 몇 턴마다 발동하는지 (회복형·지원형) */
  interval: number
  /** 남은 대기 턴 */
  cooldown: number
  /** 이번 전투에서 남은 발동 횟수 */
  usesLeft: number
  /** 지원형이 상태이상을 풀어줄 수 있는 남은 횟수 */
  cleanseLeft: number
}

export interface BattleLogEntry {
  turn: number
  /** 누가 한 행동인지 */
  side: 'player' | 'monster' | 'pet' | 'system'
  text: string
  damage?: number
  crit?: boolean
}

/**
 * 연출용 단계. 전투 계산 결과를 순서대로 재생하기 위한 것이며 저장하지 않는다.
 * 로그 문장을 해석하지 않고 이 구조를 써서 애니메이션을 결정한다.
 */
export type BattleStep =
  | { kind: 'player_attack'; damage: number; crit: boolean }
  | { kind: 'player_skill'; skillId: string; name: string; damage: number; crit: boolean }
  | { kind: 'player_heal'; name: string; amount: number }
  | { kind: 'player_buff'; name: string; status: StatusId }
  | { kind: 'enemy_debuff'; name: string; status: StatusId }
  | { kind: 'player_defend' }
  | { kind: 'player_item'; heal?: number; mana?: number; name: string }
  | { kind: 'pet_attack'; name: string; damage: number }
  | { kind: 'pet_heal'; name: string; amount: number }
  | { kind: 'pet_guard'; name: string; reduced: number }
  | { kind: 'pet_support'; name: string; mana?: number; cleansed?: StatusId }
  | { kind: 'monster_attack'; damage: number }
  | { kind: 'monster_heavy'; damage: number }
  | { kind: 'monster_charge' }
  | { kind: 'monster_prep'; what: string }
  | { kind: 'monster_heal'; amount: number }
  | { kind: 'monster_guard' }
  | { kind: 'monster_rest' }
  | { kind: 'monster_interrupted'; what: string }
  | { kind: 'status_damage'; side: 'player' | 'monster'; amount: number; status: StatusId }
  | { kind: 'revive'; hp: number }
  | { kind: 'win' }
  | { kind: 'lose' }

export interface BattleRewards {
  gold: number
  materials: Record<string, number>
  /** 보스 첫 격파 보너스 */
  firstClearBonus?: number
}

/**
 * 진행 중이거나 끝난 전투 한 판.
 * 저장소에 그대로 남으므로 새로고침해도 이어서 하거나 결과를 다시 볼 수 있다.
 */
export interface BattleState {
  id: string
  /** 도전 중인 탑의 층 */
  floor: number
  /** 몬스터 정보를 통째로 담아둔다. 층마다 만들어지는 값이라 id 조회로는 복원할 수 없다. */
  monsterDef: FloorMonster
  startedOn: GameDate
  turn: number
  status: BattleStatus
  /** 전투 전용 HP/MP. 캐릭터의 생활 HP와 별개다. */
  player: { hp: number; maxHp: number; mp: number; maxMp: number }
  playerStats: CombatStats
  monster: { hp: number; maxHp: number }
  /** 이번 턴에 방어를 선택했는지 */
  defending: boolean
  /** 몬스터가 다음 턴에 강공격을 하는지 */
  monsterCharging: boolean
  /** 보스 행동 패턴에서 다음에 쓸 위치 */
  patternIndex: number
  /** 몬스터가 다음 턴에 할 행동 예고 */
  intent: BossIntent | null
  playerStatuses: StatusEffect[]
  monsterStatuses: StatusEffect[]
  /** 전투 시작 때 확정된 스킬 구성. 전투 중에는 바꿀 수 없다. */
  skills: BattleSkillState[]
  /** 전투 시작 때 확정된 동행 펫. 전투 중에는 바꿀 수 없다. */
  pet: BattlePetState | null
  log: BattleLogEntry[]
  /** 승리 보상을 이미 지급했는지. 중복 지급을 막는 유일한 기준. */
  rewardGranted: boolean
  rewards?: BattleRewards
  /** 부활의 부적을 이미 썼는지 */
  revivedOnce: boolean
}

/** 게임 날짜별 던전 입장 현황 */
export interface DungeonDay {
  date: GameDate
  entriesUsed: number
}

/** 탑 진행 상황 */
export interface TowerProgress {
  /** 지금까지 깬 가장 높은 층 */
  highestCleared: number
  /** 마지막으로 도전한 층 */
  lastFloor: number
}

/** 캐릭터 꾸미기 장착 상태 */
export interface CosmeticLoadout {
  hat: string | null
  face: string | null
  aura: string | null
  /** 망토 (지역 보상으로 얻는다) */
  cape: string | null
}
