import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { LumiAvatar, type LumiPose } from '../../components/character/LumiAvatar'
import { stageForLevel } from '../../engine/evolution'
import { useGameStore } from '../../store/useGameStore'
import type { BattleState, BattleStep } from '../../types/battle'
import { useBattleAnimStore } from './battleAnimStore'
import { ForestRuinsBackdrop } from './ForestRuinsBackdrop'
import { MonsterSprite, type MonsterPose } from './MonsterSprite'

/** 단계별 재생 시간 (ms) */
const STEP_MS: Record<BattleStep['kind'], number> = {
  player_attack: 720,
  player_skill: 900,
  player_defend: 520,
  player_item: 620,
  monster_attack: 700,
  monster_heavy: 820,
  monster_charge: 620,
  monster_heal: 620,
  revive: 900,
  win: 900,
  lose: 900,
}

interface FloatingNumber {
  id: number
  side: 'player' | 'monster'
  text: string
  tone: 'damage' | 'crit' | 'heal' | 'mana'
}

/**
 * 전투 장면.
 *
 * 연출은 엔진이 만든 BattleStep을 순서대로 재생하기만 한다.
 * 피해량·보상을 여기서 다시 계산하지 않는다.
 */
export function BattleStage({ battle }: { battle: BattleState }) {
  const level = useGameStore((state) => state.character.level)
  const cosmetics = useGameStore((state) => state.cosmetics)
  const reduceMotion = useReducedMotion()

  const current = useBattleAnimStore((state) => state.current)
  const advance = useBattleAnimStore((state) => state.advance)
  const animBattleId = useBattleAnimStore((state) => state.battleId)
  const reset = useBattleAnimStore((state) => state.reset)

  const [playerPose, setPlayerPose] = useState<LumiPose>('idle')
  const [monsterPose, setMonsterPose] = useState<MonsterPose>('idle')
  const [numbers, setNumbers] = useState<FloatingNumber[]>([])
  const [slash, setSlash] = useState<'none' | 'attack' | 'skill'>('none')
  const [shield, setShield] = useState(false)
  const numberId = useRef(0)

  const stage = stageForLevel(level)
  const monster = battle.monsterDef
  const finished = battle.status !== 'active'

  // 다른 전투의 잔여 연출은 버린다
  useEffect(() => {
    if (animBattleId && animBattleId !== battle.id) reset()
  }, [animBattleId, battle.id, reset])

  // 화면을 벗어나면 남은 연출을 정리한다
  useEffect(() => () => reset(), [reset])

  // 한 단계를 재생하고 정해진 시간 뒤 다음으로 넘어간다
  useEffect(() => {
    if (!current) {
      setPlayerPose(battle.status === 'won' ? 'win' : battle.status === 'lost' ? 'faint' : 'idle')
      setMonsterPose(battle.monster.hp <= 0 ? 'defeat' : 'idle')
      setSlash('none')
      setShield(false)
      return
    }

    const push = (item: Omit<FloatingNumber, 'id'>) => {
      const id = (numberId.current += 1)
      setNumbers((list) => [...list, { ...item, id }])
      setTimeout(() => setNumbers((list) => list.filter((entry) => entry.id !== id)), 1100)
    }

    switch (current.kind) {
      case 'player_attack':
        setPlayerPose('attack')
        setSlash('attack')
        setTimeout(() => {
          setMonsterPose('hit')
          push({
            side: 'monster',
            text: current.crit ? `치명타 ${current.damage}` : `${current.damage}`,
            tone: current.crit ? 'crit' : 'damage',
          })
        }, 220)
        break
      case 'player_skill':
        setPlayerPose('cast')
        setSlash('skill')
        setTimeout(() => {
          setMonsterPose('hit')
          push({
            side: 'monster',
            text: current.crit ? `치명타 ${current.damage}` : `${current.damage}`,
            tone: current.crit ? 'crit' : 'damage',
          })
        }, 380)
        break
      case 'player_defend':
        setPlayerPose('defend')
        setShield(true)
        break
      case 'player_item':
        setPlayerPose('cast')
        push({
          side: 'player',
          text: current.heal ? `+${current.heal} HP` : `+${current.mana} MP`,
          tone: current.heal ? 'heal' : 'mana',
        })
        break
      case 'monster_attack':
      case 'monster_heavy':
        setMonsterPose('attack')
        setTimeout(() => {
          setPlayerPose('hit')
          push({
            side: 'player',
            text: `${current.damage}`,
            tone: current.kind === 'monster_heavy' ? 'crit' : 'damage',
          })
        }, 240)
        break
      case 'monster_charge':
        setMonsterPose('charge')
        break
      case 'monster_heal':
        setMonsterPose('heal')
        push({ side: 'monster', text: `+${current.amount}`, tone: 'heal' })
        break
      case 'revive':
        setPlayerPose('cast')
        push({ side: 'player', text: `부활 ${current.hp}`, tone: 'heal' })
        break
      case 'win':
        setMonsterPose('defeat')
        setPlayerPose('win')
        break
      case 'lose':
        setPlayerPose('faint')
        break
    }

    const timer = setTimeout(advance, reduceMotion ? 220 : STEP_MS[current.kind])
    return () => clearTimeout(timer)
  }, [current, advance, reduceMotion, battle.status, battle.monster.hp])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-abyss-700 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
      <ForestRuinsBackdrop />

      {/* 무대: 두 캐릭터가 같은 바닥선 위에 선다 */}
      <div className="relative mx-auto flex h-[260px] max-w-[880px] items-end justify-between px-3 pb-6 sm:h-[310px] sm:px-10 sm:pb-8 md:h-[350px]">
        {/* 플레이어 — 좁은 화면에서는 축소하되 바닥선은 유지한다 */}
        <div className="relative flex origin-bottom scale-[0.66] flex-col items-center sm:scale-90 md:scale-100">
          <FloatingNumbers numbers={numbers.filter((entry) => entry.side === 'player')} />
          {shield && <ShieldBubble />}
          <LumiAvatar
            stage={stage}
            size={168}
            pose={playerPose}
            fainted={battle.status === 'lost'}
            cosmetics={cosmetics}
            shadow
          />
        </div>

        {/* 가운데 이펙트 */}
        <AnimatePresence>
          {slash !== 'none' && !reduceMotion && (
            <SlashEffect key={slash + String(battle.turn)} kind={slash} />
          )}
        </AnimatePresence>

        {/* 몬스터 */}
        <div className="relative flex origin-bottom scale-[0.66] flex-col items-center sm:scale-90 md:scale-100">
          <FloatingNumbers numbers={numbers.filter((entry) => entry.side === 'monster')} />
          <MonsterSprite
            monster={monster}
            size={monster.isBoss ? 200 : 168}
            pose={monsterPose}
            charging={battle.monsterCharging && !finished}
            defeated={battle.monster.hp <= 0}
            shadow
          />
        </div>
      </div>

      {/* 층 표시 */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
        <span className="rounded-lg bg-black/55 px-2.5 py-1 text-xs font-bold text-amber-200 backdrop-blur-sm">
          {battle.floor}층
        </span>
        <span className="rounded-lg bg-black/45 px-2 py-1 text-[11px] text-slate-200 backdrop-blur-sm">
          {battle.turn}턴
        </span>
        {monster.isBoss && (
          <span className="rounded-lg bg-rose-600/80 px-2 py-1 text-[11px] font-bold text-white">
            BOSS
          </span>
        )}
      </div>
    </div>
  )
}

