import { PET_RULES, PET_SPECIES } from '../data/petConfig'
import type { GameDate } from '../lib/date'
import type { Egg, Pet } from '../types/pet'

/** 0 이상 1 미만의 난수를 돌려주는 함수. 테스트에서는 고정값을 넣는다. */
export type Rng = () => number

export interface PetProgressResult {
  eggs: Egg[]
  pets: Pet[]
  /** 이번 완료로 새로 얻은 알 */
  newEgg?: Egg
  /** 이번 완료로 부화한 펫 */
  hatched?: Pet
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

  if (eggs.length > 0) {
    const [first, ...rest] = eggs
    const advanced: Egg = { ...first, progress: first.progress + 1 }
    if (advanced.progress >= advanced.required) {
      hatched = {
        id: newId(),
        speciesId: pickSpecies(rng).id,
        hatchedOn: today,
      }
      pets.push(hatched)
      eggs = rest
    } else {
      eggs = [advanced, ...rest]
    }
  }

  if (eggs.length < PET_RULES.maxEggs && rng() < PET_RULES.eggDropChance) {
    newEgg = {
      id: newId(),
      progress: 0,
      required: PET_RULES.hatchRequirement,
      obtainedOn: today,
    }
    eggs.push(newEgg)
  }

  return { eggs, pets, newEgg, hatched }
}

/** 가중치에 따라 펫 종류를 뽑는다 */
export function pickSpecies(rng: Rng) {
  const total = PET_SPECIES.reduce((sum, species) => sum + species.weight, 0)
  let roll = rng() * total
  for (const species of PET_SPECIES) {
    roll -= species.weight
    if (roll < 0) return species
  }
  return PET_SPECIES[PET_SPECIES.length - 1]
}
