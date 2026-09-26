import type { StatusEffect } from './battle'

export type SkillIcon = 'arrow' | 'sprout' | 'shield' | 'focus' | 'vine'

/** 스킬을 쓸 수 있게 되는 조건 */
export type SkillUnlock =
  | { kind: 'start' }
  /** 이 지역의 보스를 처음 잡으면 열린다 */
  | { kind: 'region'; regionId: string }

/**
 * 액티브 스킬 한 개의 정의.
 * 위력·비용·지속시간은 전부 여기(데이터)에 있고 engine/skills.ts 가 해석만 한다.
 */
export interface SkillDef {
  id: string
  name: string
  description: string
  icon: SkillIcon
  /** 공격 / 회복 / 자신 강화 / 적 약화 */
  kind: 'damage' | 'heal' | 'buff' | 'debuff'
  mpCost: number
  /** 쓰고 나서 다시 쓸 수 있을 때까지의 턴 수. 0이면 제한 없음 */
  cooldown: number
  /** 한 전투에서 쓸 수 있는 횟수. 없으면 무제한 */
  maxUses?: number
  /** damage: 공격력 배율 */
  power?: number
  /** damage: 적 방어력을 이 비율만큼만 적용 */
  defensePierce?: number
  /** heal: 최대 HP 대비 회복 비율 */
  healRatio?: number
  /** buff: 자신에게 거는 상태 */
  selfStatus?: StatusEffect
  /** debuff: 적에게 거는 상태 */
  enemyStatus?: StatusEffect
  unlock: SkillUnlock
  /** 언제 쓰면 좋은지 */
  tip: string
}
