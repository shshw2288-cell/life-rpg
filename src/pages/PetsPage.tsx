import { useState } from 'react'
import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import {
  EFFECT_IS_PERCENT,
  EFFECT_LABEL,
  GRADES,
  GRADE_ORDER,
  PET_RULES,
  PET_SPECIES,
  effectValue,
  findSpecies,
  type PetGrade,
} from '../data/petConfig'
import { ROLE_INFO } from '../data/petRoleConfig'
import { petAbilityDetail, petRoleOf } from '../engine/petCombat'
import { GachaPanel } from '../features/pets/GachaPanel'
import { PetSprite, UnknownPet } from '../features/pets/PetSprite'
import { useGameStore } from '../store/useGameStore'

function EggShape({ progress, required }: { progress: number; required: number }) {
  const ratio = progress / required
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 120" width={56} height={67} aria-hidden>
        <ellipse cx="50" cy="72" rx="38" ry="44" fill="#e2e8f0" />
        <ellipse cx="50" cy="72" rx="38" ry="44" fill="#a3e635" opacity={0.15 + ratio * 0.5} />
        <ellipse cx="38" cy="54" rx="9" ry="12" fill="#ffffff" opacity="0.5" />
        {ratio > 0.5 && (
          <path d="M 28 70 l 10 -8 l 6 10 l 10 -12 l 8 12" stroke="#64748b" strokeWidth="2.5" fill="none" />
        )}
      </svg>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-abyss-700">
        <div className="h-full bg-ember-400" style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-slate-400">
        {progress} / {required}
      </span>
    </div>
  )
}

export function PetsPage() {
  const { eggs, pets, activePetId, setActivePet } = useGameStore()
  const [gradeFilter, setGradeFilter] = useState<PetGrade | 'all'>('all')

  const ownedCounts = pets.reduce<Record<string, number>>((acc, pet) => {
    acc[pet.speciesId] = (acc[pet.speciesId] ?? 0) + 1
    return acc
  }, {})
  const ownedIds = Object.keys(ownedCounts)
  const activeSpecies = activePetId ? findSpecies(activePetId) : undefined

  const visible = PET_SPECIES.filter(
    (species) => gradeFilter === 'all' || species.grade === gradeFilter,
  )

  return (
    <PageShell
      title="펫"
      description={`총 ${PET_SPECIES.length}종 · 보유 ${ownedIds.length}종. 동행 펫 1마리가 과제 보상을 올려주고, 전투에서는 역할(회복·방어·공격·지원)에 맞는 고유 능력을 씁니다.`}
    >
      <div className="flex flex-col gap-4">
        <GachaPanel />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-4">
            <Panel title="동행 펫">
              {activeSpecies ? (
                <div className="flex flex-col items-center gap-2">
                  <PetSprite species={activeSpecies} size={96} />
                  <p className="text-sm font-semibold text-slate-100">
                    <span style={{ color: GRADES[activeSpecies.grade].color }}>
                      [{activeSpecies.grade}]
                    </span>{' '}
                    {activeSpecies.name}
                  </p>
                  <p className="rounded-lg bg-abyss-800 px-3 py-1.5 text-xs text-ember-400">
                    {EFFECT_LABEL[activeSpecies.effect]} +
                    {effectValue(activeSpecies.grade, activeSpecies.effect)}
                    {EFFECT_IS_PERCENT[activeSpecies.effect] ? '%' : ''}
                  </p>

                  {/* 전투에서 맡는 역할 */}
                  {(() => {
                    const detail = petAbilityDetail(activeSpecies)
                    return (
                      <div className="w-full rounded-lg border border-abyss-700 bg-abyss-800/60 px-3 py-2 text-left">
                        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                          <span
                            className="rounded px-1 py-0.5 text-[10px]"
                            style={{
                              color: ROLE_INFO[detail.role].color,
                              backgroundColor: `${ROLE_INFO[detail.role].color}22`,
                            }}
                          >
                            {detail.roleLabel}
                          </span>
                          {detail.abilityName}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">{detail.effect}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">발동: {detail.trigger}</p>
                      </div>
                    )
                  })()}

                  <button
                    type="button"
                    onClick={() => setActivePet(null)}
                    className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300"
                  >
                    동행 해제
                  </button>
                </div>
              ) : (
                <EmptyState
                  message="동행 펫이 없습니다."
                  hint="도감에서 보유한 펫을 눌러 지정하세요."
                />
              )}
            </Panel>

            <Panel title={`품고 있는 알 (${eggs.length} / ${PET_RULES.maxEggs})`}>
              {eggs.length === 0 ? (
                <EmptyState
                  message="아직 알이 없습니다."
                  hint={`과제 완료 시 ${Math.round(PET_RULES.eggDropChance * 100)}% 확률로 나옵니다.`}
                />
              ) : (
                <div className="flex flex-wrap justify-center gap-4">
                  {eggs.map((egg) => (
                    <EggShape key={egg.id} progress={egg.progress} required={egg.required} />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title={`도감 (${ownedIds.length} / ${PET_SPECIES.length})`}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(['all', ...GRADE_ORDER] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setGradeFilter(grade)}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    gradeFilter === grade
                      ? 'border-ember-400 bg-abyss-700 font-semibold text-ember-400'
                      : 'border-abyss-700 text-slate-400 hover:bg-abyss-800'
                  }`}
                >
                  {grade === 'all'
                    ? '전체'
                    : `${grade} (${
                        PET_SPECIES.filter((species) => species.grade === grade).length
                      })`}
                </button>
              ))}
            </div>

            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((species) => {
                const count = ownedCounts[species.id] ?? 0
                const owned = count > 0
                const isActive = activePetId === species.id
                const value = effectValue(species.grade, species.effect)

                return (
                  <li key={species.id}>
                    <button
                      type="button"
                      onClick={() => owned && setActivePet(isActive ? null : species.id)}
                      disabled={!owned}
                      aria-pressed={isActive}
                      className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center transition-colors ${
                        isActive
                          ? 'border-ember-400 bg-abyss-700'
                          : owned
                            ? `${GRADES[species.grade].ring} bg-abyss-800/70 hover:bg-abyss-700`
                            : 'border-abyss-800 bg-abyss-900/40'
                      } ${owned ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: owned ? GRADES[species.grade].color : '#475569' }}
                        >
                          {species.grade}
                        </span>
                        {count > 1 && (
                          <span className="text-[10px] text-slate-500">x{count}</span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-semibold text-ember-400">동행</span>
                        )}
                      </div>

                      {owned ? <PetSprite species={species} size={58} /> : <UnknownPet size={58} />}

                      <span
                        className={`text-xs font-semibold ${owned ? 'text-slate-100' : 'text-slate-600'}`}
                      >
                        {owned ? species.name : '???'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {owned
                          ? `${EFFECT_LABEL[species.effect]} +${value}${EFFECT_IS_PERCENT[species.effect] ? '%' : ''}`
                          : EFFECT_LABEL[species.effect]}
                      </span>
                      <span
                        className="rounded px-1 py-0.5 text-[10px] font-bold"
                        style={{
                          color: owned ? ROLE_INFO[petRoleOf(species)].color : '#475569',
                          backgroundColor: owned
                            ? `${ROLE_INFO[petRoleOf(species)].color}22`
                            : 'transparent',
                        }}
                      >
                        {ROLE_INFO[petRoleOf(species)].label}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
