import type { GameDate } from '../lib/date'

export interface Egg {
  id: string
  /** 부화까지 남은 완료 횟수를 계산하기 위한 진행도 */
  progress: number
  required: number
  obtainedOn: GameDate
}

export interface Pet {
  id: string
  speciesId: string
  nickname?: string
  hatchedOn: GameDate
}
