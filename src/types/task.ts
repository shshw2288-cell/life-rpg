import type { Difficulty } from '../data/gameConfig'
import type { GameDate } from '../lib/date'

export type TaskType = 'habit' | 'daily' | 'todo'

interface TaskBase {
  id: string
  title: string
  description?: string
  difficulty: Difficulty
  createdAt: string
  updatedAt: string
  /** 소프트 삭제. 기록에 남은 과거 이벤트를 지키기 위해 실제 삭제하지 않는다. */
  archivedAt?: string
  /** 생성된 게임 날짜. 이 날짜 이전은 정산 대상이 아니다. */
  createdOn: GameDate
}

export interface HabitTask extends TaskBase {
  type: 'habit'
  /** 기록 버튼 노출 방식 */
  polarity: 'positive' | 'negative' | 'both'
}

export interface DailyTask extends TaskBase {
  type: 'daily'
  /** 수행 요일. 0=일 ... 6=토. 비어 있으면 매일. */
  repeatDays: number[]
}

export interface TodoTask extends TaskBase {
  type: 'todo'
  dueDate?: GameDate
  /** 완료한 게임 날짜. 없으면 미완료. */
  completedOn?: GameDate
}

export type Task = HabitTask | DailyTask | TodoTask

/**
 * 과제 수행 기록. 완료 여부의 판단 근거는 과제의 boolean이 아니라 이 이벤트 목록이다.
 * localDate에는 반드시 getGameDate()로 구한 게임 날짜를 넣는다.
 */
export interface TaskEvent {
  id: string
  taskId: string
  action: 'complete' | 'habit_positive' | 'habit_negative' | 'miss_penalty'
  localDate: GameDate
  timestamp: string
  expDelta: number
  goldDelta: number
  hpDelta: number
}
