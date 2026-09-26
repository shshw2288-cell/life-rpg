/**
 * 펫 시스템 설정.
 * 알 부화와 뽑기로 펫을 모으고, 동행으로 지정한 1마리의 효과가 실제 게임에 적용된다.
 */

export type PetGrade = 'S' | 'A' | 'B' | 'C'

/** 펫 효과 종류. 생산성 2종 + 전투 5종. */
export type PetEffectType = 'exp' | 'gold' | 'attack' | 'hp' | 'crit' | 'defense' | 'mp'

export const EFFECT_LABEL: Record<PetEffectType, string> = {
  exp: '과제 EXP',
  gold: '획득 Gold',
  attack: '전투 공격',
  hp: '전투 HP',
  crit: '치명타 확률',
  defense: '전투 방어',
  mp: '최대 MP',
}

/** 퍼센트로 표시하는 효과인지 */
export const EFFECT_IS_PERCENT: Record<PetEffectType, boolean> = {
  exp: true,
  gold: true,
  crit: true,
  attack: false,
  hp: false,
  defense: false,
  mp: false,
}

/** C 등급 기준값. 등급 배율을 곱해서 실제 수치를 만든다. */
export const EFFECT_BASE: Record<PetEffectType, number> = {
  exp: 3,
  gold: 3,
  attack: 2,
  hp: 8,
  crit: 2,
  defense: 1,
  mp: 3,
}

export const GRADES: Record<
  PetGrade,
  {
    label: string
    /** 효과 배율 */
    multiplier: number
    /** 뽑기·부화 확률 (합이 1) */
    rate: number
    /** 중복으로 나왔을 때 돌려주는 Gold */
    duplicateGold: number
    color: string
    ring: string
  }
> = {
  S: { label: 'S', multiplier: 5.5, rate: 0.02, duplicateGold: 200, color: '#fbbf24', ring: 'border-amber-400' },
  A: { label: 'A', multiplier: 3.5, rate: 0.1, duplicateGold: 80, color: '#c084fc', ring: 'border-purple-400' },
  B: { label: 'B', multiplier: 2, rate: 0.3, duplicateGold: 40, color: '#60a5fa', ring: 'border-blue-400' },
  C: { label: 'C', multiplier: 1, rate: 0.58, duplicateGold: 20, color: '#94a3b8', ring: 'border-slate-500' },
}

export const GRADE_ORDER: PetGrade[] = ['S', 'A', 'B', 'C']

/** 등급과 효과 종류로 실제 효과 수치를 만든다 */
export function effectValue(grade: PetGrade, type: PetEffectType): number {
  return Math.round(EFFECT_BASE[type] * GRADES[grade].multiplier)
}

export interface PetSpecies {
  id: string
  name: string
  description: string
  grade: PetGrade
  effect: PetEffectType
  color: string
  accent: string
  /** 외형 구분 */
  shape: 'blob' | 'ear' | 'wing' | 'horn'
  /** 뽑기 풀에서 빼는 종. 지역 보상 등으로만 얻는다. */
  exclusive?: boolean
}

/**
 * 펫 도감. 36종.
 * mochi·ember·tide·nova는 이전 버전에서 쓰던 id라 그대로 남겨 기존 저장 데이터를 지킨다.
 */
