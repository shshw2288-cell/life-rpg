import type { BossAction } from '../types/battle'

/**
 * 탑(던전) 설정.
 * 층이 올라갈수록 몬스터가 강해지고, 10층마다 보스가 나온다.
 * 몬스터를 층마다 일일이 정의하지 않고 템플릿 + 층 배율로 만든다.
 *
 * 10 / 20 / 30 / 40층 보스는 각각 지역(시작의 숲 · 버섯 동굴 · 바람 절벽 · 별빛 유적)의
 * 관문이며, 지역마다 대응 방법이 달라지도록 행동 패턴을 따로 짰다.
 */

export const BOSS_INTERVAL = 10

/** 층에 따른 몬스터 수치 */
export const FLOOR_SCALING = {
  hp: { base: 45, perFloor: 16 },
  attack: { base: 7, perFloor: 1.7 },
  defense: { base: 2, perFloor: 0.7 },
  gold: { base: 18, perFloor: 6 },
  /** 재료 드롭 확률 (층이 올라가도 그대로) */
  materialChance: 0.45,
}

/** 보스 배율 */
export const BOSS_SCALING = {
  hp: 2.4,
  attack: 1.35,
  defense: 1.5,
  gold: 3.5,
  /** 보스는 재료를 확정 지급한다 */
  materialChance: 1,
  /** 보스를 처음 잡으면 주는 추가 Gold */
  firstClearBonus: 150,
}

export interface MonsterTemplate {
  name: string
  description: string
  color: string
  accent: string
}

/** 일반 몬스터 템플릿. 층마다 순환하며 사용한다. */
export const NORMAL_TEMPLATES: MonsterTemplate[] = [
  { name: '이끼 슬라임', description: '미룬 일들이 뭉쳐 생긴 눅눅한 덩어리.', color: '#4ade80', accent: '#15803d' },
  { name: '먼지 뭉치', description: '치우지 않은 방 구석에서 자라났다.', color: '#a8a29e', accent: '#57534e' },
  { name: '늦잠 박쥐', description: '알람을 삼켜버린 밤의 방해꾼.', color: '#818cf8', accent: '#3730a3' },
  { name: '군것질 젤리', description: '달콤한 유혹이 굳어 생긴 몬스터.', color: '#f9a8d4', accent: '#be185d' },
  { name: '무기력 해파리', description: '닿으면 의욕이 빠져나간다.', color: '#67e8f9', accent: '#0e7490' },
  { name: '변명 거미', description: '핑계로 거미줄을 친다.', color: '#fdba74', accent: '#9a3412' },
  { name: '스크롤 벌레', description: '끝없이 화면을 내리게 만든다.', color: '#c4b5fd', accent: '#6d28d9' },
  { name: '한숨 유령', description: '지나가면 어깨가 무거워진다.', color: '#cbd5e1', accent: '#475569' },
]

export interface BossTemplate {
  name: string
  description: string
  color: string
  accent: string
  /** 공략 힌트 (지역 화면과 전투 화면에 같이 보여준다) */
  strategy: string
  /** 순서대로 반복하는 행동 패턴 */
  pattern: BossAction[]
}

const ATTACK: BossAction = {
  id: 'strike',
  label: '공격',
  intent: '평범한 공격',
  kind: 'attack',
  power: 1,
}

/**
 * 보스 템플릿. 10층마다 순환하며 사용한다.
 * 0~3번은 지역 보스라 지역에서 배우는 대응 방법과 짝이 맞는다.
 */
