import { useGameStore } from '../../store/useGameStore'
import { useEffectStore, type EffectLabel } from './effectStore'

/**
 * 버튼을 누른 자리에서 보상 연출을 띄운다.
 *
 * 보상 금액은 펫 보너스와 체감 규칙이 모두 적용된 뒤에야 정해지므로,
 * 액션을 실행한 다음 방금 쌓인 이벤트를 읽어서 실제 수치를 그대로 보여준다.
 */
export function useRewardEffect() {
  const spawn = useEffectStore((state) => state.spawn)

  /** target은 연출이 터질 기준 엘리먼트(보통 누른 버튼)다. */
  return function withEffect(target: HTMLElement | null, run: () => void) {
    const before = useGameStore.getState()
    const beforeCount = before.events.length
    const beforeLevel = before.character.level

    run()

    const after = useGameStore.getState()
    const event = after.events.at(-1)
    if (!event || after.events.length === beforeCount) return

    const labels: EffectLabel[] = []
    if (event.expDelta > 0) labels.push({ text: `+${event.expDelta} EXP`, tone: 'exp' })
    if (event.goldDelta > 0) labels.push({ text: `+${event.goldDelta} G`, tone: 'gold' })
    if (event.hpDelta !== 0) labels.push({ text: `${event.hpDelta} HP`, tone: 'hp' })
    if (labels.length === 0) return

    const rect = target?.getBoundingClientRect()
    spawn({
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      labels,
      kind: event.hpDelta < 0 ? 'penalty' : 'reward',
      levelUp: after.character.level > beforeLevel,
    })
  }
}
