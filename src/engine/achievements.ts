import { findRegion } from '../data/regionConfig'
import { FURNITURE, type FurnitureDef, type FurnitureUnlock } from '../data/roomConfig'
import type { TowerProgress } from '../types/battle'
import type { Subject } from '../types/study'
import type { WorkoutState } from '../types/workout'
import { isRegionCleared } from './regions'

/**
 * 성취 집계와 가구 해금.
 *
 * 판정 근거는 '실제로 저장되어 있는 값'만 쓴다.
 *   회독   subjects[].rounds 합계 (기록이 지워지지 않는 누적값)
 *   운동   3대 최고 기록 합계와 무게를 올린 종목 수
 *   모험   tower.highestCleared
 * 이벤트 로그는 오래되면 잘려 나가므로 집계에 쓰지 않는다.
 * 같은 기록이 두 번 세어지지 않고, 이미 가진 가구는 다시 지급되지 않는다.
 */

export interface AchievementSource {
  subjects: Subject[]
  workout: WorkoutState
  tower: TowerProgress
  character: { level: number }
}

export function studyRoundsTotal(subjects: Subject[]): number {
  return subjects.reduce((sum, subject) => sum + Math.max(0, subject.rounds), 0)
}

export function workoutTotalKg(workout: WorkoutState): number {
  return Object.values(workout.bigThreeBest).reduce((sum, weight) => sum + Math.max(0, weight), 0)
}

export function workoutExerciseCount(workout: WorkoutState): number {
  return workout.exercises.filter((exercise) => !exercise.archivedAt && exercise.best > 0).length
}

/** 조건 하나의 현재값과 목표값 */
export function measure(
  unlock: FurnitureUnlock,
  source: AchievementSource,
): { current: number; target: number; done: boolean; label: string } {
  switch (unlock.kind) {
    case 'start':
      return { current: 1, target: 1, done: true, label: '처음부터 가지고 있음' }
    case 'study_rounds': {
      const current = studyRoundsTotal(source.subjects)
      return {
        current,
        target: unlock.value,
        done: current >= unlock.value,
        label: `공부 누적 ${unlock.value}회독`,
      }
    }
    case 'workout_total': {
      const current = workoutTotalKg(source.workout)
      return {
        current,
        target: unlock.value,
        done: current >= unlock.value,
        label: `3대 기록 합계 ${unlock.value}kg`,
      }
    }
    case 'workout_exercises': {
      const current = workoutExerciseCount(source.workout)
      return {
        current,
        target: unlock.value,
        done: current >= unlock.value,
        label: `운동 종목 ${unlock.value}개 기록`,
      }
    }
    case 'region_cleared': {
      const done = isRegionCleared(unlock.regionId, source.tower.highestCleared)
      return {
        current: done ? 1 : 0,
        target: 1,
        done,
        label: `${findRegion(unlock.regionId)?.name ?? unlock.regionId} 보스 격파`,
      }
    }
    case 'level': {
      const current = source.character.level
      return {
        current,
        target: unlock.value,
        done: current >= unlock.value,
        label: `레벨 ${unlock.value} 달성`,
      }
    }
  }
}

export interface FurnitureProgress {
  def: FurnitureDef
  /** 조건을 채웠는가 */
  achieved: boolean
  current: number
  target: number
  label: string
}

export function furnitureProgress(source: AchievementSource): FurnitureProgress[] {
  return FURNITURE.map((def) => {
    const { current, target, done, label } = measure(def.unlock, source)
    return { def, achieved: done, current, target, label }
  })
}

/** 조건을 채운 가구 id 전부 */
export function achievedFurnitureIds(source: AchievementSource): string[] {
  return furnitureProgress(source)
    .filter((entry) => entry.achieved)
    .map((entry) => entry.def.id)
}

/** 아직 가지고 있지 않은데 조건을 채운 가구 (이번에 새로 줄 것) */
export function newlyAchievedFurniture(
  source: AchievementSource,
  owned: string[],
): FurnitureDef[] {
  const have = new Set(owned)
  return furnitureProgress(source)
    .filter((entry) => entry.achieved && !have.has(entry.def.id))
    .map((entry) => entry.def)
}
