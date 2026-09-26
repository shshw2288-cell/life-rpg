/**
 * 내 방(거점) 설정.
 *
 * 배치는 격자 방식이다. 위쪽 두 줄은 벽, 아래 두 줄은 바닥이며
 * 가구마다 놓을 수 있는 자리가 정해져 있다.
 *
 * 해금 조건은 전부 '실제로 저장된 기록'만 본다.
 *   - 공부: 과목에 쌓인 회독 수 합계 (subjects[].rounds)
 *   - 운동: 3대 기록 합계와 기록한 종목 수 (workout)
 *   - 모험: 탑에서 실제로 깬 층 (tower.highestCleared)
 * 기록이 남지 않은 과거 활동을 추정해서 주지 않는다.
 */

/**
 * 배치 격자. 위 2줄은 벽(16칸), 아래 3줄은 바닥(24칸)이라
 * 모은 가구를 거의 다 늘어놓을 수 있다.
 */
export const ROOM_GRID = {
  cols: 8,
  rows: 5,
  /** 위에서 이 줄 수만큼이 벽이다 */
  wallRows: 2,
}

export type FurnitureArt =
  | 'desk'
  | 'bed'
  | 'window'
  | 'plant_small'
  | 'sprout_pot'
  | 'bookshelf'
  | 'book_stack'
  | 'star_lamp'
  | 'rug'
  | 'dumbbell'
  | 'medal'
  | 'yoga_mat'
  | 'trophy'
  | 'mushroom_lamp'
  | 'wind_chime'
  | 'star_frame'
  | 'starlight_trophy'
  | 'cushion'

/** 가구를 얻는 조건 */
export type FurnitureUnlock =
  | { kind: 'start' }
  /** 모든 과목의 회독 수 합계 */
  | { kind: 'study_rounds'; value: number }
  /** 3대 기록(벤치·스쿼트·데드리프트) 최고 무게 합계 kg */
  | { kind: 'workout_total'; value: number }
  /** 무게를 올린 종목 수 */
  | { kind: 'workout_exercises'; value: number }
  /** 이 지역의 보스를 처음 잡았을 때 */
  | { kind: 'region_cleared'; regionId: string }
  | { kind: 'level'; value: number }

export interface FurnitureDef {
  id: string
  name: string
  description: string
  /** 차지하는 칸 수 */
  size: { w: number; h: number }
  /** 놓을 수 있는 자리 */
  area: 'wall' | 'floor'
  art: FurnitureArt
  unlock: FurnitureUnlock
}

