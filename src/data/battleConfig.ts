/**
 * 던전 전투 밸런스. 조정할 수치는 전부 여기 모은다.
 *
 * 주의: 전투 HP/MP는 생산성 앱의 캐릭터 HP와 완전히 분리된 값이다.
 * 전투에서 져도 character.hp 는 건드리지 않는다.
 */

/** 레벨에서 전투 능력치를 만드는 계수 */
export const COMBAT_SCALING = {
  baseHp: 40,
  hpPerLevel: 6,
  baseAttack: 7,
  attackPerLevel: 1.5,
  baseDefense: 2,
  defensePerLevel: 0.5,
  baseMp: 10,
  mpPerLevel: 2,
  /** 기본 치명타 확률 (PER 능력치가 생기면 여기에 더한다) */
  baseCritChance: 0.05,
  critMultiplier: 1.6,
}

export const ACTIONS = {
  attack: {
    /** 피해 난수 범위 */
    varianceMin: 0.9,
    varianceMax: 1.1,
    /** 공격 시 회복되는 MP */
    mpGain: 2,
  },
  defend: {
    /** 방어한 턴에 받는 피해 배율 */
    damageTaken: 0.4,
    mpGain: 4,
  },
  skill: {
    id: 'starlight',
    name: '별빛 파동',
    mpCost: 6,
    /** 공격력 배율 */
    power: 1.8,
    /** 몬스터 방어력을 이만큼만 적용 */
    defensePierce: 0.5,
  },
}

/** 몬스터가 몇 턴마다 강공격을 하는지 */
export const MONSTER_HEAVY_TURN_INTERVAL = 3
export const MONSTER_HEAVY_MULTIPLIER = 1.7

/** 하루 던전 입장 규칙 */
export const DUNGEON_ENTRY = {
  /** 게임 날짜마다 기본으로 주어지는 입장 횟수 */
  baseDaily: 1,
  /** 과제 완료 몇 번마다 입장 기회 1회를 더 주는지 */
  completionsPerBonus: 3,
  /** 하루 최대 입장 횟수 */
  maxDaily: 3,
}

/** 재료 아이템 정의 (장비 제작은 후속 단계) */
export const MATERIALS: Record<string, { name: string; description: string }> = {
  lumi_shard: {
    name: '루미 조각',
    description: '몬스터가 남긴 결정. 나중에 장비를 만들 때 쓴다.',
  },
}