export const PET_SPECIES: PetSpecies[] = [
  // ── C 등급 14종 ─────────────────────────────
  { id: 'mochi', name: '모찌', description: '동글동글한 초록 친구. 곁에 있으면 마음이 편안해진다.', grade: 'C', effect: 'exp', color: '#86efac', accent: '#16a34a', shape: 'blob' },
  { id: 'ember', name: '잉걸', description: '작은 불씨 친구. 미루고 싶을 때 등을 떠민다.', grade: 'C', effect: 'gold', color: '#fdba74', accent: '#ea580c', shape: 'blob' },
  { id: 'tide', name: '물결', description: '느긋한 물빛 친구. 쉬어가는 법을 알려준다.', grade: 'C', effect: 'hp', color: '#7dd3fc', accent: '#0284c7', shape: 'blob' },
  { id: 'pebble', name: '조약돌', description: '말없이 굴러다니는 돌. 은근히 단단하다.', grade: 'C', effect: 'defense', color: '#cbd5e1', accent: '#64748b', shape: 'blob' },
  { id: 'moss_bean', name: '이끼콩', description: '햇빛만 있으면 어디서든 자라는 콩.', grade: 'C', effect: 'exp', color: '#a3e635', accent: '#4d7c0f', shape: 'ear' },
  { id: 'dewdrop', name: '이슬방울', description: '아침에만 나타나는 맑은 방울.', grade: 'C', effect: 'mp', color: '#a5f3fc', accent: '#0e7490', shape: 'blob' },
  { id: 'cotton', name: '솜뭉치', description: '폭신해서 부딪혀도 아프지 않다.', grade: 'C', effect: 'hp', color: '#f1f5f9', accent: '#94a3b8', shape: 'ear' },
  { id: 'firefly', name: '반디', description: '어두운 밤에 길을 밝혀주는 작은 빛.', grade: 'C', effect: 'crit', color: '#fef08a', accent: '#ca8a04', shape: 'wing' },
  { id: 'twiggy', name: '잔가지', description: '툭 부러질 것 같지만 제법 야무지게 때린다.', grade: 'C', effect: 'attack', color: '#d6d3d1', accent: '#78716c', shape: 'horn' },
  { id: 'mole', name: '두더', description: '땅속에서 반짝이는 걸 곧잘 주워온다.', grade: 'C', effect: 'gold', color: '#d8b4a0', accent: '#78350f', shape: 'ear' },
  { id: 'puff', name: '보풀', description: '주머니에서 나온 먼지가 살아난 친구.', grade: 'C', effect: 'exp', color: '#e2e8f0', accent: '#64748b', shape: 'blob' },
  { id: 'snail', name: '달팽', description: '느리지만 절대 멈추지 않는다.', grade: 'C', effect: 'defense', color: '#bbf7d0', accent: '#15803d', shape: 'horn' },
  { id: 'spark', name: '불티', description: '가만히 있어도 탁탁 튄다.', grade: 'C', effect: 'attack', color: '#fca5a5', accent: '#b91c1c', shape: 'wing' },
  { id: 'bubble', name: '물거품', description: '터질 듯 터지지 않는 신기한 거품.', grade: 'C', effect: 'mp', color: '#bae6fd', accent: '#0369a1', shape: 'blob' },

  // ── B 등급 12종 ─────────────────────────────
  { id: 'leaf_fox', name: '잎여우', description: '나뭇잎 꼬리로 계절을 알려주는 여우.', grade: 'B', effect: 'exp', color: '#86efac', accent: '#15803d', shape: 'ear' },
  { id: 'lantern', name: '등불이', description: '밤늦게 공부할 때 옆을 지켜준다.', grade: 'B', effect: 'gold', color: '#fde68a', accent: '#b45309', shape: 'blob' },
  { id: 'clay_golem', name: '흙골렘', description: '흙으로 빚어진 작은 수호자.', grade: 'B', effect: 'defense', color: '#d6bfa6', accent: '#7c4a20', shape: 'horn' },
  { id: 'breeze', name: '산들', description: '지나가면 기분이 가벼워지는 바람.', grade: 'B', effect: 'crit', color: '#ccfbf1', accent: '#0d9488', shape: 'wing' },
  { id: 'cinder_cat', name: '잿고양', description: '재 속에서 자는 걸 좋아하는 고양이.', grade: 'B', effect: 'attack', color: '#fdba74', accent: '#9a3412', shape: 'ear' },
  { id: 'rainlet', name: '빗방울', description: '떨어질 때마다 작게 노래한다.', grade: 'B', effect: 'hp', color: '#93c5fd', accent: '#1d4ed8', shape: 'blob' },
  { id: 'moon_moth', name: '달나방', description: '달빛을 먹고 가루를 흩뿌린다.', grade: 'B', effect: 'mp', color: '#ddd6fe', accent: '#6d28d9', shape: 'wing' },
  { id: 'acorn_knight', name: '도토리 기사', description: '작은 몸으로 앞장서서 막아선다.', grade: 'B', effect: 'defense', color: '#fcd34d', accent: '#92400e', shape: 'horn' },
  { id: 'frost_pup', name: '서리강아지', description: '발자국마다 서리가 피어난다.', grade: 'B', effect: 'hp', color: '#bfdbfe', accent: '#1e40af', shape: 'ear' },
  { id: 'thunder_chick', name: '번개병아리', description: '삐약 소리와 함께 불꽃이 튄다.', grade: 'B', effect: 'attack', color: '#fde047', accent: '#a16207', shape: 'wing' },
  { id: 'moss_owl', name: '이끼부엉', description: '오래된 숲의 기억을 알려준다.', grade: 'B', effect: 'exp', color: '#a7f3d0', accent: '#047857', shape: 'wing' },
  { id: 'coin_crab', name: '동전게', description: '집게로 동전을 모으는 버릇이 있다.', grade: 'B', effect: 'gold', color: '#fcd34d', accent: '#b45309', shape: 'horn' },
  // 버섯 동굴을 처음 깨면 확정으로 합류한다. 뽑기로는 나오지 않는다.
  { id: 'spore_cap', name: '포자모자', description: '버섯 동굴의 빛나는 포자에서 태어난 친구. 상처에 포자를 덮어 아물게 한다.', grade: 'B', effect: 'hp', color: '#86efac', accent: '#166534', shape: 'blob', exclusive: true },

  // ── A 등급 7종 ─────────────────────────────
  { id: 'nova', name: '노바', description: '별에서 떨어진 친구. 좀처럼 만나기 어렵다.', grade: 'A', effect: 'crit', color: '#d8b4fe', accent: '#9333ea', shape: 'wing' },
  { id: 'aurora_deer', name: '오로라 사슴', description: '뿔에 밤하늘의 빛을 걸고 다닌다.', grade: 'A', effect: 'exp', color: '#a5b4fc', accent: '#4338ca', shape: 'horn' },
  { id: 'magma_bear', name: '마그마 곰', description: '화산 아래에서 잠들어 있던 곰.', grade: 'A', effect: 'attack', color: '#fb923c', accent: '#7c2d12', shape: 'ear' },
  { id: 'tide_serpent', name: '해류뱀', description: '깊은 바다의 흐름을 타고 움직인다.', grade: 'A', effect: 'hp', color: '#38bdf8', accent: '#075985', shape: 'horn' },
  { id: 'clockwork_owl', name: '태엽부엉', description: '째깍이며 다음 할 일을 일러준다.', grade: 'A', effect: 'mp', color: '#fbbf24', accent: '#78350f', shape: 'wing' },
  { id: 'gilded_fox', name: '금빛여우', description: '꼬리를 흔들 때마다 금가루가 떨어진다.', grade: 'A', effect: 'gold', color: '#fcd34d', accent: '#a16207', shape: 'ear' },
  { id: 'stone_guardian', name: '바위수호자', description: '한번 자리를 잡으면 물러서지 않는다.', grade: 'A', effect: 'defense', color: '#a8a29e', accent: '#44403c', shape: 'horn' },

  // ── S 등급 3종 ─────────────────────────────
  { id: 'celestial_spirit', name: '별빛 정령', description: '수많은 하루가 모여 태어난 빛. 함께 있으면 배움이 빨라진다.', grade: 'S', effect: 'exp', color: '#f0abfc', accent: '#a21caf', shape: 'wing' },
  { id: 'eclipse_dragon', name: '월식룡', description: '달을 삼킨 용. 그 앞에서는 어떤 몬스터도 움츠러든다.', grade: 'S', effect: 'attack', color: '#818cf8', accent: '#312e81', shape: 'horn' },
  { id: 'chrono_phoenix', name: '시간불사조', description: '타오르며 다시 태어나기를 반복한다. 결정적 순간을 놓치지 않는다.', grade: 'S', effect: 'crit', color: '#fb7185', accent: '#9f1239', shape: 'wing' },
]