export const FURNITURE: FurnitureDef[] = [
  // ── 기본 가구 (처음부터) ──────────────────────
  {
    id: 'desk',
    name: '나무 책상',
    description: '루미가 하루를 계획하는 자리.',
    size: { w: 2, h: 1 },
    area: 'floor',
    art: 'desk',
    unlock: { kind: 'start' },
  },
  {
    id: 'bed',
    name: '포근한 침대',
    description: '잘 쉬는 것도 성장의 일부.',
    size: { w: 2, h: 1 },
    area: 'floor',
    art: 'bed',
    unlock: { kind: 'start' },
  },
  {
    id: 'window',
    name: '작은 창문',
    description: '숲이 보이는 창. 아침 햇살이 들어온다.',
    size: { w: 2, h: 1 },
    area: 'wall',
    art: 'window',
    unlock: { kind: 'start' },
  },
  {
    id: 'plant_small',
    name: '작은 화분',
    description: '처음 들여온 초록 친구.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'plant_small',
    unlock: { kind: 'start' },
  },

  // ── 공부 기록 ────────────────────────────────
  {
    id: 'bookshelf',
    name: '책장',
    description: '회독한 만큼 책이 쌓였다.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'bookshelf',
    unlock: { kind: 'study_rounds', value: 10 },
  },
  {
    id: 'book_stack',
    name: '쌓아둔 책',
    description: '다 본 책을 탑처럼 쌓아 두었다.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'book_stack',
    unlock: { kind: 'study_rounds', value: 30 },
  },
  {
    id: 'star_lamp',
    name: '별 스탠드',
    description: '늦게까지 책을 볼 때 켜는 등.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'star_lamp',
    unlock: { kind: 'study_rounds', value: 60 },
  },

  // ── 운동 기록 ────────────────────────────────
  {
    id: 'dumbbell',
    name: '아령 한 쌍',
    description: '3대 기록이 쌓이기 시작했다는 증거.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'dumbbell',
    unlock: { kind: 'workout_total', value: 100 },
  },
  {
    id: 'yoga_mat',
    name: '운동 매트',
    description: '여러 종목을 꾸준히 기록한 사람의 물건.',
    size: { w: 2, h: 1 },
    area: 'floor',
    art: 'yoga_mat',
    unlock: { kind: 'workout_exercises', value: 4 },
  },
  {
    id: 'medal',
    name: '메달 걸이',
    description: '3대 합계 250kg 돌파 기념.',
    size: { w: 1, h: 1 },
    area: 'wall',
    art: 'medal',
    unlock: { kind: 'workout_total', value: 250 },
  },

  // ── 모험 성취 ────────────────────────────────
  {
    id: 'sprout_pot',
    name: '새싹 화분',
    description: '시작의 숲에서 가져온 새싹. 지역 첫 클리어 보상.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'sprout_pot',
    unlock: { kind: 'region_cleared', regionId: 'forest' },
  },
  {
    id: 'trophy_forest',
    name: '미루기 대왕 트로피',
    description: '시작의 숲 보스를 처음 쓰러뜨린 증표.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'trophy',
    unlock: { kind: 'region_cleared', regionId: 'forest' },
  },
  {
    id: 'mushroom_lamp',
    name: '발광 버섯 등',
    description: '버섯 동굴에서 캐온 빛나는 버섯.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'mushroom_lamp',
    unlock: { kind: 'region_cleared', regionId: 'cave' },
  },
  {
    id: 'trophy_cave',
    name: '히드라 트로피',
    description: '버섯 동굴 보스를 처음 쓰러뜨린 증표.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'trophy',
    unlock: { kind: 'region_cleared', regionId: 'cave' },
  },
  {
    id: 'wind_chime',
    name: '바람 풍경',
    description: '절벽의 바람을 담아 온 풍경. 가끔 맑은 소리가 난다.',
    size: { w: 1, h: 1 },
    area: 'wall',
    art: 'wind_chime',
    unlock: { kind: 'region_cleared', regionId: 'cliff' },
  },
  {
    id: 'trophy_cliff',
    name: '돌풍새 트로피',
    description: '바람 절벽 보스를 처음 쓰러뜨린 증표.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'trophy',
    unlock: { kind: 'region_cleared', regionId: 'cliff' },
  },
  {
    id: 'star_frame',
    name: '별자리 액자',
    description: '별빛 유적의 천장을 옮겨 그렸다.',
    size: { w: 2, h: 1 },
    area: 'wall',
    art: 'star_frame',
    unlock: { kind: 'region_cleared', regionId: 'ruins' },
  },
  {
    id: 'starlight_trophy',
    name: '별빛 트로피',
    description: '별빛 유적을 넘어선 자에게만 주어진다. 지역 첫 클리어 보상.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'starlight_trophy',
    unlock: { kind: 'region_cleared', regionId: 'ruins' },
  },

  // ── 성장 ─────────────────────────────────────
  {
    id: 'rug',
    name: '동그란 러그',
    description: '레벨 10을 넘긴 루미에게 주는 선물.',
    size: { w: 2, h: 1 },
    area: 'floor',
    art: 'rug',
    unlock: { kind: 'level', value: 10 },
  },
  {
    id: 'cushion',
    name: '펫 쿠션',
    description: '동행 펫이 좋아하는 자리. 레벨 20 달성.',
    size: { w: 1, h: 1 },
    area: 'floor',
    art: 'cushion',
    unlock: { kind: 'level', value: 20 },
  },
]

export function findFurniture(id: string): FurnitureDef | undefined {
  return FURNITURE.find((item) => item.id === id)
}

/** 처음부터 가지고 있는 가구 */
export const STARTER_FURNITURE = FURNITURE.filter((item) => item.unlock.kind === 'start').map(
  (item) => item.id,
)

/** 새 방을 만들 때의 기본 배치. 빈 방으로 보이지 않게 한다. */
export const DEFAULT_PLACEMENTS = [
  { furnitureId: 'window', x: 2, y: 0 },
  { furnitureId: 'desk', x: 0, y: 2 },
  { furnitureId: 'bed', x: 6, y: 2 },
  { furnitureId: 'plant_small', x: 0, y: 4 },
]
