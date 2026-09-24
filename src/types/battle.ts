import type { FloorMonster } from '../engine/tower'
import type { GameDate } from '../lib/date'

export type PlayerAction = 'attack' | 'defend' | 'skill'

export type BattleStatus = 'active' | 'won' | 'lost'

export interface CombatStats {
  maxHp: number
  attack: number
  defense: number
  maxMp: number
  critChance: number
}

export interface BattleLogEntry {
  turn: number
  /** 누가 한 행동인지 */
  side: 'player' | 'monster' | 'system'
  text: string
  damage?: number
  crit?: boolean
}

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
}