function FloatingNumbers({ numbers }: { numbers: FloatingNumber[] }) {
  const TONE = {
    damage: 'text-white',
    crit: 'text-amber-300',
    heal: 'text-emerald-300',
    mana: 'text-indigo-300',
  } as const

  return (
    <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2">
      <AnimatePresence>
        {numbers.map((entry) => (
          <motion.span
            key={entry.id}
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: 1, y: -34, scale: entry.tone === 'crit' ? 1.35 : 1 }}
            exit={{ opacity: 0, y: -52 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`absolute whitespace-nowrap text-xl font-black drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] ${TONE[entry.tone]}`}
          >
            {entry.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

function ShieldBubble() {
  return (
    <motion.span
      className="pointer-events-none absolute inset-x-0 bottom-2 z-10 mx-auto h-[150px] w-[150px] rounded-full border-2 border-sky-300/80 bg-sky-300/15"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      aria-hidden
    />
  )
}

function SlashEffect({ kind }: { kind: 'attack' | 'skill' }) {
  if (kind === 'attack') {
    return (
      <motion.svg
        viewBox="0 0 120 120"
        className="pointer-events-none absolute right-[22%] top-1/2 h-28 w-28 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.7, rotate: -18 }}
        animate={{ opacity: [0, 1, 0], scale: [0.7, 1.15, 1.2], rotate: 8 }}
        transition={{ duration: 0.45 }}
        aria-hidden
      >
        <path
          d="M 16 96 Q 62 76 104 22"
          stroke="#fef3c7"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M 24 100 Q 66 84 100 36" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" fill="none" />
      </motion.svg>
    )
  }

  // 스킬: 모았다가 날아가는 빛 구슬
  return (
    <motion.span
      className="pointer-events-none absolute top-1/2 left-[28%] z-10 h-12 w-12 -translate-y-1/2 rounded-full"
      style={{ background: 'radial-gradient(circle at 35% 35%, #ffffff, #a78bfa 55%, #6d28d9)' }}
      initial={{ opacity: 0, scale: 0.2, x: 0 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.2, 1, 1, 1.9], x: ['0%', '0%', '260%', '300%'] }}
      transition={{ duration: 0.85, times: [0, 0.3, 0.75, 1] }}
      aria-hidden
    />
  )
}
