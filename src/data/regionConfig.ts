/**
 * 지역 탐험 설정.
 *
 * 중요: 지역은 탑의 층 위에 얹은 '묶음'일 뿐이며 진행도를 따로 저장하지 않는다.
 * 어디까지 갔는지는 언제나 tower.highestCleared 하나로 판단한다.
 * 그래서 이 기능이 생기기 전부터 탑을 오르던 저장 데이터도 그대로 인정된다.
 */

export type RegionTheme = 'forest' | 'cave' | 'cliff' | 'ruins' | 'endless'

/** 지역을 처음 깼을 때 한 번만 주는 대표 보상 */
export interface RegionReward {
  kind: 'furniture' | 'pet' | 'cosmetic'
  id: string
  name: string
  note: string
}

export interface RegionDef {
  id: string
  name: string
  theme: RegionTheme
  tagline: string
  description: string
  /** 배경에 무엇이 보이는지 */
  scenery: string
  /** 이 지역에서 익히는 대응 방법 */
  lesson: string
  /** 이 지역이 차지하는 탑의 층 (to가 null이면 끝이 없다) */
  floors: { from: number; to: number | null }
  /** 지역의 관문 보스가 있는 층. null이면 보스가 없다(무한의 탑). */
  bossFloor: number | null
  recommendedLevel: number
  /** 일반 전투의 특징. 지역마다 다른 대응을 요구한다. */
  normalTrait: {
    /** 강공격을 예고하는 간격(턴). 없으면 기본 간격 */
    heavyInterval?: number
    /** 일반 공격이 중독을 걸 확률 */
    poisonChance?: number
    note: string
  }
  firstClearReward: RegionReward | null
  /** 다시 도전했을 때 얻는 것 */
  repeatReward: string
  /** 먼저 깨야 하는 지역. null이면 처음부터 열려 있다. */
  requires: string | null
}

export const REGIONS: RegionDef[] = [
  {
    id: 'forest',
    name: '시작의 숲',
    theme: 'forest',
    tagline: '햇빛이 드는 풀밭과 작은 유적',
    description:
      '햇살이 내려앉은 풀밭에 오래된 돌기둥이 서 있다. 처음 모험을 배우기에 알맞은 곳.',
    scenery: '햇빛 · 풀밭 · 작은 유적',
    lesson: '공격과 방어의 기본. 강공격 예고가 뜨면 방어한다.',
    floors: { from: 1, to: 10 },
    bossFloor: 10,
    recommendedLevel: 1,
    normalTrait: { note: '평범한 몬스터가 나옵니다. 3턴마다 강공격을 예고합니다.' },
    firstClearReward: {
      kind: 'furniture',
      id: 'sprout_pot',
      name: '새싹 화분',
      note: '내 방에 놓을 수 있는 첫 장식',
    },
    repeatReward: 'Gold와 루미 조각',
    requires: null,
  },
  {
    id: 'cave',
    name: '버섯 동굴',
    theme: 'cave',
    tagline: '발광 버섯이 밝히는 지하 호수',
    description:
      '푸른 버섯이 빛나는 동굴. 공기 중에 포자가 떠다녀 오래 있으면 몸이 무거워진다.',
    scenery: '발광 버섯 · 바위 · 지하 호수',
    lesson: '중독을 버티고, 적의 회복을 저지한다.',
    floors: { from: 11, to: 20 },
    bossFloor: 20,
    recommendedLevel: 8,
    normalTrait: {
      poisonChance: 0.28,
      note: '몬스터의 공격이 가끔 중독을 겁니다. 지원형 펫이 풀어줄 수 있습니다.',
    },
    firstClearReward: {
      kind: 'pet',
      id: 'spore_cap',
      name: '포자모자',
      note: '뽑기 없이 확정으로 합류하는 버섯 펫 (회복형)',
    },
    repeatReward: 'Gold와 루미 조각',
    requires: 'forest',
  },
  {
    id: 'cliff',
    name: '바람 절벽',
    theme: 'cliff',
    tagline: '구름 위에 떠 있는 바위섬',
    description: '발밑으로 구름이 흐르는 절벽. 돌들이 공중에 떠 있고 바람이 거세다.',
    scenery: '구름 · 절벽 · 떠 있는 돌',
    lesson: '강공격 예고를 읽고, 적이 지친 틈을 노린다.',
    floors: { from: 21, to: 30 },
    bossFloor: 30,
    recommendedLevel: 16,
    normalTrait: {
      heavyInterval: 2,
      note: '바람이 거세 몬스터가 2턴마다 강공격을 예고합니다.',
    },
    firstClearReward: {
      kind: 'cosmetic',
      id: 'wind_cloak',
      name: '바람 망토',
      note: '루미가 두르는 망토 (꾸미기 · 망토 칸)',
    },
    repeatReward: 'Gold와 루미 조각',
    requires: 'cave',
  },
  {
    id: 'ruins',
    name: '별빛 유적',
    theme: 'ruins',
    tagline: '별자리를 새긴 고대 장치',
    description:
      '별빛을 모으는 고대 장치가 아직도 돌아가는 유적. 지금까지 배운 모든 것이 필요하다.',
    scenery: '별자리 · 고대 장치 · 빛나는 석조 구조물',
    lesson: '보호막과 약점 노출을 읽고 스킬을 조합한다.',
    floors: { from: 31, to: 40 },
    bossFloor: 40,
    recommendedLevel: 24,
    normalTrait: {
      heavyInterval: 2,
      poisonChance: 0.18,
      note: '앞선 지역의 특징이 섞여 나옵니다. 강공격도 중독도 대비하세요.',
    },
    firstClearReward: {
      kind: 'furniture',
      id: 'starlight_trophy',
      name: '별빛 트로피',
      note: '거점 중앙에 놓는 최고의 증표',
    },
    repeatReward: 'Gold와 루미 조각',
    requires: 'cliff',
  },
  {
    id: 'endless',
    name: '무한의 탑',
    theme: 'endless',
    tagline: '유적 너머로 계속 이어지는 계단',
    description: '별빛 유적을 지나면 탑은 끝없이 이어진다. 10층마다 새 보스가 기다린다.',
    scenery: '끝없는 계단 · 흔들리는 별빛',
    lesson: '지금까지 배운 모든 대응을 반복해서 다듬는다.',
    floors: { from: 41, to: null },
    bossFloor: null,
    recommendedLevel: 32,
    normalTrait: { note: '층이 오를수록 강해집니다. 10층마다 보스가 나옵니다.' },
    firstClearReward: null,
    repeatReward: '가장 많은 Gold와 루미 조각',
    requires: 'ruins',
  },
]

export function findRegion(id: string): RegionDef | undefined {
  return REGIONS.find((region) => region.id === id)
}

/** 보스가 있는 지역만 (무한의 탑 제외) */
export const GATED_REGIONS = REGIONS.filter((region) => region.bossFloor !== null)
