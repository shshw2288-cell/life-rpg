/** 상점 설정. 가격과 효과는 모두 여기서 조정한다. */

export type ItemEffect =
  | { kind: 'heal'; ratio: number }
  | { kind: 'mana'; ratio: number }
  | { kind: 'revive'; ratio: number }
  | { kind: 'ticket' }
  | { kind: 'entry' }

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  effect: ItemEffect
  /** 전투 중에 쓸 수 있는가 */
  usableInBattle: boolean
  icon: 'potion' | 'elixir' | 'charm' | 'ticket' | 'key'
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'small_potion',
    name: '이슬 물약',
    description: '전투 HP를 40% 회복한다. 전투 중 사용.',
    price: 60,
    effect: { kind: 'heal', ratio: 0.4 },
    usableInBattle: true,
    icon: 'potion',
  },
  {
    id: 'large_potion',
    name: '샘물 물약',
    description: '전투 HP를 80% 회복한다. 전투 중 사용.',
    price: 140,
    effect: { kind: 'heal', ratio: 0.8 },
    usableInBattle: true,
    icon: 'potion',
  },
  {
    id: 'mp_elixir',
    name: '별빛 엘릭서',
    description: 'MP를 가득 채운다. 전투 중 사용.',
    price: 90,
    effect: { kind: 'mana', ratio: 1 },
    usableInBattle: true,
    icon: 'elixir',
  },
  {
    id: 'revive_charm',
    name: '부활의 부적',
    description: '전투에서 쓰러질 때 자동으로 소모되어 HP 50%로 다시 일어선다.',
    price: 250,
    effect: { kind: 'revive', ratio: 0.5 },
    usableInBattle: false,
    icon: 'charm',
  },
  {
    id: 'gacha_ticket',
    name: '펫 뽑기권',
    description: '펫을 한 번 뽑을 수 있다.',
    price: 150,
    effect: { kind: 'ticket' },
    usableInBattle: false,
    icon: 'ticket',
  },
  {
    id: 'tower_key',
    name: '탑의 열쇠',
    description: '오늘 탑에 한 번 더 들어갈 수 있다. 하루 제한과 별개로 쌓인다.',
    price: 120,
    effect: { kind: 'entry' },
    usableInBattle: false,
    icon: 'key',
  },
]

export function findItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id)
}

/** 캐릭터 꾸미기 부위 */
export type CosmeticSlot = 'hat' | 'face' | 'aura'

export const SLOT_LABEL: Record<CosmeticSlot, string> = {
  hat: '모자',
  face: '얼굴',
  aura: '오라',
}

export interface Cosmetic {
  id: string
  name: string
  description: string
  slot: CosmeticSlot
  price: number
  /** 외형을 그릴 때 쓰는 값 */
  style: { primary: string; secondary?: string }
  /** 그리기 방식 */
  art:
    | 'straw_hat'
    | 'wizard_hat'
    | 'crown'
    | 'ribbon'
    | 'headphones'
    | 'glasses'
    | 'monocle'
    | 'blush'
    | 'firefly_aura'
    | 'stardust_aura'
    | 'flame_aura'
}

export const COSMETICS: Cosmetic[] = [
  // 모자
  { id: 'straw_hat', name: '밀짚모자', description: '햇살 아래 산책하는 기분.', slot: 'hat', price: 80, style: { primary: '#fcd34d', secondary: '#b45309' }, art: 'straw_hat' },
  { id: 'ribbon', name: '리본', description: '단정하게 하루를 시작하는 마음.', slot: 'hat', price: 120, style: { primary: '#f472b6', secondary: '#be185d' }, art: 'ribbon' },
  { id: 'wizard_hat', name: '마법사 모자', description: '별이 수놓인 뾰족 모자.', slot: 'hat', price: 260, style: { primary: '#6366f1', secondary: '#312e81' }, art: 'wizard_hat' },
  { id: 'headphones', name: '헤드폰', description: '집중할 때 쓰는 커다란 헤드폰.', slot: 'hat', price: 200, style: { primary: '#38bdf8', secondary: '#075985' }, art: 'headphones' },
  { id: 'crown', name: '왕관', description: '연속 수행일을 지켜낸 자의 증표.', slot: 'hat', price: 700, style: { primary: '#fbbf24', secondary: '#b45309' }, art: 'crown' },

  // 얼굴
  { id: 'glasses', name: '동그란 안경', description: '괜히 똑똑해 보인다.', slot: 'face', price: 150, style: { primary: '#e2e8f0' }, art: 'glasses' },
  { id: 'monocle', name: '외알 안경', description: '품위 있는 루미.', slot: 'face', price: 320, style: { primary: '#fcd34d' }, art: 'monocle' },
  { id: 'blush', name: '발그레 볼', description: '언제나 기분 좋아 보이는 볼.', slot: 'face', price: 90, style: { primary: '#fb7185' }, art: 'blush' },

  // 오라
  { id: 'firefly_aura', name: '반딧불 오라', description: '주위를 맴도는 작은 불빛.', slot: 'aura', price: 280, style: { primary: '#fde68a' }, art: 'firefly_aura' },
  { id: 'stardust_aura', name: '별가루 오라', description: '걸음마다 별이 떨어진다.', slot: 'aura', price: 520, style: { primary: '#c4b5fd' }, art: 'stardust_aura' },
  { id: 'flame_aura', name: '불꽃 오라', description: '의욕이 타오르는 사람에게.', slot: 'aura', price: 820, style: { primary: '#fb923c' }, art: 'flame_aura' },
]

export function findCosmetic(id: string): Cosmetic | undefined {
  return COSMETICS.find((cosmetic) => cosmetic.id === id)
}
