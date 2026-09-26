import { AlertTriangle, FlaskConical, Shield, Sparkles, Swords } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ACTIONS, MATERIALS } from '../../data/battleConfig'
import { SHOP_ITEMS } from '../../data/shopConfig'
import { stageForLevel } from '../../engine/evolution'
import { useGameStore } from '../../store/useGameStore'
import type { BattleState } from '../../types/battle'
import { useBattleAnimStore } from './battleAnimStore'
import { BattleStage } from './BattleStage'

function StatBar({
  label,
  current,
  max,
  tone,
}: {
  label: string
  current: number
  max: number
  tone: 'hp' | 'mp' | 'monster'
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0
  const fill = {
    hp: 'from-rose-500 to-red-600',
    mp: 'from-sky-400 to-indigo-500',
    monster: 'from-lime-400 to-emerald-600',
  }[tone]

  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-[11px] font-bold text-slate-400">{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-3.5 flex-1 overflow-hidden rounded-full border border-black/50 bg-abyss-950"
      >
        <div
          className={`h-full rounded-full bg-gradient-to-b ${fill} transition-[width] duration-500`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-300">
        {current} / {max}
      </span>
    </div>
  )
}

export function BattleView({ battle }: { battle: BattleState }) {
  const level = useGameStore((state) => state.character.level)
  const inventory = useGameStore((state) => state.inventory)
  const battleAction = useGameStore((state) => state.battleAction)
  const useBattleItem = useGameStore((state) => state.useBattleItem)
  const leaveBattle = useGameStore((state) => state.leaveBattle)
  const playing = useBattleAnimStore((state) => state.playing)

  const [logOpen, setLogOpen] = useState(false)
  const logRef = useRef<HTMLOListElement>(null)

  const monster = battle.monsterDef
  const stage = stageForLevel(level)
  const usableItems = SHOP_ITEMS.filter(
    (item) => item.usableInBattle && (inventory[item.id] ?? 0) > 0,
  )
  const hasRevive = (inventory.revive_charm ?? 0) > 0
  const finished = battle.status !== 'active'
  const canUseSkill = battle.player.mp >= ACTIONS.skill.mpCost
  // 연출이 도는 동안에는 버튼을 잠근다
  const locked = playing || finished

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [battle.log.length, logOpen])

  if (!monster) return null

  return (
    <div className="flex flex-col gap-3">
      <BattleStage battle={battle} />

      {/* 상태 표시 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-abyss-700 bg-abyss-900/90 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-100">{stage.name}</p>
            <span className="text-[11px] text-slate-500">Lv.{level}</span>
          </div>
          <div className="space-y-1.5">
            <StatBar label="HP" current={battle.player.hp} max={battle.player.maxHp} tone="hp" />
            <StatBar label="MP" current={battle.player.mp} max={battle.player.maxMp} tone="mp" />
          </div>
          {hasRevive && (
            <p className="mt-2 text-[11px] text-emerald-400">
              부활의 부적 대기 중 — 쓰러질 때 자동으로 사용됩니다
            </p>
          )}
        </div>

        <div className="rounded-xl border border-abyss-700 bg-abyss-900/90 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-100">{monster.name}</p>
            {monster.isBoss && (
              <span className="rounded bg-rose-600/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                BOSS
              </span>
            )}
          </div>
          <StatBar
            label="HP"
            current={battle.monster.hp}
            max={battle.monster.maxHp}
            tone="monster"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            공격 {monster.attack} · 방어 {monster.defense}
          </p>
        </div>
      </div>

      {/* 강공격 예고 */}
      {battle.monsterCharging && !finished && (
        <div className="flex items-center gap-2 rounded-xl border-2 border-amber-500/70 bg-amber-500/15 px-3 py-2">
          <AlertTriangle size={18} className="shrink-0 text-amber-400" aria-hidden />
          <p className="text-sm font-bold text-amber-300">
            {monster.name}이(가) 기운을 모으고 있습니다 — 다음 턴 강공격!
            <span className="ml-1 font-normal text-amber-200/80">방어를 고려하세요.</span>
          </p>
        </div>
      )}

      {/* 조작 패널 */}
      <div className="rounded-xl border border-abyss-700 bg-abyss-900 p-3">
        {finished ? (
          <div className="flex flex-col gap-3">
            <p
              className={`text-lg font-black ${
                battle.status === 'won' ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {battle.status === 'won' ? '승리했습니다!' : '패배했습니다.'}
            </p>
            {battle.status === 'won' && battle.rewards && (
              <ul className="flex flex-wrap gap-3 text-sm text-slate-200">
                <li className="rounded-lg bg-abyss-800 px-3 py-1.5 text-gold-400">
                  +{battle.rewards.gold} Gold
                </li>
                {battle.rewards.firstClearBonus && (
                  <li className="rounded-lg bg-abyss-800 px-3 py-1.5 text-ember-400">
                    첫 격파 보너스 +{battle.rewards.firstClearBonus}
                  </li>
                )}
                {Object.entries(battle.rewards.materials).map(([id, amount]) => (
                  <li key={id} className="rounded-lg bg-abyss-800 px-3 py-1.5">
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
              className="w-fit rounded-xl bg-ember-500 px-5 py-2.5 text-sm font-bold text-abyss-950 transition-transform hover:bg-ember-400 active:scale-95"
            >
              탑 입구로
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <ActionButton
                icon={<Swords size={20} aria-hidden />}
                label="공격"
                hint={`MP +${ACTIONS.attack.mpGain}`}
                tone="attack"
                onClick={() => battleAction('attack')}
                disabled={locked}
                disabledHint={playing ? '연출 중…' : undefined}
              />
              <ActionButton
                icon={<Shield size={20} aria-hidden />}
                label="방어"
                hint={`피해 ${Math.round((1 - ACTIONS.defend.damageTaken) * 100)}% 감소 · MP +${ACTIONS.defend.mpGain}`}
                tone="defend"
                onClick={() => battleAction('defend')}
                disabled={locked}
                disabledHint={playing ? '연출 중…' : undefined}
              />
              <ActionButton
                icon={<Sparkles size={20} aria-hidden />}
                label={ACTIONS.skill.name}
                hint={`MP ${ACTIONS.skill.mpCost} 소비 · 강한 피해`}
                tone="skill"
                onClick={() => battleAction('skill')}
                disabled={locked || !canUseSkill}
                disabledHint={playing ? '연출 중…' : 'MP 부족'}
              />
            </div>

            {usableItems.length > 0 && (
              <div className="mt-3 border-t border-abyss-700 pt-3">
                <p className="mb-2 text-xs text-slate-400">아이템 (한 턴 소모)</p>
                <div className="flex flex-wrap gap-2">
                  {usableItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => useBattleItem(item.id)}
                      disabled={locked}
                      className="flex min-h-11 items-center gap-1.5 rounded-lg border border-abyss-700 bg-abyss-800 px-3 py-2 text-xs text-slate-200 transition-colors hover:border-emerald-500 hover:bg-abyss-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FlaskConical size={14} aria-hidden className="text-emerald-400" />
                      {item.name}
                      <span className="text-slate-500">x{inventory[item.id]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 전투 기록은 보조 정보로 접어 둔다 */}
      <div className="rounded-xl border border-abyss-700 bg-abyss-900/70">
        <button
          type="button"
          onClick={() => setLogOpen((open) => !open)}
          aria-expanded={logOpen}
          className="flex w-full items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
        >
          <span>전투 기록 ({battle.log.length})</span>
          <span aria-hidden>{logOpen ? '접기' : '펼치기'}</span>
        </button>
        {logOpen && (
          <ol
            ref={logRef}
            className="max-h-40 space-y-1 overflow-y-auto border-t border-abyss-800 px-3 py-2 text-xs"
            aria-live="polite"
          >
            {battle.log.map((entry, index) => (
              <li
                key={index}
                className={
                  entry.side === 'player'
                    ? 'text-sky-300'
                    : entry.side === 'monster'
                      ? 'text-rose-300'
                      : 'text-slate-400'
                }
              >
                <span className="mr-1.5 text-slate-600">{entry.turn}T</span>
                {entry.text}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

const TONE_CLASS = {
  attack: 'border-rose-500/60 hover:border-rose-400 hover:bg-rose-500/15 text-rose-200',
  defend: 'border-sky-500/60 hover:border-sky-400 hover:bg-sky-500/15 text-sky-200',
  skill: 'border-violet-500/60 hover:border-violet-400 hover:bg-violet-500/15 text-violet-200',
} as const

function ActionButton({
  icon,
  label,
  hint,
  tone,
  onClick,
  disabled = false,
  disabledHint,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  tone: keyof typeof TONE_CLASS
  onClick: () => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-16 flex-col items-start justify-center gap-0.5 rounded-xl border-2 bg-abyss-800/80 px-4 py-3 text-left transition-all active:scale-95 disabled:cursor-not-allowed disabled:border-abyss-700 disabled:bg-abyss-800/40 disabled:text-slate-500 ${TONE_CLASS[tone]}`}
    >
      <span className="flex items-center gap-2 text-base font-bold">
        {icon}
        {label}
      </span>
      <span className="text-[11px] opacity-80">{disabled ? (disabledHint ?? hint) : hint}</span>
    </button>
  )
}
