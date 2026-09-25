import { beforeEach, describe, expect, it } from 'vitest'
import { useEffectStore } from './effectStore'

const sample = {
  x: 10,
  y: 20,
  labels: [{ text: '+20 EXP', tone: 'exp' as const }],
  kind: 'reward' as const,
  levelUp: false,
}

beforeEach(() => {
  useEffectStore.setState({ bursts: [] })
})

describe('연출 스토어', () => {
  it('연출을 쌓는다', () => {
    useEffectStore.getState().spawn(sample)
    expect(useEffectStore.getState().bursts).toHaveLength(1)
    expect(useEffectStore.getState().bursts[0].labels[0].text).toBe('+20 EXP')
  })

  it('id로 지운다', () => {
    useEffectStore.getState().spawn(sample)
    const { id } = useEffectStore.getState().bursts[0]
    useEffectStore.getState().remove(id)
    expect(useEffectStore.getState().bursts).toHaveLength(0)
  })

  it('id가 겹치지 않는다', () => {
    useEffectStore.getState().spawn(sample)
    useEffectStore.getState().spawn(sample)
    const [first, second] = useEffectStore.getState().bursts
    expect(first.id).not.toBe(second.id)
  })

  it('너무 많이 쌓이면 오래된 것부터 버린다', () => {
    for (let index = 0; index < 12; index += 1) {
      useEffectStore.getState().spawn({ ...sample, x: index })
    }
    const bursts = useEffectStore.getState().bursts
    expect(bursts).toHaveLength(6)
    expect(bursts[0].x).toBe(6) // 앞의 6개는 버려졌다
  })
})
