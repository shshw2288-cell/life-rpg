import type { GameDate } from '../lib/date'
import type { BattleState, DungeonDay } from './battle'
import type { Egg, Pet } from './pet'
import type { Task, TaskEvent } from './task'

export interface Character {
  level: number
  /** 현재 레벨에서 쌓은 EXP */
  exp: number
  hp: number
  maxHp: number
  gold: number
}

/** 하루치 정산 기록. 같은 날짜가 여기 있으면 다시 정산하지 않는다. */
export interface DailySettlement {
  date: GameDate
  settledAt: string
  entries: { taskId: string; hpDelta: number }[]
  /** 하루 피해 상한에 걸려 줄어든 양 */
  cappedBy: number
}

export interface GameState {
  schemaVersion: number
  character: Character
  tasks: Task[]
  events: TaskEvent[]
  settlements: DailySettlement[]
  eggs: Egg[]
  pets: Pet[]
  /** 동행 펫의 종 id. 이 펫의 효과만 적용된다. */
  activePetId: string | null
  /** 펫 뽑기권 */
  petTickets: number
  /** 던전 보상으로 얻는 제작 재료. 재료 id -> 개수 */
  materials: Record<string, number>
  /** 오늘의 던전 입장 현황 */
  dungeonDay: DungeonDay
  /** 진행 중이거나 방금 끝난 전투. 없으면 null */
  battle: BattleState | null
  meta: {
    /** 정산을 마친 마지막 게임 날짜 */
    lastSettledDate: GameDate
    createdAt: string
    updatedAt: string
  }
}

/** 2: 던전(materials, dungeonDay, battle) 추가 / 3: 펫 등급·뽑기(activePetId, petTickets) 추가 */
export const SCHEMA_VERSION = 3
