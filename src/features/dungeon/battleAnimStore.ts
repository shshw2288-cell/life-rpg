import { create } from 'zustand'
import type { BattleStep } from '../../types/battle'

/**
 * 전투 연출 큐. 화면에만 쓰이며 저장하지 않는다.
 *
 * 전투 계산은 한 번에 끝나므로(플레이어 행동 + 몬스터 반격),
 * 그 결과를 단계로 쪼개 순서대로 재생하는 역할만 한다.
 * 연출이 도는 동안 playing이 true가 되어 중복 입력을 막는다.
 */
/**
 * 연출이 이 시간을 넘기면 멈춘 것으로 보고 입력 잠금을 푼다.
 * 연출 화면이 없거나 중간에 끊겨도 게임이 잠기지 않게 하는 안전장치다.
 */
export const ANIM_WATCHDOG_MS = 8000

interface BattleAnimStore {
  /** 아직 재생하지 않은 단계들 */
  queue: BattleStep[]
  /** 지금 재생 중인 단계 */
  current: BattleStep | null
  /** 어느 전투의 연출인지. 전투가 바뀌면 큐를 버린다. */
  battleId: string | null
  playing: boolean
  /** 연출을 시작한 시각 */
  startedAt: number
  enqueue: (battleId: string, steps: BattleStep[]) => void
  /** 다음 단계로 넘어간다. 큐가 비면 연출이 끝난다. */
  advance: () => void
  reset: () => void
  /** 지금 입력을 막아야 하는가 (멈춘 연출은 무시한다) */
  isBlocking: () => boolean
}

export const useBattleAnimStore = create<BattleAnimStore>((set, get) => ({
  queue: [],
  current: null,
  battleId: null,
  playing: false,
  startedAt: 0,

  enqueue: (battleId, steps) => {
    if (steps.length === 0) return
    const [first, ...rest] = steps
    set({ battleId, current: first, queue: rest, playing: true, startedAt: Date.now() })
  },

  advance: () => {
    const { queue } = get()
    if (queue.length === 0) {
      set({ current: null, playing: false })
      return
    }
    const [next, ...rest] = queue
    set({ current: next, queue: rest })
  },

  reset: () => set({ queue: [], current: null, battleId: null, playing: false, startedAt: 0 }),

  isBlocking: () => {
    const { playing, startedAt } = get()
    if (!playing) return false
    return Date.now() - startedAt < ANIM_WATCHDOG_MS
  },
}))
