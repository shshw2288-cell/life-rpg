import { FlaskConical, Shield, Sparkles, Swords } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { LumiAvatar } from '../../components/character/LumiAvatar'
import { ACTIONS, MATERIALS } from '../../data/battleConfig'
import { SHOP_ITEMS } from '../../data/shopConfig'
import { stageForLevel } from '../../engine/evolution'
import { useGameStore } from '../../store/useGameStore'
import type { BattleState } from '../../types/battle'
import { MonsterSprite } from './MonsterSprite'

function Bar({
  label,
  current,
  max,
  tone,
}: {
  label: string
  current: number
  max: number
  tone: 'vital' | 'mana' | 'monster'
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0
  const color =
    tone === 'vital' ? 'bg-vital-500' : tone === 'mana' ? 'bg-mana-500' : 'bg-emerald-500'
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="tabular-nums text-slate-300">
          {current} / {max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2.5 w-full overflow-hidden rounded-full bg-abyss-700"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${color}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  )
}

export function BattleView({ battle }: { battle: BattleState }) {
  const level = useGameStore((state) => state.character.level)
  const cosmetics = useGameStore((state) => state.cosmetics)
  const inventory = useGameStore((state) => state.inventory)
  const battleAction = useGameStore((state) => state.battleAction)
  const useBattleItem = useGameStore((state) => state.useBattleItem)
  const leaveBattle = useGameStore((state) => state.leaveBattle)
  const logRef = useRef<HTMLOListElement>(null)

  const monster = battle.monsterDef
  const stage = stageForLevel(level)
  const usableItems = SHOP_ITEMS.filter(
    (item) => item.usableInBattle && (inventory[item.id] ?? 0) > 0,
  )
  const hasRevive = (inventory.revive_charm ?? 0) > 0
  const finished = battle.status !== 'active'
  const canUseSkill = battle.player.mp >= ACTIONS.skill.mpCost

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [battle.log.length])

  if (!monster) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-abyss-700 bg-abyss-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-abyss-700 px-2.5 py-1 text-xs font-semibold text-slate-200">
              {battle.floor}층 · {battle.turn}턴
            </span>
            {monster.isBoss && (
              <span className="rounded-md bg-ember-500/20 px-2 py-1 text-xs font-bold text-ember-400">
                BOSS
              </span>
            )}
            {hasRevive && (
              <span className="rounded-md bg-abyss-800 px-2 py-1 text-[11px] text-emerald-400">
                부활의 부적 대기 중
              </span>
            )}
          </div>
          {battle.monsterCharging && !finished && (
            <span className="rounded-md bg-ember-500/20 px-2.5 py-1 text-xs text-ember-400">
              다음 턴 강공격 예고 — 방어를 고려하세요
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 items-end gap-6">
          <div className="flex flex-col items-center gap-2">
            <LumiAvatar
              stage={stage}
              size={132}
              fainted={battle.status === 'lost'}
              cosmetics={cosmetics}
            />
            <p className="text-sm font-semibold text-slate-100">{stage.name}</p>
            <div className="w-full space-y-2">
              <Bar label="전투 HP" current={battle.player.hp} max={battle.player.maxHp} tone="vital" />
              <Bar label="MP" current={battle.player.mp} max={battle.player.maxMp} tone="mana" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <MonsterSprite
              monster={monster}
              charging={battle.monsterCharging && !finished}
              defeated={battle.monster.hp <= 0}
            />
            <p className="text-sm font-semibold text-slate-100">{monster.name}</p>
            <div className="w-full">
              <Bar
                label="몬스터 HP"
                current={battle.monster.hp}
                max={battle.monster.maxHp}
                tone="monster"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="rounded-xl border border-abyss-700 bg-abyss-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">행동 선택</h2>

          {finished ? (
            <div className="flex flex-col gap-3">
              <p
                className={`text-sm font-semibold ${
                  battle.status === 'won' ? 'text-ember-400' : 'text-vital-400'
                }`}
              >
                {battle.status === 'won' ? '승리했습니다!' : '패배했습니다.'}
              </p>
              {battle.status === 'won' && battle.rewards && (
                <ul className="text-sm text-slate-300">
                  <li>+{battle.rewards.gold} Gold</li>
                  {battle.rewards.firstClearBonus && (
                    <li className="text-ember-400">
                      보스 첫 격파 보너스 포함 (+{battle.rewards.firstClearBonus})
                    </li>
                  )}
                  {Object.entries(battle.rewards.materials).map(([id, amount]) => (
                    <li key={id}>
                      {MATERIALS[id]?.name ?? id} x{amount}
                    </li>
                  ))}
                </ul>
              )}
              {battle.status === 'lost' && (
                <p className="text-xs text-slate-400">
                  전투 HP는 던전 안에서만 쓰는 값입니다. 생활 HP와 과제 기록은 그대로입니다.
                </p>
              )}
              <button
                type="button"
                onClick={leaveBattle}
                className="w-fit rounded-lg bg-ember-500 px-4 py-2 text-sm font-semibold text-abyss-950 hover:bg-ember-400"
              >
                던전 입구로
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <ActionButton
                icon={<Swords size={16} aria-hidden />}
                label="공격"
                hint={`MP +${ACTIONS.attack.mpGain}`}
                onClick={() => battleAction('attack')}
              />
              <ActionButton
                icon={<Shield size={16} aria-hidden />}
                label="방어"
                hint={`피해 ${Math.round((1 - ACTIONS.defend.damageTaken) * 100)}% 감소 · MP +${ACTIONS.defend.mpGain}`}
                onClick={() => battleAction('defend')}
              />
              <ActionButton
                icon={<Sparkles size={16} aria-hidden />}
                label={ACTIONS.skill.name}
                hint={`MP ${ACTIONS.skill.mpCost} 소비 · 강한 피해`}
                onClick={() => battleAction('skill')}
                disabled={!canUseSkill}
                disabledHint="MP 부족"
              />
            </div>
          )}

          {!finished && usableItems.length > 0 && (
            <div className="mt-3 border-t border-abyss-700 pt-3">
              <p className="mb-2 text-xs text-slate-400">아이템 (한 턴 소모)</p>
              <div className="flex flex-wrap gap-2">
                {usableItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => useBattleItem(item.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-abyss-700 bg-abyss-800 px-3 py-1.5 text-xs text-slate-200 hover:border-emerald-500 hover:bg-abyss-700"
                  >
                    <FlaskConical size={13} aria-hidden className="text-emerald-400" />
                    {item.name}
                    <span className="text-slate-500">x{inventory[item.id]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-abyss-700 bg-abyss-900 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">전투 기록</h2>
          <ol
            ref={logRef}
            className="max-h-64 space-y-1 overflow-y-auto text-xs"
            aria-live="polite"
          >
            {battle.log.map((entry, index) => (
              <li
                key={index}
                className={
                  entry.side === 'player'
                    ? 'text-mana-400'
                    : entry.side === 'monster'
                      ? 'text-vital-400'
                      : 'text-slate-400'
                }
              >
                <span className="mr-1.5 text-slate-600">{entry.turn}T</span>
                {entry.text}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  hint,
  onClick,
  disabled = false,
  disabledHint,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  onClick: () => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start gap-1 rounded-xl border border-abyss-700 bg-abyss-800 px-3 py-2.5 text-left transition-colors hover:border-ember-500 hover:bg-abyss-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-abyss-700 disabled:hover:bg-abyss-800"
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        {icon}
        {label}
      </span>
      <span className="text-[11px] text-slate-400">{disabled ? (disabledHint ?? hint) : hint}</span>
    </button>
  )
}
