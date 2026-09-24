import {
  GACHA,
  GRADES,
  GRADE_ORDER,
  PET_RULES,
  PET_SPECIES,
  effectValue,
  findSpecies,
  speciesByGrade,
  type PetGrade,
  type PetSpecies,
} from '../data/petConfig'
import type { GameDate } from '../lib/date'
import type { Egg, Pet } from '../types/pet'

/** 0 이상 1 미만의 난수를 돌려주는 함수. 테스트에서는 고정값을 넣는다. */
export type Rng = () => number

/** 등급 확률표에 따라 등급을 뽑는다 */
export function rollGrade(rng: Rng, minGrade?: PetGrade): PetGrade {
  const pool = minGrade
    ? GRADE_ORDER.filter((grade) => GRADE_ORDER.indexOf(grade) <= GRADE_ORDER.indexOf(minGrade))
    : GRADE_ORDER

  const total = pool.reduce((sum, grade) => sum + GRADES[grade].rate, 0)
  let roll = rng() * total
  for (const grade of pool) {
    roll -= GRADES[grade].rate
    if (roll < 0) return grade
  }
  return pool[pool.length - 1]
}

/** 등급을 뽑고 그 등급 안에서 균등하게 종을 고른다 */
export function pickSpecies(rng: Rng, minGrade?: PetGrade): PetSpecies {
  const grade = rollGrade(rng, minGrade)
  const pool = speciesByGrade(grade)
  if (pool.length === 0) return PET_SPECIES[0]
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  return pool[index]
}

export interface DrawResult {
  species: PetSpecies
  /** 이미 가지고 있던 펫인지 */
  duplicate: boolean
  /** 중복일 때 돌려받는 Gold */
  refundGold: number
}

/**
 * 뽑기. count번 뽑으며, 여러 번 뽑기의 마지막 한 번은 일정 등급 이상을 보장한다.
 * 상태를 바꾸지 않고 결과만 돌려준다.
 */
export function drawPets(params: {
  count: number
  ownedIds: string[]
  rng: Rng
}): DrawResult[] {
  const { count, rng } = params
  const owned = new Set(params.ownedIds)
  const results: DrawResult[] = []

  for (let index = 0; index < count; index += 1) {
    const isGuaranteedSlot = count >= GACHA.multiDrawCount && index === count - 1
    const guaranteeNeeded =
      isGuaranteedSlot &&
      !results.some(
        (result) =>
          GRADE_ORDER.indexOf(result.species.grade) <=
          GRADE_ORDER.indexOf(GACHA.multiDrawGuarantee),
      )

    const species = pickSpecies(rng, guaranteeNeeded ? GACHA.multiDrawGuarantee : undefined)
    const duplicate = owned.has(species.id)
    owned.add(species.id)

    results.push({
      species,
      duplicate,
      refundGold: duplicate ? GRADES[species.grade].duplicateGold : 0,
    })
  }

  return results
}

/** 동행 펫이 주는 효과 */
export interface PetBonuses {
  /** 과제 EXP 배율 (1.1이면 +10%) */
  expRate: number
  goldRate: number
  combat: { attack: number; maxHp: number; critChance: number; defense: number; maxMp: number }
}

export const NO_BONUS: PetBonuses = {
  expRate: 1,
  goldRate: 1,
  combat: { attack: 0, maxHp: 0, critChance: 0, defense: 0, maxMp: 0 },
}

/** 동행 펫 1마리의 효과를 계산한다. 지정하지 않았으면 효과 없음. */
export function petBonuses(speciesId?: string | null): PetBonuses {
  if (!speciesId) return NO_BONUS
  const species = findSpecies(speciesId)
  if (!species) return NO_BONUS

  const value = effectValue(species.grade, species.effect)
  const bonuses: PetBonuses = {
    expRate: 1,
    goldRate: 1,
    combat: { attack: 0, maxHp: 0, critChance: 0, defense: 0, maxMp: 0 },
  }

  switch (species.effect) {
    case 'exp':
      bonuses.expRate = 1 + value / 100
      break
    case 'gold':
      bonuses.goldRate = 1 + value / 100
      break
    case 'crit':
      bonuses.combat.critChance = value / 100
      break
    case 'attack':
      bonuses.combat.attack = value
      break
    case 'hp':
      bonuses.combat.maxHp = value
      break
    case 'defense':
      bonuses.combat.defense = value
      break
    case 'mp':
      bonuses.combat.maxMp = value
      break
  }

  return bonuses
}

export interface PetProgressResult {
  eggs: Egg[]
  pets: Pet[]
  /** 이번 완료로 새로 얻은 알 */
  newEgg?: Egg
  /** 이번 완료로 부화한 펫 */
  hatched?: Pet
  /** 부화가 중복이라 돌려받는 Gold */
  refundGold: number
  /** 부화로 받은 뽑기권 */
  ticketsGained: number
}

/**
 * 과제 완료 1회를 펫 시스템에 반영한다.
 * 1) 품고 있는 알 중 가장 오래된 것의 진행도를 올린다.
 * 2) 진행도가 차면 부화시킨다.
 * 3) 확률에 따라 새 알을 얻는다.
 */
export function progressPets(params: {
  eggs: Egg[]
  pets: Pet[]
  today: GameDate
  rng: Rng
  newId: () => string
}): PetProgressResult {
  const { today, rng, newId } = params
  let eggs = [...params.eggs]
  const pets = [...params.pets]
  let hatched: Pet | undefined
  let newEgg: Egg | undefined
  let refundGold = 0
  let ticketsGained = 0

  if (eggs.length > 0) {
    const [first, ...rest] = eggs
    const advanced: Egg = { ...first, progress: first.progress + 1 }
    if (advanced.progress >= advanced.required) {
      const species = pickSpecies(rng)
      const duplicate = pets.some((pet) => pet.speciesId === species.id)
      hatched = { id: newId(), speciesId: species.id, hatchedOn: today }
      pets.push(hatched)
      if (duplicate) refundGold += GRADES[species.grade].duplicateGold
      ticketsGained += PET_RULES.ticketPerHatch
      eggs = rest
    } else {
      eggs = [advanced, ...rest]
    }
  }

  if (eggs.length < PET_RULES.maxEggs && rng() < PET_RULES.eggDropChance) {
    newEgg = { id: newId(), progress: 0, required: PET_RULES.hatchRequirement, obtainedOn: today }
    eggs.push(newEgg)
  }

  return { eggs, pets, newEgg, hatched, refundGold, ticketsGained }
}
