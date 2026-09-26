import type { GameDate } from '../lib/date'
import type { BattleState, CosmeticLoadout, DungeonDay, TowerProgress } from './battle'
import type { Egg, Pet } from './pet'
import type { Subject } from './study'
import type { WorkoutState } from './workout'
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
  /** 공부 과목 (회독 관리) */
  subjects: Subject[]
  /** 운동 기록 (부위별 종목 무게, 3대 기록) */
  workout: WorkoutState
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
  /** 탑의 열쇠. 과제 완료와 상점 구매로 모으며 날짜가 바뀌어도 사라지지 않는다. */
  towerKeys: number
  /** 다음 열쇠까지 쌓인 과제 완료 수 */
  keyProgress: number
  /** 탑 진행 상황 */
  tower: TowerProgress
  /** 진행 중이거나 방금 끝난 전투. 없으면 null */
  battle: BattleState | null
  /** 소모품 보유 수. 아이템 id -> 개수 */
  inventory: Record<string, number>
  /** 구매한 꾸미기 아이템 */
  ownedCosmetics: string[]
  /** 장착 중인 꾸미기 */
  cosmetics: CosmeticLoadout
  meta: {
    /** 정산을 마친 마지막 게임 날짜 */
    lastSettledDate: GameDate
    createdAt: string
    updatedAt: string
  }
}

/**
 * 2: 던전(materials, dungeonDay, battle) 추가
 * 3: 펫 등급·뽑기(activePetId, petTickets) 추가
 * 4: 탑·상점(tower, towerKeys, inventory, cosmetics) 추가
 * 5: 공부 과목(subjects) 추가
 * 6: 운동 기록(workout) 추가
 * 7: 탑의 열쇠 1개 지급 (한 번만)
 * 8: 입장 제한 폐지 + 열쇠 적립(keyProgress), 100 Gold·열쇠 2개 지급 (한 번만)
 */
export const SCHEMA_VERSION = 8
