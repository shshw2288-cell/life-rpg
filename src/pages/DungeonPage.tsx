import { Check, Crown, Lock, Swords } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageShell, Panel } from '../components/layout/PageShell'
import { DUNGEON_ENTRY, MATERIALS } from '../data/battleConfig'
import { findSpecies } from '../data/petConfig'
import { REGIONS, type RegionDef } from '../data/regionConfig'
import { deriveCombatStats } from '../engine/combat'
import { countCompletionsOn, entryStatus } from '../engine/dungeon'
import { petBonuses } from '../engine/pets'
import { allRegionStatuses, regionFloors, regionForFloor, regionStatus } from '../engine/regions'
import { isBossFloor, monsterForFloor } from '../engine/tower'
import { BattleView } from '../features/dungeon/BattleView'
import { LoadoutPanel } from '../features/dungeon/LoadoutPanel'
import { MonsterSprite } from '../features/dungeon/MonsterSprite'
import { RegionBackdrop } from '../features/dungeon/RegionBackdrop'
import { getGameDate } from '../lib/date'
import { useGameStore } from '../store/useGameStore'

/** 펫 효과가 붙으면 증가분을 함께 보여준다 */
function StatRow({
  label,
  value,
  base,
  tone,
  suffix = '',
}: {
  label: string
  value: number
  base: number
  tone: string
  suffix?: string
}) {
  const diff = value - base
  return (
    <div className="flex justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`tabular-nums ${tone}`}>
        {value}
        {suffix}
        {diff > 0 && (
          <span className="ml-1 text-[11px] text-ember-400">
            (+{diff}
            {suffix})
          </span>
        )}
      </dd>
    </div>
  )
}

