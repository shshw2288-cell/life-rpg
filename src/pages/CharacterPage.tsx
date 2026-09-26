import { Link } from 'react-router-dom'
import { LumiAvatar } from '../components/character/LumiAvatar'
import { PageShell, Panel } from '../components/layout/PageShell'
import { EVOLUTION_STAGES } from '../data/evolutionConfig'
import { COSMETICS, SLOT_LABEL, type CosmeticSlot } from '../data/shopConfig'
import { levelsUntilNextStage, nextStage, stageForLevel } from '../engine/evolution'
import { expForNextLevel } from '../engine/leveling'
import { useGameStore } from '../store/useGameStore'

const SLOTS: CosmeticSlot[] = ['hat', 'face', 'aura', 'cape']

export function CharacterPage() {
  const character = useGameStore((state) => state.character)
  const cosmetics = useGameStore((state) => state.cosmetics)
  const ownedCosmetics = useGameStore((state) => state.ownedCosmetics)
  const equipCosmetic = useGameStore((state) => state.equipCosmetic)
  const current = stageForLevel(character.level)
  const upcoming = nextStage(character.level)
  const remaining = levelsUntilNextStage(character.level)

  return (
    <PageShell title="캐릭터" description="과제를 완료해 레벨을 올리면 루미가 진화합니다.">
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_1fr]">
        {/* 왼쪽 칸: 현재 모습 + 꾸미기를 한 칸으로 묶는다 */}
        <div className="flex flex-col gap-4">
        <Panel title="현재 모습">
          <div className="flex flex-col items-center gap-3">
            <LumiAvatar
              stage={current}
              size={190}
              fainted={character.hp <= character.maxHp * 0.2}
              cosmetics={cosmetics}
            />
            <p className="text-lg font-bold text-slate-100">{current.name}</p>
            <p className="text-center text-sm text-slate-400">{current.description}</p>

            <dl className="mt-2 w-full space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">레벨</dt>
                <dd className="tabular-nums text-slate-100">{character.level}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">EXP</dt>
                <dd className="tabular-nums text-mana-400">
                  {character.exp} / {expForNextLevel(character.level)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">HP</dt>
                <dd className="tabular-nums text-vital-400">
                  {character.hp} / {character.maxHp}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Gold</dt>
                <dd className="tabular-nums text-gold-400">{character.gold.toLocaleString()}</dd>
              </div>
            </dl>

            <p className="mt-2 rounded-lg bg-abyss-800 px-3 py-2 text-center text-xs text-slate-300">
              {upcoming
                ? `다음 진화: ${upcoming.name} (레벨 ${upcoming.minLevel}, ${remaining}레벨 남음)`
                : '최종 형태에 도달했습니다.'}
            </p>
          </div>
        </Panel>

          <Panel title="꾸미기">
            {ownedCosmetics.length === 0 ? (
              <p className="text-sm text-slate-400">
                아직 가진 꾸미기가 없습니다.{' '}
                <Link to="/shop" className="text-ember-400 underline underline-offset-2">
                  상점
                </Link>
                에서 살 수 있습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {SLOTS.map((slot) => {
                  const owned = COSMETICS.filter(
                    (cosmetic) => cosmetic.slot === slot && ownedCosmetics.includes(cosmetic.id),
                  )
                  if (owned.length === 0) return null
                  return (
                    <div key={slot}>
                      <p className="mb-1.5 text-xs text-slate-400">{SLOT_LABEL[slot]}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {owned.map((cosmetic) => {
                          const equipped = cosmetics[slot] === cosmetic.id
                          return (
                            <button
                              key={cosmetic.id}
                              type="button"
                              aria-pressed={equipped}
                              onClick={() => equipCosmetic(slot, equipped ? null : cosmetic.id)}
                              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                                equipped
                                  ? 'border-ember-400 bg-abyss-700 font-semibold text-ember-400'
                                  : 'border-abyss-700 text-slate-300 hover:bg-abyss-800'
                              }`}
                            >
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: cosmetic.style.primary }}
                                aria-hidden
                              />
                              {cosmetic.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="진화 단계">
          <ol className="space-y-3">
            {EVOLUTION_STAGES.map((stage) => {
              const reached = character.level >= stage.minLevel
              const isCurrent = stage.id === current.id
              return (
                <li
                  key={stage.id}
                  className={`flex items-start gap-4 rounded-xl border p-3 ${
                    isCurrent
                      ? 'border-ember-500 bg-abyss-800'
                      : reached
                        ? 'border-abyss-700 bg-abyss-900'
                        : 'border-abyss-800 bg-abyss-900/40'
                  }`}
                >
                  <div className={reached ? '' : 'opacity-25 grayscale'}>
                    <LumiAvatar stage={stage} size={78} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-100">{stage.name}</h3>
                      <span className="rounded bg-abyss-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                        Lv.{stage.minLevel}부터
                      </span>
                      {isCurrent && (
                        <span className="rounded bg-ember-500 px-1.5 py-0.5 text-[10px] font-semibold text-abyss-950">
                          현재
                        </span>
                      )}
                      {!reached && <span className="text-[10px] text-slate-500">미도달</span>}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{stage.description}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {stage.traits.map((trait) => (
                        <li
                          key={trait}
                          className="rounded bg-abyss-800 px-1.5 py-0.5 text-[10px] text-slate-400"
                        >
                          {trait}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              )
            })}
          </ol>
        </Panel>
      </div>
    </PageShell>
  )
}
