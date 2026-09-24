import { describe, expect, it } from 'vitest'
import {
  GACHA,
  GRADES,
  GRADE_ORDER,
  PET_SPECIES,
  effectValue,
  speciesByGrade,
  type PetGrade,
} from '../data/petConfig'
import { drawPets, petBonuses, pickSpecies, rollGrade } from './pets'

/** 순환하는 가짜 난수. 테스트를 결정적으로 만든다. */
function seq(values: number[]) {
  let index = 0
  return () => values[index++ % values.length]
}

describe('펫 도감', () => {
  it('30~40종 사이다', () => {
    expect(PET_SPECIES.length).toBeGreaterThanOrEqual(30)
    expect(PET_SPECIES.length).toBeLessThanOrEqual(40)
  })

  it('id가 중복되지 않는다', () => {
    const ids = new Set(PET_SPECIES.map((species) => species.id))
    expect(ids.size).toBe(PET_SPECIES.length)
  })

  it('S부터 C까지 모든 등급에 펫이 있다', () => {
    for (const grade of GRADE_ORDER) {
      expect(speciesByGrade(grade).length).toBeGreaterThan(0)
    }
  })

  it('이전 버전에서 쓰던 펫 id가 남아 있다 (기존 저장 데이터 보호)', () => {
    for (const id of ['mochi', 'ember', 'tide', 'nova']) {
      expect(PET_SPECIES.some((species) => species.id === id)).toBe(true)
    }
  })

  it('등급 확률의 합이 100%다', () => {
    const total = GRADE_ORDER.reduce((sum, grade) => sum + GRADES[grade].rate, 0)
    expect(total).toBeCloseTo(1)
  })
})

describe('등급별 성능', () => {
  it('등급이 높을수록 효과가 강하다', () => {
    const grades: PetGrade[] = ['C', 'B', 'A', 'S']
    const values = grades.map((grade) => effectValue(grade, 'attack'))
    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(values[3]).toBeGreaterThan(values[0])
  })

  it('EXP 펫은 과제 보상 배율을, 공격 펫은 전투 수치를 올린다', () => {
    const expPet = PET_SPECIES.find((species) => species.effect === 'exp' && species.grade === 'S')!
    const atkPet = PET_SPECIES.find(
      (species) => species.effect === 'attack' && species.grade === 'S',
    )!

    const expBonus = petBonuses(expPet.id)
    expect(expBonus.expRate).toBeGreaterThan(1)
    expect(expBonus.combat.attack).toBe(0)

    const atkBonus = petBonuses(atkPet.id)
    expect(atkBonus.combat.attack).toBe(effectValue('S', 'attack'))
    expect(atkBonus.expRate).toBe(1)
  })

  it('S등급 효과가 C등급보다 크다', () => {
    const sExp = PET_SPECIES.find((s) => s.effect === 'exp' && s.grade === 'S')!
    const cExp = PET_SPECIES.find((s) => s.effect === 'exp' && s.grade === 'C')!
    expect(petBonuses(sExp.id).expRate).toBeGreaterThan(petBonuses(cExp.id).expRate)
  })

  it('동행 펫이 없으면 효과가 없다', () => {
    expect(petBonuses(null).expRate).toBe(1)
    expect(petBonuses('존재하지_않는_펫').combat.attack).toBe(0)
  })
})

describe('등급 추첨', () => {
  it('난수가 낮으면 높은 등급이 나온다', () => {
    expect(rollGrade(() => 0)).toBe('S')
  })

  it('난수가 높으면 낮은 등급이 나온다', () => {
    expect(rollGrade(() => 0.999)).toBe('C')
  })

  it('최소 등급을 지정하면 그 이상만 나온다', () => {
    for (const roll of [0, 0.3, 0.6, 0.999]) {
      const grade = rollGrade(() => roll, 'B')
      expect(GRADE_ORDER.indexOf(grade)).toBeLessThanOrEqual(GRADE_ORDER.indexOf('B'))
    }
  })

  it('뽑은 종의 등급이 추첨한 등급과 일치한다', () => {
    const species = pickSpecies(seq([0, 0.5]))
    expect(species.grade).toBe('S')
  })
})

describe('뽑기', () => {
  it('요청한 횟수만큼 뽑는다', () => {
    const results = drawPets({ count: 5, ownedIds: [], rng: seq([0.9, 0.3]) })
    expect(results).toHaveLength(5)
  })

  it('5연차는 B등급 이상을 최소 1마리 보장한다', () => {
    // 항상 C만 나오는 난수로도 마지막은 B 이상이어야 한다
    const results = drawPets({ count: GACHA.multiDrawCount, ownedIds: [], rng: () => 0.999 })
    const best = Math.min(...results.map((r) => GRADE_ORDER.indexOf(r.species.grade)))
    expect(best).toBeLessThanOrEqual(GRADE_ORDER.indexOf(GACHA.multiDrawGuarantee))
  })

  it('이미 좋은 등급이 나왔으면 확정 슬롯을 소모하지 않는다', () => {
    const results = drawPets({ count: 5, ownedIds: [], rng: seq([0, 0.5, 0.999, 0.5]) })
    expect(results.some((r) => r.species.grade === 'S')).toBe(true)
  })

  it('이미 가진 펫은 중복으로 표시되고 Gold를 돌려준다', () => {
    const first = drawPets({ count: 1, ownedIds: [], rng: () => 0.999 })[0]
    const again = drawPets({ count: 1, ownedIds: [first.species.id], rng: () => 0.999 })[0]
    expect(again.duplicate).toBe(true)
    expect(again.refundGold).toBe(GRADES[again.species.grade].duplicateGold)
  })

  it('같은 판에서 두 번 나온 펫도 중복으로 센다', () => {
    const results = drawPets({ count: 2, ownedIds: [], rng: () => 0.999 })
    expect(results[1].duplicate).toBe(true)
  })
})
