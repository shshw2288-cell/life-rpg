export interface MonsterDef {
  id: string
  name: string
  description: string
  hp: number
  attack: number
  defense: number
  /** 승리 보상 */
  goldReward: number
  /** 재료를 떨어뜨릴 확률 */
  materialChance: number
  materialId: string
  /** 외형 색 */
  color: string
  accent: string
}

/**
 * 던전 몬스터 목록. 지금은 1마리만 사용한다.
 * 다음 단계에서 일반 몬스터 3마리 + 보스 1마리로 늘린다.
 */
export const MONSTERS: MonsterDef[] = [
  {
    id: 'moss_slime',
    name: '이끼 슬라임',
    description: '미룬 일들이 뭉쳐 생긴 눅눅한 덩어리.',
    hp: 60,
    attack: 8,
    defense: 3,
    goldReward: 25,
    materialChance: 0.5,
    materialId: 'lumi_shard',
    color: '#4ade80',
    accent: '#15803d',
  },
]

export function findMonster(id: string): MonsterDef | undefined {
  return MONSTERS.find((monster) => monster.id === id)
}
