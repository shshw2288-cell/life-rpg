import type { StatusId } from '../types/battle'

/**
 * 던전 전투 밸런스. 조정할 수치는 전부 여기 모은다.
 *
 * 주의: 전투 HP/MP는 생산성 앱의 캐릭터 HP와 완전히 분리된 값이다.
 * 전투에서 져도 character.hp 는 건드리지 않는다.
 *
 * 스킬 수치는 data/skillConfig.ts, 보스 패턴은 data/towerConfig.ts 에 있다.
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

/** 슬롯을 쓰지 않고 언제나 할 수 있는 두 가지 행동 */
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
}

/** 일반 몬스터가 강공격을 예고하는 기본 간격과 배율 */
export const MONSTER_HEAVY_TURN_INTERVAL = 3
export const MONSTER_HEAVY_MULTIPLIER = 1.7

/** 지역 특징으로 일반 몬스터가 거는 중독 */
export const AMBIENT_POISON = { turns: 2, value: 0.04 }

/** 화면에 상태를 보여줄 때 쓰는 표시 정보 */
export const STATUS_INFO: Record<
  StatusId,
  { label: string; side: 'player' | 'monster'; tone: 'good' | 'bad'; describe: (value: number) => string }
> = {
  shield: {
    label: '보호막',
    side: 'player',
    tone: 'good',
    describe: (value) => `받는 피해 ${Math.round(value * 100)}% 감소`,
  },
  focus: {
    label: '집중',
    side: 'player',
    tone: 'good',
    describe: (value) => `다음 공격 피해 +${Math.round(value * 100)}% (쓰면 사라짐)`,
  },
  poison: {
    label: '중독',
    side: 'player',
    tone: 'bad',
    describe: (value) => `라운드마다 최대 HP의 ${Math.round(value * 100)}% 피해`,
  },
  weaken: {
    label: '묶임',
    side: 'monster',
    tone: 'good',
    describe: (value) => `적의 공격 ${Math.round(value * 100)}% 약화 · 회복 저지`,
  },
  vulnerable: {
    label: '약점 노출',
    side: 'monster',
    tone: 'good',
    describe: (value) => `적이 받는 피해 +${Math.round(value * 100)}%`,
  },
  guard: {
    label: '보호막(적)',
    side: 'monster',
    tone: 'bad',
    describe: (value) => `적이 받는 피해 ${Math.round(value * 100)}% 감소`,
  },
}

/** 처음 시작할 때 주는 탑의 열쇠 (하루 제한과 별개로 쓰는 추가 입장권) */
export const STARTING_TOWER_KEYS = 1

/**
 * 탑 입장 규칙.
 *
 * 하루 입장 횟수에 상한을 두지 않는다.
 * 매일 무료 입장이 주어지고, 그 위에 과제를 완료해 모은 열쇠를 쓴다.
 * 열쇠는 날짜가 바뀌어도 사라지지 않고 계속 쌓인다.
 */
export const DUNGEON_ENTRY = {
  /** 게임 날짜마다 기본으로 주어지는 무료 입장 횟수 */
  baseDaily: 1,
  /** 과제(반복 과제·할 일) 완료 몇 번마다 열쇠 1개를 주는지 */
  completionsPerKey: 3,
}

/** 재료 아이템 정의 (장비 제작은 후속 단계) */
export const MATERIALS: Record<string, { name: string; description: string }> = {
  lumi_shard: {
    name: '루미 조각',
    description: '몬스터가 남긴 결정. 나중에 장비를 만들 때 쓴다.',
  },
}