export function DungeonPage() {
  const {
    battle,
    dungeonDay,
    towerKeys,
    keyProgress,
    tower,
    events,
    character,
    materials,
    activePetId,
    regionClears,
    enterDungeon,
  } = useGameStore()
  const today = getGameDate(new Date())

  const highest = tower.highestCleared
  const statuses = useMemo(() => allRegionStatuses(highest), [highest])
  const currentRegionId = regionForFloor(highest + 1).id
  const [selectedId, setSelectedId] = useState(currentRegionId)

  const completionsToday = countCompletionsOn(events, today)
  const entries = entryStatus({ today, day: dungeonDay, towerKeys, keyProgress })
  const bonus = petBonuses(activePetId)
  const baseStats = deriveCombatStats(character.level)
  const stats = deriveCombatStats(character.level, bonus.combat)
  const activeSpecies = activePetId ? findSpecies(activePetId) : undefined
  const canEnter = entries.remaining > 0

  if (battle) {
    return (
      <PageShell
        title={battle.monsterDef.regionName}
        description={`${battle.floor}층 — ${battle.monsterDef.name}`}
      >
        <BattleView battle={battle} />
      </PageShell>
    )
  }

  const selected = REGIONS.find((region) => region.id === selectedId) ?? REGIONS[0]
  const selectedStatus = regionStatus(selected, highest)

  return (
    <PageShell
      title="모험"
      description="현실 과제로 얻은 힘으로 지역을 하나씩 열어 갑니다. 지역마다 대응 방법이 다릅니다."
    >
      <div className="flex flex-col gap-4">
        {/* 지역 선택 */}
        <Panel title="지역">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {statuses.map((status) => (
              <li key={status.region.id}>
                <RegionCard
                  status={status}
                  selected={status.region.id === selected.id}
                  rewarded={regionClears.includes(status.region.id)}
                  onSelect={() => setSelectedId(status.region.id)}
                />
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-4">
            <RegionDetail
              region={selected}
              unlocked={selectedStatus.unlocked}
              lockReason={selectedStatus.lockReason}
              nextFloor={selectedStatus.nextFloor}
              canEnter={canEnter}
              onEnter={(floor) => enterDungeon(floor)}
            />

            {selectedStatus.unlocked && (
              <Panel title={`${selected.name}의 전투`}>
                <p className="-mt-2 mb-3 text-xs text-slate-500">
                  이미 깬 층은 몇 번이든 다시 도전해 Gold와 재료를 더 모을 수 있습니다. 첫 클리어
                  보상은 처음 한 번만 나옵니다.
                </p>
                <FloorList
                  region={selected}
                  highest={highest}
                  canEnter={canEnter}
                  onEnter={(floor) => enterDungeon(floor)}
                />
              </Panel>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <Panel title="탑 진행도">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">최고 층</dt>
                  <dd className="tabular-nums text-ember-400">{highest}층</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">지금 지역</dt>
                  <dd className="text-slate-200">{regionForFloor(highest + 1).name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">정복한 지역</dt>
                  <dd className="tabular-nums text-slate-200">
                    {statuses.filter((status) => status.cleared).length} / {statuses.length - 1}
                  </dd>
                </div>
              </dl>
            </Panel>

            <Panel title="입장">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">지금 들어갈 수 있는 횟수</dt>
                  <dd className="tabular-nums text-ember-400">{entries.remaining}회</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">오늘 무료 입장</dt>
                  <dd className="tabular-nums text-slate-200">{entries.freeLeft}회</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">탑의 열쇠</dt>
                  <dd className="tabular-nums text-slate-200">{towerKeys}개</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">오늘 완료한 과제</dt>
                  <dd className="tabular-nums text-slate-300">{completionsToday}개</dd>
                </div>
              </dl>

              <div className="mt-3 border-t border-abyss-700 pt-2">
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>다음 열쇠까지</span>
                  <span className="tabular-nums">
                    {DUNGEON_ENTRY.completionsPerKey - entries.completionsToNextKey} /{' '}
                    {DUNGEON_ENTRY.completionsPerKey}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-abyss-700">
                  <div
                    className="h-full bg-ember-400"
                    style={{
                      width: `${((DUNGEON_ENTRY.completionsPerKey - entries.completionsToNextKey) / DUNGEON_ENTRY.completionsPerKey) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  하루 입장 제한은 없습니다. 과제·할 일을 {DUNGEON_ENTRY.completionsPerKey}개 완료할
                  때마다 열쇠가 1개씩 쌓이고, 열쇠는 날짜가 바뀌어도 사라지지 않습니다.{' '}
                  <Link to="/shop" className="text-ember-400 underline underline-offset-2">
                    상점
                  </Link>
                  에서도 살 수 있습니다.
                </p>
              </div>
            </Panel>

            <Panel title="전투 능력치">
              <dl className="space-y-1.5 text-sm">
                <StatRow label="전투 HP" value={stats.maxHp} base={baseStats.maxHp} tone="text-vital-400" />
                <StatRow label="MP" value={stats.maxMp} base={baseStats.maxMp} tone="text-mana-400" />
                <StatRow label="공격" value={stats.attack} base={baseStats.attack} tone="text-slate-200" />
                <StatRow label="방어" value={stats.defense} base={baseStats.defense} tone="text-slate-200" />
                <StatRow
                  label="치명타"
                  value={Math.round(stats.critChance * 100)}
                  base={Math.round(baseStats.critChance * 100)}
                  tone="text-slate-200"
                  suffix="%"
                />
              </dl>
              <p className="mt-3 border-t border-abyss-700 pt-2 text-[11px] text-slate-500">
                레벨 {character.level} 기준
                {activeSpecies ? ` · 동행 펫 ${activeSpecies.name} 효과 포함` : ''}입니다. 전투 HP는
                생활 HP와 별개이며, 패배해도 과제 기록과 캐릭터 성장은 그대로 남습니다.
              </p>
            </Panel>

            {Object.keys(materials).length > 0 && (
              <Panel title="모은 재료">
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(materials).map(([id, amount]) => (
                    <li key={id} className="flex justify-between">
                      <span className="text-slate-300">{MATERIALS[id]?.name ?? id}</span>
                      <span className="tabular-nums text-ember-400">{amount}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </aside>
        </div>

        {/* 전투 준비 — 스킬과 펫 */}
        <LoadoutPanel locked={false} />
      </div>
    </PageShell>
  )
}

function RegionCard({
  status,
  selected,
  rewarded,
  onSelect,
}: {
  status: ReturnType<typeof regionStatus>
  selected: boolean
  rewarded: boolean
  onSelect: () => void
}) {
  const { region, unlocked, cleared, clearedFloors, totalFloors } = status

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative w-full overflow-hidden rounded-xl border-2 text-left transition-colors ${
        selected
          ? 'border-ember-400'
          : unlocked
            ? 'border-abyss-700 hover:border-ember-500/60'
            : 'border-abyss-800'
      }`}
    >
      <div className="relative h-24">
        <RegionBackdrop theme={region.theme} dim={!unlocked} />
        <div className="relative flex h-full flex-col justify-end p-3">
          <p className="flex items-center gap-1.5 text-sm font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {!unlocked && <Lock size={13} aria-hidden />}
            {region.name}
            {cleared && <Check size={14} aria-hidden className="text-emerald-300" />}
          </p>
          <p className="text-[11px] text-slate-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {region.tagline}
          </p>
        </div>
      </div>

      <div className="bg-abyss-900 px-3 py-2">
        {unlocked ? (
          <>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {region.floors.from}
                {region.floors.to ? `~${region.floors.to}층` : '층~'} · 권장 Lv.
                {region.recommendedLevel}
              </span>
              <span className={cleared ? 'font-bold text-emerald-400' : 'text-slate-400'}>
                {cleared ? '정복' : totalFloors ? `${clearedFloors} / ${totalFloors}` : '진행 중'}
              </span>
            </div>
            {totalFloors && (
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-abyss-700">
                <div
                  className={`h-full ${cleared ? 'bg-emerald-400' : 'bg-ember-400'}`}
                  style={{ width: `${Math.min(100, (clearedFloors / totalFloors) * 100)}%` }}
                />
              </div>
            )}
            {region.firstClearReward && (
              <p
                className={`mt-1.5 text-[11px] ${rewarded ? 'text-slate-500 line-through' : 'text-amber-300'}`}
              >
                첫 클리어: {region.firstClearReward.name}
              </p>
            )}
          </>
        ) : (
          <p className="text-[11px] text-slate-500">{status.lockReason}</p>
        )}
      </div>
    </button>
  )
}

function RegionDetail({
  region,
  unlocked,
  lockReason,
  nextFloor,
  canEnter,
  onEnter,
}: {
  region: RegionDef
  unlocked: boolean
  lockReason: string | null
  nextFloor: number
  canEnter: boolean
  onEnter: (floor: number) => void
}) {
  const monster = monsterForFloor(nextFloor)
  const boss = monster.isBoss

  return (
    <Panel title={`${region.name} — ${region.scenery}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-full overflow-hidden rounded-xl border border-abyss-700">
          <RegionBackdrop theme={region.theme} dim={!unlocked} />
          <div className="relative flex h-44 items-end justify-center pb-4">
            {unlocked ? (
              <MonsterSprite monster={monster} size={boss ? 170 : 140} shadow />
            ) : (
              <div className="mb-8 flex flex-col items-center gap-1 text-slate-300">
                <Lock size={30} aria-hidden />
                <p className="text-xs">{lockReason}</p>
              </div>
            )}
          </div>
          {unlocked && boss && (
            <span className="absolute left-3 top-3 rounded-lg bg-rose-600/85 px-2.5 py-1 text-xs font-bold text-white">
              보스 층
            </span>
          )}
        </div>

        <p className="text-center text-sm text-slate-300">{region.description}</p>

        <dl className="grid w-full grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-abyss-700 bg-abyss-800/50 px-3 py-2">
            <dt className="text-slate-500">이 지역에서 배우는 것</dt>
            <dd className="mt-0.5 text-slate-200">{region.lesson}</dd>
          </div>
          <div className="rounded-lg border border-abyss-700 bg-abyss-800/50 px-3 py-2">
            <dt className="text-slate-500">일반 전투의 특징</dt>
            <dd className="mt-0.5 text-slate-200">{region.normalTrait.note}</dd>
          </div>
          <div className="rounded-lg border border-abyss-700 bg-abyss-800/50 px-3 py-2">
            <dt className="text-slate-500">첫 클리어 보상</dt>
            <dd className="mt-0.5 text-amber-300">
              {region.firstClearReward
                ? `${region.firstClearReward.name} — ${region.firstClearReward.note}`
                : '없음 (반복 보상만)'}
            </dd>
          </div>
          <div className="rounded-lg border border-abyss-700 bg-abyss-800/50 px-3 py-2">
            <dt className="text-slate-500">반복 보상</dt>
            <dd className="mt-0.5 text-slate-200">{region.repeatReward}</dd>
          </div>
        </dl>

        {unlocked && (
          <>
            <div className="mt-1 text-center">
              <p className="text-base font-bold text-slate-100">
                {nextFloor}층 · {monster.name}
              </p>
              <p className="text-sm text-slate-400">{monster.description}</p>
              {monster.strategy && (
                <p className="mt-1 text-xs text-amber-300/90">공략 {monster.strategy}</p>
              )}
            </div>

            <dl className="flex flex-wrap justify-center gap-4 text-xs text-slate-400">
              <div>
                HP <span className="tabular-nums text-slate-200">{monster.hp}</span>
              </div>
              <div>
                공격 <span className="tabular-nums text-slate-200">{monster.attack}</span>
              </div>
              <div>
                방어 <span className="tabular-nums text-slate-200">{monster.defense}</span>
              </div>
              <div>
                보상 <span className="tabular-nums text-gold-400">{monster.goldReward} G</span>
              </div>
            </dl>

            {canEnter ? (
              <button
                type="button"
                onClick={() => onEnter(nextFloor)}
                className="mt-2 rounded-lg bg-ember-500 px-5 py-2.5 text-sm font-bold text-abyss-950 hover:bg-ember-400"
              >
                {nextFloor}층 도전
              </button>
            ) : (
              <div className="mt-2 text-center">
                <p className="text-sm text-slate-400">지금 들어갈 수 있는 기회가 없습니다.</p>
                <p className="mt-1 text-xs text-slate-500">
                  과제를 완료하거나 상점에서 탑의 열쇠를 사면 더 도전할 수 있습니다.
                </p>
                <div className="mt-2 flex justify-center gap-3 text-xs">
                  <Link to="/tasks" className="text-ember-400 underline underline-offset-2">
                    과제 하러 가기
                  </Link>
                  <Link to="/shop" className="text-ember-400 underline underline-offset-2">
                    상점 가기
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}

function FloorList({
  region,
  highest,
  canEnter,
  onEnter,
}: {
  region: RegionDef
  highest: number
  canEnter: boolean
  onEnter: (floor: number) => void
}) {
  const floors = regionFloors(region, highest)

  return (
    <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
      {floors
        .slice()
        .reverse()
        .map((floor) => {
          const cleared = floor <= highest
          const boss = isBossFloor(floor)
          const monster = monsterForFloor(floor)
          return (
            <li key={floor}>
              <button
                type="button"
                onClick={() => onEnter(floor)}
                disabled={!canEnter}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  boss
                    ? 'border-ember-500/60 bg-abyss-800 hover:bg-abyss-700'
                    : 'border-abyss-700 bg-abyss-800/60 hover:bg-abyss-700'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-slate-300">
                  {floor}층
                </span>
                {boss ? (
                  <Crown size={14} aria-hidden className="text-ember-400" />
                ) : (
                  <Swords size={14} aria-hidden className="text-slate-500" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm">
                  {monster.name}
                  {boss && <span className="ml-1.5 text-[10px] text-ember-400">보스</span>}
                </span>
                <span className="shrink-0 text-[11px] text-slate-500">
                  {cleared ? '클리어' : '미정복'}
                </span>
              </button>
            </li>
          )
        })}
    </ul>
  )
}
