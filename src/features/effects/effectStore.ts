import { create } from 'zustand'

export interface EffectLabel {
  text: string
  tone: 'exp' | 'gold' | 'hp' | 'plain'
}

export interface Burst {
  id: string
  /** 화면 좌표 (클릭 지점) */
  x: number
  y: number
  labels: EffectLabel[]
  kind: 'reward' | 'penalty'
  /** 이번 클릭으로 레벨이 올랐는지 */
  levelUp: boolean
}

interface EffectStore {
  bursts: Burst[]
  spawn: (burst: Omit<Burst, 'id'>) => void
  remove: (id: string) => void
}

/**
 * 화면에만 잠깐 보이는 연출 상태. 저장하지 않는다.
 * 게임 상태(useGameStore)와 분리해 두어야 저장 데이터가 지저분해지지 않는다.
 */
export const useEffectStore = create<EffectStore>((set) => ({
  bursts: [],
  spawn: (burst) =>
    set((state) => ({
      // 너무 많이 쌓이면 오래된 것부터 버린다
      bursts: [...state.bursts, { ...burst, id: `${Date.now()}-${Math.random()}` }].slice(-6),
    })),
  remove: (id) => set((state) => ({ bursts: state.bursts.filter((burst) => burst.id !== id) })),
}))
