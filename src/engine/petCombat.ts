import { findSpecies, type PetSpecies } from '../data/petConfig'
import {
  PET_ABILITY_NAME,
  PET_COMBAT,
  ROLE_BY_EFFECT,
  ROLE_INFO,
  roleScale,
} from '../data/petRoleConfig'
import type { BattlePetState } from '../types/battle'
import type { PetRole } from '../types/pet'

/**
 * 동행 펫의 전투 역할 계산. 순수 함수만 둔다.
 *
 * 역할별 수치는 data/petRoleConfig.ts 에 있고 여기서는 조합만 한다.
 * 전투가 시작될 때 한 번 계산해 BattleState 안에 넣어 두므로
 * 전투 도중 펫을 바꿔도 이번 판에는 영향이 없다.
 */

export function petRoleOf(species: PetSpecies): PetRole {
  return ROLE_BY_EFFECT[species.effect]
}

export function petAbilityName(species: PetSpecies): string {
  return PET_ABILITY_NAME[species.id] ?? `${species.name}의 도움`
}

/** 역할별 효과 크기 (뜻은 역할마다 다르다) */
export function petRoleValue(species: PetSpecies): number {
  const scale = roleScale(species.grade)
  switch (petRoleOf(species)) {
    case 'healer':
      return round2(PET_COMBAT.healer.healRatio * scale)
    case 'guard':
      return round2(Math.min(PET_COMBAT.guard.reduce * scale, PET_COMBAT.guard.reduceCap))
    case 'striker':
      return round2(PET_COMBAT.striker.power * scale)
    case 'support':
      return round2(PET_COMBAT.support.mpRatio * scale)
  }
}

/** 화면에 보여줄 발동 조건과 효과 설명 */
export function petAbilityDetail(species: PetSpecies): {
  role: PetRole
  roleLabel: string
  abilityName: string
  trigger: string
  effect: string
} {
  const role = petRoleOf(species)
  const value = petRoleValue(species)
  const effect =
    role === 'healer'
      ? `${PET_COMBAT.healer.interval}턴마다 전투 HP를 ${Math.round(value * 100)}% 회복 (전투당 ${PET_COMBAT.healer.maxUses}회)`
      : role === 'guard'
        ? `최대 HP의 ${Math.round(PET_COMBAT.guard.threshold * 100)}% 이상 피해를 받을 때 그 피해를 ${Math.round(value * 100)}% 감소 (전투당 ${PET_COMBAT.guard.maxUses}회)`
        : role === 'striker'
          ? `공격 뒤 추가 타격 (내 공격력의 ${Math.round(value * 100)}%, 대기 ${PET_COMBAT.striker.cooldown}턴, 전투당 ${PET_COMBAT.striker.maxUses}회)`
          : `${PET_COMBAT.support.interval}턴마다 MP를 ${Math.round(value * 100)}% 회복하고, 중독을 ${PET_COMBAT.support.cleanse}회 풀어줍니다`

  return {
    role,
    roleLabel: ROLE_INFO[role].label,
    abilityName: petAbilityName(species),
    trigger: ROLE_INFO[role].trigger,
    effect,
  }
}

/** 전투 시작 시 동행 펫의 상태를 만든다. 펫이 없으면 null (펫 없이도 전투는 된다). */
export function makeBattlePet(speciesId: string | null | undefined): BattlePetState | null {
  if (!speciesId) return null
  const species = findSpecies(speciesId)
  if (!species) return null

  const role = petRoleOf(species)
  const config = PET_COMBAT[role]

  return {
    speciesId: species.id,
    name: species.name,
    role,
    abilityName: petAbilityName(species),
    value: petRoleValue(species),
    interval: 'interval' in config ? config.interval : 0,
    // 공격형은 첫 턴부터, 주기형은 interval 번째 턴에 처음 발동하도록 맞춘다
    cooldown: role === 'striker' ? 0 : 'interval' in config ? Math.max(0, config.interval - 1) : 0,
    usesLeft: config.maxUses,
    cleanseLeft: role === 'support' ? PET_COMBAT.support.cleanse : 0,
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export { ROLE_INFO }
