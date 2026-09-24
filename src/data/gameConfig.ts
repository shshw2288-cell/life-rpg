/**
 * 게임 밸런스 수치는 모두 이 폴더에서만 관리한다.
 * 다른 파일에 숫자를 직접 적지 않는다.
 */

/** 하루가 시작되는 현지 시각(시). 오전 0:00~7:59는 전날 게임 날짜에 속한다. */
export const DAY_START_HOUR = 8

export type Difficulty = 1 | 2 | 3 | 4 | 5

/** 난이도별 기본 보상과 피해량 (PRD 2장) */
export const DIFFICULTY_TABLE: Record<
  Difficulty,
  { label: string; exp: number; gold: number; damage: number }
> = {
  1: { label: '매우 쉬움', exp: 5, gold: 3, damage: 2 },
  2: { label: '쉬움', exp: 10, gold: 5, damage: 4 },
  3: { label: '보통', exp: 20, gold: 10, damage: 7 },
  4: { label: '어려움', exp: 35, gold: 18, damage: 11 },
  5: { label: '매우 어려움', exp: 50, gold: 30, damage: 16 },
}

/** 레벨업에 필요한 누적 EXP 곡선 */
export const LEVELING = {
  baseExp: 100,
  growth: 1.25,
  maxLevel: 99,
  /** 레벨업 시 최대 HP 증가량 */
  hpPerLevel: 5,
}

export const CHARACTER_DEFAULTS = {
  level: 1,
  exp: 0,
  maxHp: 50,
  gold: 0,
}

/** 놓친 반복 과제 정산 규칙 */
export const SETTLEMENT = {
  /** 소급 정산할 최대 일수. 이보다 오래 비운 날은 건너뛰고 요약에만 표시한다. */
  maxCatchUpDays: 7,
  /** 하루에 받을 수 있는 피해 상한 (최대 HP 대비 비율) */
  dailyDamageCapRatio: 0.3,
}

/** HP가 0이 되었을 때의 패널티 (MVP: 장비 손실·레벨 하락 없음) */
export const DEATH_PENALTY = {
  goldLossRatio: 0.1,
  /** 부활 시 회복되는 HP (최대 HP 대비 비율) */
  reviveHpRatio: 0.5,
}

/**
 * 같은 긍정 습관을 하루에 반복 기록할 때의 보상 체감.
 * enabled를 false로 두면 항상 기본 보상을 지급한다.
 */
export const HABIT_DIMINISHING = {
  enabled: true,
  factor: 0.9,
  floorRatio: 0.2,
}

/** 기록 화면과 저장소에 남기는 이벤트 보관 일수 */
export const HISTORY_RETENTION_DAYS = 60