export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    name: '미루기 대왕',
    description: '"내일 하면 되잖아." 탑의 첫 번째 관문.',
    color: '#a78bfa',
    accent: '#5b21b6',
    strategy: '예고가 뜨면 방어. 강공격 다음 턴에는 빈틈이 생기니 그때 몰아치세요.',
    pattern: [
      ATTACK,
      {
        id: 'wind_up',
        label: '기운 모으기',
        intent: '다음 턴에 강공격을 준비한다',
        hint: '방어하거나 빛의 보호막을 켜세요',
        kind: 'charge',
      },
      {
        id: 'smash',
        label: '내려찍기',
        intent: '강공격!',
        hint: '방어하면 피해가 60% 줄어듭니다',
        kind: 'heavy',
        power: 1.9,
      },
      {
        id: 'overswing',
        label: '헛스윙',
        intent: '크게 휘두르고 비틀거린다 — 빈틈',
        hint: '지금 공격하면 피해가 60% 더 들어갑니다',
        kind: 'rest',
        selfStatus: { id: 'vulnerable', turns: 1, value: 0.6 },
      },
    ],
  },
  {
    name: '무한 스크롤 히드라',
    description: '머리를 하나 자르면 피드가 하나 더 늘어난다. 동굴 깊은 곳에 산다.',
    color: '#34d399',
    accent: '#065f46',
    strategy: '회복 준비가 뜬 다음 턴에 덩굴 묶기를 걸거나 큰 피해를 주면 회복을 막을 수 있습니다.',
    pattern: [
      {
        id: 'spore',
        label: '포자 뿌리기',
        intent: '포자를 뿌린다 — 중독',
        hint: '중독은 라운드마다 체력을 깎습니다. 지원형 펫이 풀어줄 수 있어요',
        kind: 'attack',
        power: 0.85,
        inflict: { id: 'poison', turns: 3, value: 0.05 },
      },
      ATTACK,
      {
        id: 'regrow_prep',
        label: '재생 준비',
        intent: '잘린 자리를 더듬으며 재생을 준비한다',
        hint: '다음 턴에 덩굴 묶기를 걸거나 최대 HP 12% 이상 피해를 주면 막습니다',
        kind: 'heal_prep',
      },
      {
        id: 'regrow',
        label: '재생',
        intent: '체력을 회복한다',
        hint: '덩굴 묶기 또는 큰 피해로 저지',
        kind: 'heal',
        healRatio: 0.14,
        interrupt: {
          damageRatio: 0.12,
          status: 'weaken',
          note: '덩굴 묶기로 묶거나, 이번 턴에 최대 HP의 12% 이상 피해',
        },
      },
      {
        id: 'lash',
        label: '휘감기',
        intent: '남은 머리로 후려친다',
        kind: 'attack',
        power: 1.15,
      },
    ],
  },
  {
    name: '새벽 돌풍새',
    description: '밤을 새우게 만드는 매서운 바람. 절벽 끝에서 날개를 펼친다.',
    color: '#7dd3fc',
    accent: '#0369a1',
    strategy: '돌풍 예고 턴에는 무조건 방어. 돌풍 뒤에는 지쳐서 크게 취약해집니다.',
    pattern: [
      ATTACK,
      {
        id: 'gust_prep',
        label: '날개 펼치기',
        intent: '날개를 크게 펼친다 — 돌풍 준비',
        hint: '방어하지 않으면 큰 피해를 입습니다',
        kind: 'charge',
      },
      {
        id: 'gust',
        label: '돌풍',
        intent: '절벽을 뒤흔드는 돌풍!',
        hint: '방어로 피해를 크게 줄일 수 있습니다',
        kind: 'heavy',
        power: 2.2,
      },
      {
        id: 'winded',
        label: '숨 고르기',
        intent: '날개를 접고 숨을 고른다 — 지친 상태',
        hint: '2턴 동안 받는 피해가 70% 늘어납니다. 지금 몰아치세요',
        kind: 'rest',
        selfStatus: { id: 'vulnerable', turns: 2, value: 0.7 },
      },
    ],
  },
  {
    name: '완벽주의 골렘',
    description: '시작조차 못 하게 만드는 거대한 벽. 별빛 유적의 수호자.',
    color: '#94a3b8',
    accent: '#1e293b',
    strategy: '보호막 단계에는 집중을 모아두고, 장치가 멈춘 턴에 모아둔 한 방을 터뜨리세요.',
    pattern: [
      {
        id: 'ward_up',
        label: '보호막 전개',
        intent: '고대 장치가 돌며 보호막을 두른다',
        hint: '2턴 동안 피해가 60% 줄어듭니다. 지금은 집중을 모아두세요',
        kind: 'guard',
        selfStatus: { id: 'guard', turns: 2, value: 0.6 },
      },
      { ...ATTACK, id: 'tap', label: '견제', intent: '가볍게 견제한다', power: 0.8 },
      { ...ATTACK, id: 'tap2', label: '견제', intent: '가볍게 견제한다', power: 0.8 },
      {
        id: 'ward_down',
        label: '장치 정지',
        intent: '장치가 멈추고 보호막이 꺼진다 — 약점 노출',
        hint: '모아둔 집중을 지금 터뜨리세요',
        kind: 'rest',
        selfStatus: { id: 'vulnerable', turns: 1, value: 0.5 },
      },
      {
        id: 'charge_up',
        label: '충전',
        intent: '장치가 붉게 달아오른다 — 강공격 준비',
        hint: '방어하거나 보호막을 켜세요',
        kind: 'charge',
      },
      {
        id: 'slam',
        label: '별빛 강타',
        intent: '강공격!',
        hint: '방어로 피해를 줄이세요',
        kind: 'heavy',
        power: 1.8,
      },
    ],
  },
  {
    name: '번아웃 드래곤',
    description: '탑 꼭대기에서 모든 것을 태워버린 용.',
    color: '#f87171',
    accent: '#7f1d1d',
    strategy: '지금까지 배운 방어·저지·집중을 모두 섞어야 넘어갈 수 있습니다.',
    pattern: [
      {
        id: 'scorch',
        label: '그을리기',
        intent: '불티를 흩뿌린다 — 중독',
        kind: 'attack',
        power: 1,
        inflict: { id: 'poison', turns: 2, value: 0.05 },
      },
      {
        id: 'ember_prep',
        label: '불씨 모으기',
        intent: '불씨를 삼키며 회복을 준비한다',
        hint: '다음 턴에 덩굴 묶기 또는 큰 피해로 저지',
        kind: 'heal_prep',
      },
      {
        id: 'ember_heal',
        label: '재점화',
        intent: '체력을 회복한다',
        kind: 'heal',
        healRatio: 0.1,
        interrupt: {
          damageRatio: 0.1,
          status: 'weaken',
          note: '덩굴 묶기로 묶거나, 이번 턴에 최대 HP의 10% 이상 피해',
        },
      },
      {
        id: 'roar',
        label: '포효',
        intent: '숨을 크게 들이마신다 — 강공격 준비',
        hint: '방어 준비',
        kind: 'charge',
      },
      {
        id: 'breath',
        label: '브레스',
        intent: '강공격!',
        kind: 'heavy',
        power: 2,
      },
    ],
  },
]
