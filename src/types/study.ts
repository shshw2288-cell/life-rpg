import type { Difficulty } from '../data/gameConfig'
import type { GameDate } from '../lib/date'

/** 공부 과목. 회독할 때마다 +버튼으로 횟수를 올린다. */
export interface Subject {
  id: string
  name: string
  /** 교재나 범위 메모 */
  note?: string
  /** 한 회독의 무게. 보상 크기를 정한다. */
  difficulty: Difficulty
  /** 목표 회독 수 (선택) */
  targetRounds?: number
  /** 지금까지의 총 회독 수 */
  rounds: number
  color: string
  createdOn: GameDate
  createdAt: string
  updatedAt: string
  archivedAt?: string
}
