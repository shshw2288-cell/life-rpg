import type { BigThreeLift, MuscleGroup } from '../types/workout'

/** 무게를 올리고 내리는 단위 (kg) */
export const WEIGHT_STEP = 5

/** 무게 상한. 잘못 눌러 터무니없는 값이 들어가는 걸 막는다. */
export const MAX_WEIGHT = 500

export const GROUPS: {
  id: MuscleGroup
  name: string
  description: string
  color: string
  /** 추천 종목. 버튼 한 번으로 추가한다. */
  presets: string[]
}[] = [
  {
    id: 'chest',
    name: '가슴',
    description: '벤치프레스 · 딥스 · 플라이',
    color: '#f87171',
    presets: ['벤치프레스', '인클라인 벤치', '덤벨 플라이', '딥스', '체스트 프레스'],
  },
  {
    id: 'back',
    name: '등',
    description: '데드리프트 · 풀업 · 로우',
    color: '#60a5fa',
    presets: ['데드리프트', '풀업', '바벨 로우', '랫 풀다운', '시티드 로우'],
  },
  {
    id: 'legs',
    name: '하체',
    description: '스쿼트 · 런지 · 레그프레스',
    color: '#4ade80',
    presets: ['스쿼트', '레그프레스', '루마니안 데드', '런지', '레그 익스텐션'],
  },
  {
    id: 'shoulders',
    name: '어깨',
    description: '오버헤드프레스 · 레터럴 레이즈',
    color: '#fbbf24',
    presets: ['오버헤드 프레스', '사이드 레터럴', '프론트 레이즈', '리어 델트', '슈러그'],
  },
]

export function findGroup(id: MuscleGroup) {
  return GROUPS.find((group) => group.id === id)!
}

export const BIG_THREE: { id: BigThreeLift; name: string; group: MuscleGroup; color: string }[] = [
  { id: 'bench', name: '벤치프레스', group: 'chest', color: '#f87171' },
  { id: 'squat', name: '스쿼트', group: 'legs', color: '#4ade80' },
  { id: 'deadlift', name: '데드리프트', group: 'back', color: '#60a5fa' },
]
