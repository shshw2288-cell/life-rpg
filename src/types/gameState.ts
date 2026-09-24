import type { GameDate } from '../lib/date'
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
  meta: {
    /** 정산을 마친 마지막 게임 날짜 */
    lastSettledDate: GameDate
    createdAt: string
    updatedAt: string
  }
}

export const SCHEMA_VERSION = 1
