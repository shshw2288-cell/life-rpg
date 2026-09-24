/**
 * 캐릭터 '루미(Lumi)'의 진화 단계.
 * 외형은 SVG로 직접 그리며, 단계별 색과 형태 값을 여기서 관리한다.
 */

export interface EvolutionStage {
  id: string
  name: string
  minLevel: number
  /** 진화 시 안내 문구 */
  description: string
  /** 이 단계에서 새로 생기는 특징 */
  traits: string[]
  palette: {
    body: string
    bodyDark: string
    glow: string
    antenna: string
  }
  /** 외형 파라미터 */
  form: {
    /** 몸 크기 배율 */
    scale: number
    /** 더듬이 개수 */
    antennae: number
    /** 뒤쪽 후광 */
    aura: boolean
    /** 별 장식 개수 */
    sparkles: number
    /** 볼 홍조 */
    blush: boolean
  }
}

export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    id: 'spore',
    name: '씨앗 루미',
    minLevel: 1,
    description: '막 깨어난 작은 루미. 아직 더듬이 하나로 세상을 살핀다.',
    traits: ['작고 말랑한 몸', '더듬이 1개'],
    palette: { body: '#a3e635', bodyDark: '#65a30d', glow: '#d9f99d', antenna: '#bef264' },
    form: { scale: 0.78, antennae: 1, aura: false, sparkles: 0, blush: true },
  },
  {
    id: 'sprout',
    name: '새싹 루미',
    minLevel: 5,
    description: '꾸준함이 쌓여 더듬이가 하나 더 돋았다.',
    traits: ['더듬이 2개', '몸집 성장'],
    palette: { body: '#86efac', bodyDark: '#16a34a', glow: '#bbf7d0', antenna: '#4ade80' },
    form: { scale: 0.9, antennae: 2, aura: false, sparkles: 1, blush: true },
  },
  {
    id: 'explorer',
    name: '탐험가 루미',
    minLevel: 10,
    description: '몸에서 은은한 빛이 돌기 시작했다. 먼 곳을 보려 한다.',
    traits: ['발광하는 몸', '주변에 빛 입자'],
    palette: { body: '#5eead4', bodyDark: '#0d9488', glow: '#99f6e4', antenna: '#2dd4bf' },
    form: { scale: 1, antennae: 2, aura: true, sparkles: 3, blush: false },
  },
  {
    id: 'guardian',
    name: '수호자 루미',
    minLevel: 20,
    description: '단단해진 습관이 루미를 감싸는 보호막이 되었다.',
    traits: ['더듬이 3개', '넓은 후광'],
    palette: { body: '#60a5fa', bodyDark: '#1d4ed8', glow: '#bfdbfe', antenna: '#93c5fd' },
    form: { scale: 1.08, antennae: 3, aura: true, sparkles: 5, blush: false },
  },
  {
    id: 'cosmic',
    name: '별빛 루미',
    minLevel: 35,
    description: '수많은 하루가 모여 별빛이 되었다. 루미는 이제 스스로 빛난다.',
    traits: ['별빛 입자', '최종 형태'],
    palette: { body: '#c084fc', bodyDark: '#7e22ce', glow: '#e9d5ff', antenna: '#d8b4fe' },
    form: { scale: 1.15, antennae: 3, aura: true, sparkles: 8, blush: false },
  },
]
