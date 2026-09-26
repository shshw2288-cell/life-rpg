import { Coins } from 'lucide-react'
import { stageForLevel } from '../../engine/evolution'
import { expForNextLevel } from '../../engine/leveling'
import { formatDisplayDate, getGameDate } from '../../lib/date'
import { useGameStore } from '../../store/useGameStore'
import { StatBar } from '../ui/StatBar'

export function TopBar() {
  const character = useGameStore((state) => state.character)
  const today = getGameDate(new Date())
  const stage = stageForLevel(character.level)

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-abyss-700 bg-abyss-900 px-3 py-2 sm:px-5 sm:py-3">
      <span className="rounded-md bg-abyss-700 px-2.5 py-1 text-sm font-bold text-ember-400">
        LV.{character.level}
      </span>
      <span className="hidden text-xs text-slate-400 lg:inline">{stage.name}</span>

      <StatBar label="HP" current={character.hp} max={character.maxHp} tone="vital" />
      <StatBar
        label="EXP"
        current={character.exp}
        max={expForNextLevel(character.level)}
        tone="mana"
      />

      <span className="flex items-center gap-1.5 text-sm text-gold-400">
        <Coins size={16} aria-hidden />
        <span className="tabular-nums">{character.gold.toLocaleString()}</span>
        <span className="sr-only">골드</span>
      </span>

      <div className="ml-auto text-right">
        <p className="text-xs font-medium text-slate-200 sm:text-sm">{formatDisplayDate(today)}</p>
        <p className="hidden text-xs text-slate-500 lg:block">하루는 오전 8시에 시작합니다</p>
      </div>
    </header>
  )
}
