import { Check, Crosshair, Leaf, Link2, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { findSpecies } from '../../data/petConfig'
import { ROLE_INFO } from '../../data/petRoleConfig'
import { findRegion } from '../../data/regionConfig'
import { SKILLS, SKILL_SLOTS } from '../../data/skillConfig'
import { petAbilityDetail } from '../../engine/petCombat'
import { unlockedSkillIds } from '../../engine/skills'
import { useGameStore } from '../../store/useGameStore'
import type { SkillIcon } from '../../types/skill'
import { PetSprite } from '../pets/PetSprite'

const SKILL_ICON: Record<SkillIcon, typeof Sparkles> = {
  arrow: Sparkles,
  sprout: Leaf,
  shield: ShieldCheck,
  focus: Crosshair,
  vine: Link2,
}

/**
 * 전투 준비 — 스킬 장착과 동행 펫 선택.
 *
 * 기본 공격·방어는 슬롯을 쓰지 않으므로 여기 나오지 않는다.
 * 전투 중에는 잠긴다 (이번 판의 구성은 입장할 때 확정된다).
 */
export function LoadoutPanel({ locked }: { locked: boolean }) {
  const skillLoadout = useGameStore((state) => state.skillLoadout)
  const toggleSkill = useGameStore((state) => state.toggleSkill)
  const highestCleared = useGameStore((state) => state.tower.highestCleared)
  const pets = useGameStore((state) => state.pets)
  const activePetId = useGameStore((state) => state.activePetId)
  const setActivePet = useGameStore((state) => state.setActivePet)

  const unlocked = new Set(unlockedSkillIds(highestCleared))
  const full = skillLoadout.length >= SKILL_SLOTS

  const ownedSpecies = Array.from(new Set(pets.map((pet) => pet.speciesId)))
    .map((id) => findSpecies(id))
    .filter((species): species is NonNullable<typeof species> => Boolean(species))

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-abyss-700 bg-abyss-900 p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300">
            액티브 스킬 ({skillLoadout.length} / {SKILL_SLOTS})
          </h2>
          {locked && <span className="text-[11px] text-amber-400">전투 중에는 바꿀 수 없습니다</span>}
        </div>
        <p className="mb-3 text-xs text-slate-500">
          공격과 방어는 슬롯을 쓰지 않고 언제나 쓸 수 있습니다. 여기서는 그 밖의 스킬 최대{' '}
          {SKILL_SLOTS}개를 고릅니다.
        </p>

        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SKILLS.map((skill) => {
            const Icon = SKILL_ICON[skill.icon]
            const isUnlocked = unlocked.has(skill.id)
            const equipped = skillLoadout.includes(skill.id)
            const region =
              skill.unlock.kind === 'region' ? findRegion(skill.unlock.regionId) : undefined
            const blocked = locked || !isUnlocked || (!equipped && full)

            return (
              <li key={skill.id}>
                <button
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  disabled={blocked}
                  aria-pressed={equipped}
                  className={`flex w-full flex-col gap-1 rounded-lg border-2 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                    equipped
                      ? 'border-violet-400 bg-violet-500/15'
                      : isUnlocked
                        ? 'border-abyss-700 bg-abyss-800/60 hover:border-violet-500/70 hover:bg-abyss-700'
                        : 'border-abyss-800 bg-abyss-900/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isUnlocked ? (
                      <Icon
                        size={16}
                        aria-hidden
                        className={equipped ? 'text-violet-300' : 'text-slate-400'}
                      />
                    ) : (
                      <Lock size={16} aria-hidden className="text-slate-600" />
                    )}
                    <span
                      className={`text-sm font-bold ${isUnlocked ? 'text-slate-100' : 'text-slate-500'}`}
                    >
                      {skill.name}
                    </span>
                    {equipped && (
                      <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-violet-300">
                        <Check size={12} aria-hidden /> 장착
                      </span>
                    )}
                  </span>

                  <span className="text-xs text-slate-400">{skill.description}</span>

                  <span className="flex flex-wrap gap-1.5 text-[10px]">
                    <Tag>MP {skill.mpCost}</Tag>
                    {skill.cooldown > 0 && <Tag>대기 {skill.cooldown}턴</Tag>}
                    {skill.maxUses && <Tag>전투당 {skill.maxUses}회</Tag>}
                    {skill.selfStatus && <Tag>{skill.selfStatus.turns}턴 지속</Tag>}
                    {skill.enemyStatus && <Tag>{skill.enemyStatus.turns}턴 지속</Tag>}
                  </span>

                  {isUnlocked ? (
                    <span className="text-[11px] text-slate-500">{skill.tip}</span>
                  ) : (
                    <span className="text-[11px] text-amber-400/80">
                      해금 조건: {region?.name ?? '???'} 보스 격파
                    </span>
                  )}

                  {isUnlocked && !equipped && full && (
                    <span className="text-[11px] text-slate-500">
                      슬롯이 가득 찼습니다 — 다른 스킬을 먼저 해제하세요
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-xl border border-abyss-700 bg-abyss-900 p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300">동행 펫</h2>
          {locked && <span className="text-[11px] text-amber-400">전투 중에는 교체할 수 없습니다</span>}
        </div>
        <p className="mb-3 text-xs text-slate-500">
          1마리만 데려갑니다. 펫이 없어도 전투는 할 수 있습니다.
        </p>

        {ownedSpecies.length === 0 ? (
          <p className="text-xs text-slate-500">
            아직 펫이 없습니다. 과제를 완료해 알을 모으거나 펫 화면에서 뽑아 보세요.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <li>
              <button
                type="button"
                onClick={() => setActivePet(null)}
                disabled={locked}
                aria-pressed={activePetId === null}
                className={`flex h-full w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                  activePetId === null
                    ? 'border-slate-400 bg-slate-500/10'
                    : 'border-abyss-700 bg-abyss-800/60 hover:bg-abyss-700'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-abyss-700 text-xs text-slate-500">
                  없음
                </span>
                <span className="text-sm text-slate-300">혼자 간다</span>
              </button>
            </li>

            {ownedSpecies.map((species) => {
              const detail = petAbilityDetail(species)
              const selected = activePetId === species.id
              return (
                <li key={species.id}>
                  <button
                    type="button"
                    onClick={() => setActivePet(species.id)}
                    disabled={locked}
                    aria-pressed={selected}
                    className={`flex h-full w-full items-start gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                      selected
                        ? 'border-emerald-400 bg-emerald-500/10'
                        : 'border-abyss-700 bg-abyss-800/60 hover:bg-abyss-700'
                    }`}
                  >
                    <PetSprite species={species} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-100">{species.name}</span>
                        <span
                          className="rounded px-1 py-0.5 text-[10px] font-bold"
                          style={{
                            color: ROLE_INFO[detail.role].color,
                            backgroundColor: `${ROLE_INFO[detail.role].color}22`,
                          }}
                        >
                          {detail.roleLabel}
                        </span>
                        <span className="text-[10px] text-slate-500">{species.grade}등급</span>
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-300">
                        {detail.abilityName}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-400">{detail.effect}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        발동: {detail.trigger}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-abyss-700 bg-abyss-950/60 px-1.5 py-0.5 text-slate-400">
      {children}
    </span>
  )
}
