import { Coins, FlaskConical, Key, Shirt, Sparkles, Ticket } from 'lucide-react'
import { useState } from 'react'
import { LumiAvatar } from '../components/character/LumiAvatar'
import { PageShell, Panel } from '../components/layout/PageShell'
import {
  COSMETICS,
  SHOP_ITEMS,
  SLOT_LABEL,
  type Cosmetic,
  type CosmeticSlot,
} from '../data/shopConfig'
import { stageForLevel } from '../engine/evolution'
import { useGameStore } from '../store/useGameStore'

const ITEM_ICON = {
  potion: FlaskConical,
  elixir: Sparkles,
  charm: Sparkles,
  ticket: Ticket,
  key: Key,
} as const

const SLOTS: CosmeticSlot[] = ['hat', 'face', 'aura']

export function ShopPage() {
  const {
    character,
    inventory,
    petTickets,
    towerKeys,
    ownedCosmetics,
    cosmetics,
    buyShopItem,
    buyCosmetic,
    equipCosmetic,
  } = useGameStore()
  const [tab, setTab] = useState<'items' | 'cosmetics'>('items')
  const stage = stageForLevel(character.level)

  return (
    <PageShell title="상점" description="던전과 과제로 모은 Gold를 씁니다.">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-lg bg-abyss-800 px-3 py-1.5 text-sm">
          <Coins size={16} className="text-gold-400" aria-hidden />
          <span className="tabular-nums text-slate-100">{character.gold.toLocaleString()}</span>
        </span>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setTab('items')}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              tab === 'items'
                ? 'border-ember-400 bg-abyss-700 font-semibold text-ember-400'
                : 'border-abyss-700 text-slate-400 hover:bg-abyss-800'
            }`}
          >
            <FlaskConical size={14} className="mr-1 inline" aria-hidden />
            아이템
          </button>
          <button
            type="button"
            onClick={() => setTab('cosmetics')}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              tab === 'cosmetics'
                ? 'border-ember-400 bg-abyss-700 font-semibold text-ember-400'
                : 'border-abyss-700 text-slate-400 hover:bg-abyss-800'
            }`}
          >
            <Shirt size={14} className="mr-1 inline" aria-hidden />
            꾸미기
          </button>
        </div>
      </div>

      {tab === 'items' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
          <Panel title="아이템">
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SHOP_ITEMS.map((item) => {
                const Icon = ITEM_ICON[item.icon]
                const affordable = character.gold >= item.price
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-abyss-700 bg-abyss-800/60 p-3"
                  >
                    <span className="rounded-lg bg-abyss-700 p-2 text-ember-400">
                      <Icon size={18} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100">{item.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{item.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs tabular-nums text-gold-400">{item.price} G</span>
                        <button
                          type="button"
                          onClick={() => buyShopItem(item.id)}
                          disabled={!affordable}
                          className="rounded-md bg-ember-500 px-2.5 py-1 text-xs font-semibold text-abyss-950 hover:bg-ember-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          구매
                        </button>
                        {item.effect.kind !== 'ticket' && item.effect.kind !== 'entry' && (
                          <span className="text-[11px] text-slate-500">
                            보유 {inventory[item.id] ?? 0}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="보유 현황">
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-400">펫 뽑기권</span>
                <span className="tabular-nums text-slate-200">{petTickets}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">탑의 열쇠</span>
                <span className="tabular-nums text-slate-200">{towerKeys}</span>
              </li>
              {SHOP_ITEMS.filter(
                (item) => item.effect.kind !== 'ticket' && item.effect.kind !== 'entry',
              ).map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span className="text-slate-400">{item.name}</span>
                  <span className="tabular-nums text-slate-200">{inventory[item.id] ?? 0}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-abyss-700 pt-2 text-[11px] text-slate-500">
              물약과 엘릭서는 전투 화면에서 쓸 수 있습니다. 부활의 부적은 쓰러질 때 자동으로
              소모됩니다.
            </p>
          </Panel>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          <Panel title="미리보기">
            <div className="flex flex-col items-center gap-3">
              <LumiAvatar stage={stage} size={170} cosmetics={cosmetics} />
              <p className="text-sm text-slate-300">{stage.name}</p>

              <div className="w-full space-y-2">
                {SLOTS.map((slot) => {
                  const equipped = cosmetics[slot]
                  return (
                    <div key={slot} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{SLOT_LABEL[slot]}</span>
                      {equipped ? (
                        <button
                          type="button"
                          onClick={() => equipCosmetic(slot, null)}
                          className="text-ember-400 underline underline-offset-2"
                        >
                          벗기
                        </button>
                      ) : (
                        <span className="text-slate-600">없음</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            {SLOTS.map((slot) => (
              <Panel key={slot} title={SLOT_LABEL[slot]}>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {COSMETICS.filter((cosmetic) => cosmetic.slot === slot).map((cosmetic) => (
                    <CosmeticCard
                      key={cosmetic.id}
                      cosmetic={cosmetic}
                      owned={ownedCosmetics.includes(cosmetic.id)}
                      equipped={cosmetics[slot] === cosmetic.id}
                      gold={character.gold}
                      onBuy={() => buyCosmetic(cosmetic.id)}
                      onEquip={() =>
                        equipCosmetic(slot, cosmetics[slot] === cosmetic.id ? null : cosmetic.id)
                      }
                    />
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  )
}

function CosmeticCard({
  cosmetic,
  owned,
  equipped,
  gold,
  onBuy,
  onEquip,
}: {
  cosmetic: Cosmetic
  owned: boolean
  equipped: boolean
  gold: number
  onBuy: () => void
  onEquip: () => void
}) {
  return (
    <li
      className={`flex flex-col gap-1.5 rounded-xl border p-3 ${
        equipped ? 'border-ember-400 bg-abyss-700' : 'border-abyss-700 bg-abyss-800/60'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: cosmetic.style.primary }}
          aria-hidden
        />
        <p className="text-sm font-semibold text-slate-100">{cosmetic.name}</p>
      </div>
      <p className="text-[11px] text-slate-400">{cosmetic.description}</p>

      {owned ? (
        <button
          type="button"
          onClick={onEquip}
          className={`mt-auto rounded-md px-2.5 py-1 text-xs font-semibold ${
            equipped
              ? 'bg-abyss-900 text-ember-400'
              : 'bg-abyss-700 text-slate-200 hover:bg-abyss-600'
          }`}
        >
          {equipped ? '착용 중 · 벗기' : '착용'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onBuy}
          disabled={gold < cosmetic.price}
          className="mt-auto rounded-md bg-ember-500 px-2.5 py-1 text-xs font-semibold text-abyss-950 hover:bg-ember-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {cosmetic.price} G
        </button>
      )}
    </li>
  )
}
