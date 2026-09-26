import type { PetRole } from '../types/pet'
import { GRADES, type PetEffectType, type PetGrade } from './petConfig'

/**
 * 펫의 전투 역할 설정.
 *
 * 등급은 효과의 '크기'만 조금 키우고 역할은 바꾸지 않는다.
 * 그래서 S등급이라고 모든 상황에서 좋은 게 아니라, 상대에 맞는 역할을 고르는 게 중요하다.
 */

export const ROLE_INFO: Record<
  PetRole,
  { label: string; summary: string; trigger: string; color: string }
> = {
  healer: {
    label: '회복형',
    summary: '정해진 턴 간격으로 전투 HP를 조금씩 회복한다',
    trigger: '전투 시작 후 정해진 턴마다 자동 발동',
    color: '#34d399',
  },
  guard: {
    label: '방어형',
    summary: '전투 중 한 번, 위험한 공격의 피해를 크게 줄인다',
    trigger: '큰 피해를 받을 때 한 번 자동 발동',
    color: '#60a5fa',
  },
  striker: {
    label: '공격형',
    summary: '내가 공격한 뒤에 따라 들어가 추가 타격을 넣는다',
    trigger: '공격·공격 스킬 직후 (대기시간 있음)',
    color: '#fb7185',
  },
  support: {
    label: '지원형',
    summary: 'MP를 채워주고, 걸린 상태이상을 한 번 풀어준다',
    trigger: '정해진 턴마다 MP 회복 / 중독되면 해제',
    color: '#c084fc',
  },
}

/** 펫의 기존 효과 종류에서 어울리는 역할을 정한다 */
export const ROLE_BY_EFFECT: Record<PetEffectType, PetRole> = {
  hp: 'healer',
  defense: 'guard',
  attack: 'striker',
  crit: 'striker',
  exp: 'support',
  gold: 'support',
  mp: 'support',
}

/** 역할별 기본 수치 (C등급 기준) */
export const PET_COMBAT = {
  healer: {
    /** 몇 턴마다 회복하는지 */
    interval: 3,
    /** 전투 HP 최대치 대비 회복 비율 */
    healRatio: 0.1,
    maxUses: 3,
  },
  guard: {
    /** 최대 HP 대비 이 비율 이상 피해를 받을 때 발동 */
    threshold: 0.22,
    /** 줄여주는 비율 */
    reduce: 0.4,
    /** 아무리 등급이 높아도 이 이상은 줄이지 않는다 */
    reduceCap: 0.65,
    maxUses: 1,
  },
  striker: {
    /** 발동 후 쉬는 턴 */
    cooldown: 2,
    /** 내 공격력 대비 추가 타격 배율 */
    power: 0.45,
    maxUses: 4,
  },
  support: {
    interval: 3,
    /** 최대 MP 대비 회복 비율 */
    mpRatio: 0.18,
    maxUses: 4,
    /** 상태이상 해제 횟수 */
    cleanse: 1,
  },
}

/**
 * 등급이 올라가도 효과가 과하게 커지지 않도록 눌러 준다.
 * 효과 배율(C 1 · B 2 · A 3.5 · S 5.5)을 그대로 쓰면 S등급 하나로 끝나기 때문이다.
 */
export function roleScale(grade: PetGrade): number {
  return 1 + (GRADES[grade].multiplier - 1) * 0.18
}

/** 종마다 붙는 고유 능력 이름 */
export const PET_ABILITY_NAME: Record<string, string> = {
  // C
  mochi: '포근한 응원',
  ember: '불씨 재촉',
  tide: '잔물결 치유',
  pebble: '단단한 등껍질',
  moss_bean: '새싹 기운',
  dewdrop: '아침 이슬',
  cotton: '솜털 붕대',
  firefly: '반딧불 일격',
  twiggy: '잔가지 후리기',
  mole: '땅속 보급',
  puff: '보풀 격려',
  snail: '느긋한 방벽',
  spark: '탁탁 불티',
  bubble: '거품 충전',
  // B
  leaf_fox: '잎사귀 신호',
  lantern: '등불 밝히기',
  clay_golem: '흙벽 세우기',
  breeze: '산들 베기',
  cinder_cat: '잿빛 할퀴기',
  rainlet: '빗방울 노래',
  moon_moth: '달가루 회복',
  acorn_knight: '도토리 방패',
  frost_pup: '서리 찜질',
  thunder_chick: '삐약 번개',
  moss_owl: '숲의 조언',
  coin_crab: '집게 보급',
  spore_cap: '포자 치유',
  // A
  nova: '별똥 낙하',
  aurora_deer: '오로라 인도',
  magma_bear: '용암 후려치기',
  tide_serpent: '해류 감싸기',
  clockwork_owl: '태엽 재충전',
  gilded_fox: '금가루 뿌리기',
  stone_guardian: '바위 수호진',
  // S
  celestial_spirit: '별의 인도',
  eclipse_dragon: '월식의 숨결',
  chrono_phoenix: '시간 역행의 불꽃',
}
