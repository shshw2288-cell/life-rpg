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

/**
 * 전투에서 맡는 역할.
 * 등급이 높다고 모든 상황에서 좋아지지 않도록 역할마다 발동 조건을 다르게 둔다.
 */
export type PetRole = 'healer' | 'guard' | 'striker' | 'support'
