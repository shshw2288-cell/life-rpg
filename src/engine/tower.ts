import {
  BOSS_INTERVAL,
  BOSS_SCALING,
  BOSS_TEMPLATES,
  FLOOR_SCALING,
  NORMAL_TEMPLATES,
  type BossMove,
} from '../data/towerConfig'

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
  /** 보스만 가지는 행동 패턴 */
  pattern?: BossMove[]
  healRatio?: number
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
 */
export function monsterForFloor(floor: number): FloorMonster {
  const safeFloor = Math.max(1, Math.floor(floor))
  const boss = isBossFloor(safeFloor)

  const hp = FLOOR_SCALING.hp.base + FLOOR_SCALING.hp.perFloor * (safeFloor - 1)
  const attack = FLOOR_SCALING.attack.base + FLOOR_SCALING.attack.perFloor * (safeFloor - 1)
  const defense = FLOOR_SCALING.defense.base + FLOOR_SCALING.defense.perFloor * (safeFloor - 1)
  const gold = FLOOR_SCALING.gold.base + FLOOR_SCALING.gold.perFloor * (safeFloor - 1)

  if (boss) {
    const template = BOSS_TEMPLATES[(safeFloor / BOSS_INTERVAL - 1) % BOSS_TEMPLATES.length]
    return {
      id: `floor-${safeFloor}`,
      floor: safeFloor,
      name: `${template.name}`,
      description: template.description,
      hp: Math.round(hp * BOSS_SCALING.hp),
      attack: Math.round(attack * BOSS_SCALING.attack),
      defense: Math.round(defense * BOSS_SCALING.defense),
      goldReward: Math.round(gold * BOSS_SCALING.gold),
      materialChance: BOSS_SCALING.materialChance,
      materialId: 'lumi_shard',
      color: template.color,
      accent: template.accent,
      isBoss: true,
      pattern: template.pattern,
      healRatio: template.healRatio,
    }
  }

  const template = NORMAL_TEMPLATES[(safeFloor - 1) % NORMAL_TEMPLATES.length]
  return {
    id: `floor-${safeFloor}`,
    floor: safeFloor,
    name: template.name,
    description: template.description,
    hp: Math.round(hp),
    attack: Math.round(attack),
    defense: Math.round(defense),
    goldReward: Math.round(gold),
    materialChance: FLOOR_SCALING.materialChance,
    materialId: 'lumi_shard',
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
