/** 펫 시스템 설정. 알을 얻고, 과제를 완료하며 부화시킨다. */

export const PET_RULES = {
  /** 과제 완료 1회당 알이 나올 확률 */
  eggDropChance: 0.12,
  /** 알 하나를 부화시키는 데 필요한 완료 횟수 */
  hatchRequirement: 10,
  /** 동시에 품을 수 있는 알 개수 */
  maxEggs: 3,
}

export interface PetSpecies {
  id: string
  name: string
  description: string
  /** 외형 색 */
  color: string
  accent: string
  /** 등장 가중치 */
  weight: number
}

export const PET_SPECIES: PetSpecies[] = [
  {
    id: 'mochi',
    name: '모찌',
    description: '동글동글한 초록 친구. 곁에 있으면 마음이 편안해진다.',
    color: '#86efac',
    accent: '#16a34a',
    weight: 40,
  },
  {
    id: 'ember',
    name: '잉걸',
    description: '작은 불씨 친구. 미루고 싶을 때 등을 떠민다.',
    color: '#fdba74',
    accent: '#ea580c',
    weight: 30,
  },
  {
    id: 'tide',
    name: '물결',
    description: '느긋한 물빛 친구. 쉬어가는 법을 알려준다.',
    color: '#7dd3fc',
    accent: '#0284c7',
    weight: 20,
  },
  {
    id: 'nova',
    name: '노바',
    description: '별에서 떨어진 희귀한 친구. 좀처럼 만나기 어렵다.',
    color: '#d8b4fe',
    accent: '#9333ea',
    weight: 10,
  },
]
