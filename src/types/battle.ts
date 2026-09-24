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
}

/**
 * 진행 중이거나 끝난 전투 한 판.
 * 저장소에 그대로 남으므로 새로고침해도 이어서 하거나 결과를 다시 볼 수 있다.
 */
export interface BattleState {
  id: string
  monsterId: string
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
  log: BattleLogEntry[]
  /** 승리 보상을 이미 지급했는지. 중복 지급을 막는 유일한 기준. */
  rewardGranted: boolean
  rewards?: BattleRewards
}

/** 게임 날짜별 던전 입장 현황 */
export interface DungeonDay {
  date: GameDate
  entriesUsed: number
}
