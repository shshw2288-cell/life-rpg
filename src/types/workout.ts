/** 운동 부위 */
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders'

/** 3대 운동 */
export type BigThreeLift = 'bench' | 'squat' | 'deadlift'

export interface WorkoutExercise {
  id: string
  group: MuscleGroup
  name: string
  /** 현재 무게 (kg) */
  weight: number
  /** 지금까지의 최고 무게 */
  best: number
  /** 마지막으로 바꾼 게임 날짜 */
  updatedOn: string
  createdAt: string
  archivedAt?: string
}

export interface WorkoutState {
  /** 3대 운동 현재 무게 */
  bigThree: Record<BigThreeLift, number>
  /** 3대 운동 최고 무게 */
  bigThreeBest: Record<BigThreeLift, number>
  exercises: WorkoutExercise[]
}

export const EMPTY_WORKOUT: WorkoutState = {
  bigThree: { bench: 0, squat: 0, deadlift: 0 },
  bigThreeBest: { bench: 0, squat: 0, deadlift: 0 },
  exercises: [],
}
