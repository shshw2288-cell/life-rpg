import { Link } from 'react-router-dom'
import { PageShell, Panel } from '../components/layout/PageShell'
import { DUNGEON_ENTRY, MATERIALS } from '../data/battleConfig'
import { MONSTERS } from '../data/monsterConfig'
import { deriveCombatStats } from '../engine/combat'
import { countCompletionsOn, entryStatus } from '../engine/dungeon'
import { getGameDate } from '../lib/date'
import { useGameStore } from '../store/useGameStore'
import { BattleView } from '../features/dungeon/BattleView'
import { MonsterSprite } from '../features/dungeon/MonsterSprite'

export function DungeonPage() {
  const { battle, dungeonDay, events, character, materials, enterDungeon } = useGameStore()
  const today = getGameDate(new Date())

  const completionsToday = countCompletionsOn(events, today)
  const entries = entryStatus({ today, day: dungeonDay, completionsToday })
  const stats = deriveCombatStats(character.level)
  const monster = MONSTERS[0]

  if (battle) {
    return (
      <PageShell title="던전" description={`${monster.name}과(와) 전투 중`}>
        <BattleView battle={battle} />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="던전"
      description="현실 과제를 해내면 던전에 들어갈 기회를 얻습니다."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <Panel title="입구">
          <div className="flex flex-col items-center gap-3 py-2">
            <MonsterSprite monster={monster} size={170} />
            <p className="text-base font-bold text-slate-100">{monster.name}</p>
            <p className="text-sm text-slate-400">{monster.description}</p>

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
            </dl>

            {entries.remaining > 0 ? (
              <button
                type="button"
                onClick={() => enterDungeon()}
                className="mt-2 rounded-lg bg-ember-500 px-5 py-2.5 text-sm font-bold text-abyss-950 hover:bg-ember-400"
              >
                던전 입장 (남은 {entries.remaining}회)
              </button>
            ) : (
              <div className="mt-2 text-center">
                <p className="text-sm text-slate-400">오늘 남은 입장 기회가 없습니다.</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entries.total >= DUNGEON_ENTRY.maxDaily
                    ? '입장 기회는 내일 오전 8시에 다시 채워집니다.'
                    : `과제를 ${entries.completionsToNext}개 더 완료하면 1회 더 들어갈 수 있습니다.`}
                </p>
                <Link
                  to="/tasks"
                  className="mt-2 inline-block text-xs text-ember-400 underline underline-offset-2"
                >
                  과제 하러 가기
                </Link>
              </div>
            )}
          </div>
        </Panel>

        <aside className="flex flex-col gap-4">
          <Panel title="오늘의 입장">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">남은 횟수</dt>
                <dd className="tabular-nums text-slate-100">
                  {entries.remaining} / {entries.total}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">기본 제공</dt>
                <dd className="tabular-nums text-slate-300">{entries.base}회</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">과제로 획득</dt>
                <dd className="tabular-nums text-ember-400">+{entries.earned}회</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">오늘 완료한 과제</dt>
                <dd className="tabular-nums text-slate-300">{completionsToday}개</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-abyss-700 pt-2 text-[11px] text-slate-500">
              과제 {DUNGEON_ENTRY.completionsPerBonus}개를 완료할 때마다 입장 기회가 1회 늘어납니다
              (하루 최대 {DUNGEON_ENTRY.maxDaily}회). 습관 기록은 횟수 제한이 없어 입장 기회에는
              반영되지 않습니다. 매일 오전 8시에 초기화됩니다.
            </p>
          </Panel>

          <Panel title="전투 능력치">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">전투 HP</dt>
                <dd className="tabular-nums text-vital-400">{stats.maxHp}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">MP</dt>
                <dd className="tabular-nums text-mana-400">{stats.maxMp}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">공격</dt>
                <dd className="tabular-nums text-slate-200">{stats.attack}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">방어</dt>
                <dd className="tabular-nums text-slate-200">{stats.defense}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">치명타</dt>
                <dd className="tabular-nums text-slate-200">
                  {Math.round(stats.critChance * 100)}%
                </dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-abyss-700 pt-2 text-[11px] text-slate-500">
              레벨 {character.level} 기준입니다. 전투 HP는 생활 HP와 별개이며, 전투에서 져도 과제
              기록과 캐릭터 성장은 그대로 남습니다.
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
              <p className="mt-2 text-[11px] text-slate-500">
                장비 제작은 다음 단계에서 추가합니다.
              </p>
            </Panel>
          )}
        </aside>
      </div>
    </PageShell>
  )
}
