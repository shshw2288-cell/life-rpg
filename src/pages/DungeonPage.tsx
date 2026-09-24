import { Crown, Lock, Swords } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageShell, Panel } from '../components/layout/PageShell'
import { DUNGEON_ENTRY, MATERIALS } from '../data/battleConfig'
import { findSpecies } from '../data/petConfig'
import { BOSS_INTERVAL } from '../data/towerConfig'
import { deriveCombatStats } from '../engine/combat'
import { countCompletionsOn, entryStatus } from '../engine/dungeon'
import { petBonuses } from '../engine/pets'
import { isBossFloor, monsterForFloor, nextBossFloor } from '../engine/tower'
import { BattleView } from '../features/dungeon/BattleView'
import { MonsterSprite } from '../features/dungeon/MonsterSprite'
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
    tower,
    events,
    character,
    materials,
    activePetId,
    enterDungeon,
  } = useGameStore()
  const today = getGameDate(new Date())

  const completionsToday = countCompletionsOn(events, today)
  const entries = entryStatus({ today, day: dungeonDay, completionsToday })
  const bonus = petBonuses(activePetId)
  const baseStats = deriveCombatStats(character.level)
  const stats = deriveCombatStats(character.level, bonus.combat)
  const activeSpecies = activePetId ? findSpecies(activePetId) : undefined

  const nextFloor = tower.highestCleared + 1
  const canEnter = entries.remaining > 0 || towerKeys > 0

  if (battle) {
    return (
      <PageShell title="탑" description={`${battle.floor}층 — ${battle.monsterDef.name}`}>
        <BattleView battle={battle} />
      </PageShell>
    )
  }

  // 도전할 수 있는 층 목록 (최근 8개층)
  const floors: number[] = []
  for (let floor = Math.max(1, nextFloor - 6); floor <= nextFloor + 1; floor += 1) {
    floors.push(floor)
  }

  return (
    <PageShell
      title="탑"
      description={`현실 과제를 해내면 탑에 오를 기회를 얻습니다. ${BOSS_INTERVAL}층마다 보스가 기다립니다.`}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <Panel title={`${nextFloor}층 도전`}>
            <FloorPreview floor={nextFloor} canEnter={canEnter} onEnter={() => enterDungeon()} />
          </Panel>

          <Panel title="층 선택">
            <p className="-mt-2 mb-3 text-xs text-slate-500">
              이미 깬 층은 다시 도전해 Gold와 재료를 더 모을 수 있습니다.
            </p>
            <ul className="flex flex-col gap-1.5">
              {floors
                .slice()
                .reverse()
                .map((floor) => {
                  const cleared = floor <= tower.highestCleared
                  const locked = floor > nextFloor
                  const boss = isBossFloor(floor)
                  const monster = monsterForFloor(floor)
                  return (
                    <li key={floor}>
                      <button
                        type="button"
                        onClick={() => enterDungeon(floor)}
                        disabled={locked || !canEnter}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                          locked
                            ? 'border-abyss-800 bg-abyss-900/40 text-slate-600'
                            : boss
                              ? 'border-ember-500/60 bg-abyss-800 hover:bg-abyss-700'
                              : 'border-abyss-700 bg-abyss-800/60 hover:bg-abyss-700'
                        } disabled:cursor-not-allowed`}
                      >
                        <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-slate-300">
                          {floor}층
                        </span>
                        {locked ? (
                          <Lock size={14} aria-hidden className="text-slate-600" />
                        ) : boss ? (
                          <Crown size={14} aria-hidden className="text-ember-400" />
                        ) : (
                          <Swords size={14} aria-hidden className="text-slate-500" />
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {locked ? '???' : monster.name}
                          {boss && !locked && (
                            <span className="ml-1.5 text-[10px] text-ember-400">보스</span>
                          )}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {locked ? '잠김' : cleared ? '클리어' : '미정복'}
                        </span>
                      </button>
                    </li>
                  )
                })}
            </ul>
          </Panel>
        </div>

        <aside className="flex flex-col gap-4">
          <Panel title="탑 진행도">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">최고 층</dt>
                <dd className="tabular-nums text-ember-400">{tower.highestCleared}층</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">다음 보스</dt>
                <dd className="tabular-nums text-slate-200">{nextBossFloor(nextFloor)}층</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="오늘의 입장">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">남은 횟수</dt>
                <dd className="tabular-nums text-slate-100">
                  {entries.remaining} / {entries.total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">과제로 획득</dt>
                <dd className="tabular-nums text-ember-400">+{entries.earned}회</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">탑의 열쇠</dt>
                <dd className="tabular-nums text-slate-200">{towerKeys}개</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-abyss-700 pt-2 text-[11px] text-slate-500">
              과제 {DUNGEON_ENTRY.completionsPerBonus}개마다 입장 기회 1회 (하루 최대{' '}
              {DUNGEON_ENTRY.maxDaily}회, 오전 8시 초기화). 다 쓰면{' '}
              <Link to="/shop" className="text-ember-400 underline underline-offset-2">
                상점
              </Link>
              의 탑의 열쇠를 씁니다.
            </p>
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
    </PageShell>
  )
}

function FloorPreview({
  floor,
  canEnter,
  onEnter,
}: {
  floor: number
  canEnter: boolean
  onEnter: () => void
}) {
  const monster = monsterForFloor(floor)
  const boss = monster.isBoss

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {boss && (
        <span className="rounded-full bg-ember-500/20 px-3 py-1 text-xs font-bold text-ember-400">
          보스 층
        </span>
      )}
      <MonsterSprite monster={monster} size={boss ? 190 : 160} />
      <p className="text-base font-bold text-slate-100">{monster.name}</p>
      <p className="text-center text-sm text-slate-400">{monster.description}</p>

      <dl className="mt-1 flex gap-4 text-xs text-slate-400">
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
          onClick={onEnter}
          className="mt-2 rounded-lg bg-ember-500 px-5 py-2.5 text-sm font-bold text-abyss-950 hover:bg-ember-400"
        >
          {floor}층 도전
        </button>
      ) : (
        <div className="mt-2 text-center">
          <p className="text-sm text-slate-400">오늘 남은 입장 기회가 없습니다.</p>
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
    </div>
  )
}
