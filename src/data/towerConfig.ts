/**
 * 탑(던전) 설정.
 * 층이 올라갈수록 몬스터가 강해지고, 10층마다 보스가 나온다.
 * 몬스터를 층마다 일일이 정의하지 않고 템플릿 + 층 배율로 만든다.
 */

export const BOSS_INTERVAL = 10

/** 층에 따른 몬스터 수치 */
export const FLOOR_SCALING = {
  hp: { base: 45, perFloor: 16 },
  attack: { base: 7, perFloor: 1.7 },
  defense: { base: 2, perFloor: 0.7 },
  gold: { base: 18, perFloor: 6 },
  /** 재료 드롭 확률 (층이 올라가도 그대로) */
  materialChance: 0.45,
}

/** 보스 배율 */
export const BOSS_SCALING = {
  hp: 2.4,
  attack: 1.35,
  defense: 1.5,
  gold: 3.5,
  /** 보스는 재료를 확정 지급한다 */
  materialChance: 1,
  /** 보스를 처음 잡으면 주는 추가 Gold */
  firstClearBonus: 150,
}

export interface MonsterTemplate {
  name: string
  description: string
  color: string
  accent: string
}

/** 일반 몬스터 템플릿. 층마다 순환하며 사용한다. */
export const NORMAL_TEMPLATES: MonsterTemplate[] = [
  { name: '이끼 슬라임', description: '미룬 일들이 뭉쳐 생긴 눅눅한 덩어리.', color: '#4ade80', accent: '#15803d' },
  { name: '먼지 뭉치', description: '치우지 않은 방 구석에서 자라났다.', color: '#a8a29e', accent: '#57534e' },
  { name: '늦잠 박쥐', description: '알람을 삼켜버린 밤의 방해꾼.', color: '#818cf8', accent: '#3730a3' },
  { name: '군것질 젤리', description: '달콤한 유혹이 굳어 생긴 몬스터.', color: '#f9a8d4', accent: '#be185d' },
  { name: '무기력 해파리', description: '닿으면 의욕이 빠져나간다.', color: '#67e8f9', accent: '#0e7490' },
  { name: '변명 거미', description: '핑계로 거미줄을 친다.', color: '#fdba74', accent: '#9a3412' },
  { name: '스크롤 벌레', description: '끝없이 화면을 내리게 만든다.', color: '#c4b5fd', accent: '#6d28d9' },
  { name: '한숨 유령', description: '지나가면 어깨가 무거워진다.', color: '#cbd5e1', accent: '#475569' },
]

/** 보스가 턴마다 하는 행동. charge는 예고, heavy는 강타, heal은 회복. */
export type BossMove = 'attack' | 'charge' | 'heavy' | 'heal'

export interface BossTemplate {
  name: string
  description: string
  color: string
  accent: string
  /** 순서대로 반복하는 행동 패턴 */
  pattern: BossMove[]
  /** heal 행동으로 회복하는 최대 HP 비율 */
  healRatio: number
}

/** 보스 템플릿. 10층마다 순환하며 사용한다. */
export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    name: '미루기 대왕',
    description: '"내일 하면 되잖아." 탑의 첫 번째 관문.',
    color: '#a78bfa',
    accent: '#5b21b6',
    pattern: ['attack', 'charge', 'heavy', 'attack'],
    healRatio: 0,
  },
  {
    name: '무한 스크롤 히드라',
    description: '머리를 하나 자르면 피드가 하나 더 늘어난다.',
    color: '#34d399',
    accent: '#065f46',
    pattern: ['attack', 'attack', 'heal', 'charge', 'heavy'],
    healRatio: 0.08,
  },
  {
    name: '새벽 세 시의 야식마',
    description: '고소한 냄새로 판단력을 흐린다.',
    color: '#fb923c',
    accent: '#7c2d12',
    pattern: ['charge', 'heavy', 'attack', 'heal'],
    healRatio: 0.06,
  },
  {
    name: '완벽주의 골렘',
    description: '시작조차 못 하게 만드는 거대한 벽.',
    color: '#94a3b8',
    accent: '#1e293b',
    pattern: ['attack', 'charge', 'heavy', 'charge', 'heavy'],
    healRatio: 0,
  },
  {
    name: '번아웃 드래곤',
    description: '탑 꼭대기에서 모든 것을 태워버린 용.',
    color: '#f87171',
    accent: '#7f1d1d',
    pattern: ['heavy', 'attack', 'heal', 'charge', 'heavy'],
    healRatio: 0.1,
  },
]
