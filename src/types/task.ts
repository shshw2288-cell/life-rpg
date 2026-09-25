import type { Difficulty } from '../data/gameConfig'
import type { GameDate } from '../lib/date'

export type TaskType = 'habit' | 'daily' | 'todo'

/** 운동처럼 수치를 남기고 싶은 과제에 붙인다. 완료할 때 값을 입력받는다. */
export interface TaskMetric {
  /** 단위. 예: '분', '회', 'km', '페이지' */
  unit: string
  /** 목표치 (선택) */
  target?: number
}

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
  /** 있으면 완료 시 수치를 입력받아 기록에 남긴다. */
  metric?: TaskMetric
  /** 공부 과목에 묶인 할 일이면 그 과목 id */
  subjectId?: string
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
  /** study_round는 taskId 자리에 과목 id가 들어간다 */
  action: 'complete' | 'habit_positive' | 'habit_negative' | 'miss_penalty' | 'study_round'
  localDate: GameDate
  timestamp: string
  expDelta: number
  goldDelta: number
  hpDelta: number
  /** 운동 기록 등 수치 (과제에 metric이 있을 때만) */
  metricValue?: number
  /** 기록 당시의 단위. 과제를 나중에 수정해도 과거 기록이 흔들리지 않게 복사해둔다. */
  metricUnit?: string
}
