import type { RegionTheme } from '../data/regionConfig'
import {
  BOSS_INTERVAL,
  BOSS_SCALING,
  BOSS_TEMPLATES,
  FLOOR_SCALING,
  NORMAL_TEMPLATES,
} from '../data/towerConfig'
import { MONSTER_HEAVY_TURN_INTERVAL } from '../data/battleConfig'
import type { BossAction } from '../types/battle'
import { regionForFloor } from './regions'

/** 한 층에서 만나는 몬스터. 층 정보로 그때그때 만들어 쓴다. */
export interface FloorMonster {
  id: string
  floor: number
  name: string
  description: string
  hp: number
  attack: number
  defense: number
  goldReward: number
  materialChance: number
  materialId: string
  color: string
  accent: string
  isBoss: boolean
  /** 이 몬스터가 사는 지역 */
  regionId: string
  regionName: string
  theme: RegionTheme
  /** 보스만 가지는 행동 패턴 */
  pattern?: BossAction[]
  /** 보스 공략 힌트 */
  strategy?: string
  /** 일반 몬스터가 강공격을 예고하는 간격 (지역마다 다르다) */
  heavyInterval: number
  /** 일반 공격이 중독을 걸 확률 (지역 특징) */
  poisonChance: number
}

export function isBossFloor(floor: number): boolean {
  return floor % BOSS_INTERVAL === 0
}

/** 다음 보스가 나오는 층 */
export function nextBossFloor(floor: number): number {
  return (Math.floor((floor - 1) / BOSS_INTERVAL) + 1) * BOSS_INTERVAL
}

/**
 * 층 번호로 몬스터를 만든다. 같은 층이면 항상 같은 결과가 나온다.
 * 지역의 특징(중독·잦은 강공격)이 일반 몬스터에도 반영된다.
 */
export function monsterForFloor(floor: number): FloorMonster {
  const safeFloor = Math.max(1, Math.floor(floor))
  const boss = isBossFloor(safeFloor)
  const region = regionForFloor(safeFloor)

  const hp = FLOOR_SCALING.hp.base + FLOOR_SCALING.hp.perFloor * (safeFloor - 1)
  const attack = FLOOR_SCALING.attack.base + FLOOR_SCALING.attack.perFloor * (safeFloor - 1)
  const defense = FLOOR_SCALING.defense.base + FLOOR_SCALING.defense.perFloor * (safeFloor - 1)
  const gold = FLOOR_SCALING.gold.base + FLOOR_SCALING.gold.perFloor * (safeFloor - 1)

  const common = {
    id: `floor-${safeFloor}`,
    floor: safeFloor,
    materialId: 'lumi_shard',
    regionId: region.id,
    regionName: region.name,
    theme: region.theme,
    heavyInterval: region.normalTrait.heavyInterval ?? MONSTER_HEAVY_TURN_INTERVAL,
    poisonChance: region.normalTrait.poisonChance ?? 0,
  }

  if (boss) {
    const template = BOSS_TEMPLATES[(safeFloor / BOSS_INTERVAL - 1) % BOSS_TEMPLATES.length]
    return {
      ...common,
      name: template.name,
      description: template.description,
      hp: Math.round(hp * BOSS_SCALING.hp),
      attack: Math.round(attack * BOSS_SCALING.attack),
      defense: Math.round(defense * BOSS_SCALING.defense),
      goldReward: Math.round(gold * BOSS_SCALING.gold),
      materialChance: BOSS_SCALING.materialChance,
      color: template.color,
      accent: template.accent,
      isBoss: true,
      pattern: template.pattern,
      strategy: template.strategy,
      // 보스는 패턴이 예고를 담당하므로 일반 강공격 예고를 쓰지 않는다
      poisonChance: 0,
    }
  }

  const template = NORMAL_TEMPLATES[(safeFloor - 1) % NORMAL_TEMPLATES.length]
  return {
    ...common,
    name: template.name,
    description: template.description,
    hp: Math.round(hp),
    attack: Math.round(attack),
    defense: Math.round(defense),
    goldReward: Math.round(gold),
    materialChance: FLOOR_SCALING.materialChance,
    color: template.color,
    accent: template.accent,
    isBoss: false,
  }
}

/** 이 층에 도전할 수 있는가. 아직 밟지 못한 층은 잠겨 있다. */
export function canChallenge(floor: number, highestCleared: number): boolean {
  return floor >= 1 && floor <= highestCleared + 1
}

/** 처음 깬 층이면 보스 추가 보상을 준다 */
export function firstClearBonus(floor: number, highestCleared: number): number {
  if (floor <= highestCleared) return 0
  return isBossFloor(floor) ? BOSS_SCALING.firstClearBonus : 0
}
