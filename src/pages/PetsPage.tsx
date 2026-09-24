import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import { PET_RULES, PET_SPECIES } from '../data/petConfig'
import { useGameStore } from '../store/useGameStore'

function PetBlob({ color, accent, size = 64 }: { color: string; accent: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ellipse cx="50" cy="62" rx="32" ry="28" fill={color} />
      <circle cx="50" cy="44" r="26" fill={color} />
      <ellipse cx="30" cy="84" rx="10" ry="6" fill={accent} opacity="0.85" />
      <ellipse cx="70" cy="84" rx="10" ry="6" fill={accent} opacity="0.85" />
      <circle cx="41" cy="42" r="4" fill="#12212b" />
      <circle cx="59" cy="42" r="4" fill="#12212b" />
      <path d="M 43 54 q 7 6 14 0" stroke="#12212b" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function EggShape({ progress, required }: { progress: number; required: number }) {
  const ratio = progress / required
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 120" width={64} height={77} aria-hidden>
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
  const eggs = useGameStore((state) => state.eggs)
  const pets = useGameStore((state) => state.pets)

  return (
    <PageShell
      title="펫"
      description={`과제를 완료하면 가끔 알을 얻습니다. 완료 ${PET_RULES.hatchRequirement}회마다 알 하나가 부화합니다.`}
    >
      <div className="flex flex-col gap-4">
        <Panel title={`품고 있는 알 (${eggs.length} / ${PET_RULES.maxEggs})`}>
          {eggs.length === 0 ? (
            <EmptyState
              message="아직 알이 없습니다."
              hint={`과제를 완료할 때마다 ${Math.round(PET_RULES.eggDropChance * 100)}% 확률로 알이 나옵니다.`}
            />
          ) : (
            <div className="flex flex-wrap gap-6">
              {eggs.map((egg) => (
                <EggShape key={egg.id} progress={egg.progress} required={egg.required} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title={`함께하는 펫 (${pets.length})`}>
          {pets.length === 0 ? (
            <EmptyState message="부화한 펫이 없습니다." />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pets.map((pet) => {
                const species = PET_SPECIES.find((item) => item.id === pet.speciesId)
                if (!species) return null
                return (
                  <li
                    key={pet.id}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-abyss-700 bg-abyss-800/60 p-3 text-center"
                  >
                    <PetBlob color={species.color} accent={species.accent} />
                    <p className="text-sm font-semibold text-slate-100">{species.name}</p>
                    <p className="text-[11px] text-slate-400">{species.description}</p>
                    <p className="text-[10px] text-slate-500">{pet.hatchedOn} 부화</p>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel title="만날 수 있는 친구들">
          <ul className="flex flex-wrap gap-4">
            {PET_SPECIES.map((species) => {
              const owned = pets.some((pet) => pet.speciesId === species.id)
              return (
                <li key={species.id} className="flex flex-col items-center gap-1">
                  <div className={owned ? '' : 'opacity-25 grayscale'}>
                    <PetBlob color={species.color} accent={species.accent} size={48} />
                  </div>
                  <span className="text-[11px] text-slate-400">{owned ? species.name : '???'}</span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </PageShell>
  )
}