export function findSpecies(id: string): PetSpecies | undefined {
  return PET_SPECIES.find((species) => species.id === id)
}

export function speciesByGrade(grade: PetGrade): PetSpecies[] {
  return PET_SPECIES.filter((species) => species.grade === grade)
}

/** 뽑기·부화로 나올 수 있는 종만. 지역 보상 전용 펫은 빠진다. */
export function gachaPool(grade: PetGrade): PetSpecies[] {
  return PET_SPECIES.filter((species) => species.grade === grade && !species.exclusive)
}

/** 알 부화 규칙 */
export const PET_RULES = {
  /** 과제 완료 1회당 알이 나올 확률 */
  eggDropChance: 0.12,
  /** 알 하나를 부화시키는 데 필요한 완료 횟수 */
  hatchRequirement: 10,
  /** 동시에 품을 수 있는 알 개수 */
  maxEggs: 3,
  /** 부화할 때 함께 주는 뽑기권 */
  ticketPerHatch: 1,
}

/** 뽑기 규칙 */
export const GACHA = {
  /** 처음 시작할 때 주는 뽑기권 */
  startingTickets: 5,
  /** 한 번에 여러 번 뽑기 */
  multiDrawCount: 5,
  /** 5연차에서 마지막 한 번은 이 등급 이상 확정 */
  multiDrawGuarantee: 'B' as PetGrade,
  /** Gold로 뽑기권 사기 */
  ticketGoldCost: 150,
}
