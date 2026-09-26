import { SKILLS, SKILL_SLOTS, STARTER_SKILL_IDS, findSkill } from '../data/skillConfig'
import type { BattleSkillState, BattleState } from '../types/battle'
import type { SkillDef } from '../types/skill'
import { clearedRegionIds } from './regions'

/**
 * 스킬 해금과 장착 규칙. 순수 함수만 둔다.
 *
 * 해금 여부는 저장하지 않고 탑 진행도에서 그때그때 계산한다.
 * 저장값을 따로 두면 진행도와 어긋날 수 있기 때문이다.
 */

export function unlockedSkillIds(highestCleared: number): string[] {
  const cleared = clearedRegionIds(highestCleared)
  return SKILLS.filter(
    (skill) => skill.unlock.kind === 'start' || cleared.includes(skill.unlock.regionId),
  ).map((skill) => skill.id)
}

export function isSkillUnlocked(skillId: string, highestCleared: number): boolean {
  return unlockedSkillIds(highestCleared).includes(skillId)
}

/**
 * 장착 목록을 규칙에 맞게 정리한다.
 * 중복 제거 · 해금되지 않은 스킬 제거 · 슬롯 수 제한.
 */
export function normalizeLoadout(loadout: string[], highestCleared: number): string[] {
  const unlocked = new Set(unlockedSkillIds(highestCleared))
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of loadout) {
    if (!unlocked.has(id) || seen.has(id)) continue
    seen.add(id)
    result.push(id)
    if (result.length >= SKILL_SLOTS) break
  }
  return result
}

/** 아직 한 번도 고른 적 없는 사용자에게 주는 기본 구성 */
export function defaultLoadout(): string[] {
  return STARTER_SKILL_IDS.slice(0, SKILL_SLOTS)
}

/** 장착한 스킬을 전투용 상태로 바꾼다 */
export function initSkillStates(loadout: string[]): BattleSkillState[] {
  return loadout
    .map((id) => findSkill(id))
    .filter((skill): skill is SkillDef => Boolean(skill))
    .map((skill) => ({
      id: skill.id,
      cooldown: 0,
      usesLeft: skill.maxUses ?? null,
    }))
}

export interface SkillAvailability {
  skill: SkillDef
  state: BattleSkillState
  usable: boolean
  /** 쓸 수 없으면 그 이유 */
  reason: string | null
}

/** 전투 화면에서 각 스킬을 쓸 수 있는지와 그 이유 */
export function skillAvailability(battle: BattleState): SkillAvailability[] {
  return battle.skills
    .map((state) => {
      const skill = findSkill(state.id)
      if (!skill) return null
      let reason: string | null = null
      if (battle.status !== 'active') reason = '전투가 끝났습니다'
      else if (state.usesLeft !== null && state.usesLeft <= 0) reason = '이번 전투 사용 횟수 소진'
      else if (state.cooldown > 0) reason = `대기 ${state.cooldown}턴`
      else if (battle.player.mp < skill.mpCost) reason = `MP ${skill.mpCost} 필요`
      return { skill, state, usable: reason === null, reason }
    })
    .filter((entry): entry is SkillAvailability => entry !== null)
}

export { SKILL_SLOTS, SKILLS, findSkill }
