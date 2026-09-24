import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CHARACTER_DEFAULTS, DEATH_PENALTY, HISTORY_RETENTION_DAYS } from '../data/gameConfig'
import { countHabitEvents } from '../engine/ledger'
import { applyExp } from '../engine/leveling'
import { progressPets } from '../engine/pets'
import { completionReward, negativeHabitPenalty, positiveHabitReward } from '../engine/rewards'
import { planSettlement } from '../engine/schedule'
import { addDays, diffDays, getGameDate } from '../lib/date'
import { newId } from '../lib/id'
import type { Character, DailySettlement, GameState } from '../types/gameState'
import { SCHEMA_VERSION } from '../types/gameState'
import type { Egg, Pet } from '../types/pet'
import type { Task, TaskEvent } from '../types/task'

/** 완료·기록 직후 화면에 보여줄 알림 */
export interface FeedbackItem {
  id: string
  kind: 'reward' | 'penalty' | 'levelup' | 'evolve' | 'egg' | 'hatch' | 'death'
  title: string
  detail?: string
}

export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdOn'>

interface GameStore extends GameState {
  feedback: FeedbackItem[]
  addTask: (draft: TaskDraft) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  archiveTask: (id: string) => void
  completeTask: (id: string, metricValue?: number) => void
  recordHabit: (id: string, polarity: 'positive' | 'negative') => void
  runSettlement: () => void
  dismissFeedback: (id: string) => void
  resetAll: () => void
}

function initialState(): GameState {
  const today = getGameDate(new Date())
  const now = new Date().toISOString()
  return {
    schemaVersion: SCHEMA_VERSION,
    character: {
      level: CHARACTER_DEFAULTS.level,
      exp: CHARACTER_DEFAULTS.exp,
      hp: CHARACTER_DEFAULTS.maxHp,
      maxHp: CHARACTER_DEFAULTS.maxHp,
      gold: CHARACTER_DEFAULTS.gold,
    },
    tasks: [],
    events: [],
    settlements: [],
    eggs: [],
    pets: [],
    meta: {
      // 어제까지 정산된 것으로 보아 가입 이전 날짜에는 피해를 주지 않는다.
      lastSettledDate: addDays(today, -1),
      createdAt: now,
      updatedAt: now,
    },
  }
}

/** 오래된 이벤트를 잘라내 저장 용량이 무한정 커지지 않게 한다. */
function pruneEvents(events: TaskEvent[], today: string): TaskEvent[] {
  return events.filter((event) => diffDays(event.localDate, today) <= HISTORY_RETENTION_DAYS)
}

/** HP·EXP·Gold 변화를 캐릭터에 반영하고, 레벨업과 사망을 처리한다. */
function applyDeltas(
  character: Character,
  delta: { exp: number; gold: number; hp: number },
): { character: Character; feedback: FeedbackItem[]; died: boolean; fromLevel: number } {
  const feedback: FeedbackItem[] = []
  const fromLevel = character.level

  const leveled = applyExp(character.level, character.exp, delta.exp)
  let maxHp = character.maxHp + leveled.maxHpGained
  let hp = Math.min(maxHp, character.hp + delta.hp)
  let gold = Math.max(0, character.gold + delta.gold)

  if (leveled.levelsGained > 0) {
    hp = maxHp // 레벨업 시 최대 HP까지 회복 (PRD 2장)
    feedback.push({
      id: newId(),
      kind: 'levelup',
      title: `레벨 ${leveled.level} 달성!`,
      detail: 'HP를 모두 회복했습니다.',
    })
  }

  let died = false
  if (hp <= 0) {
    died = true
    const lostGold = Math.floor(gold * DEATH_PENALTY.goldLossRatio)
    gold -= lostGold
    hp = Math.max(1, Math.floor(maxHp * DEATH_PENALTY.reviveHpRatio))
    maxHp = Math.max(maxHp, 1)
    feedback.push({
      id: newId(),
      kind: 'death',
      title: '루미가 쓰러졌습니다',
      detail: `${lostGold} Gold를 잃고 HP ${hp}로 다시 일어섰습니다.`,
    })
  }

  return {
    character: { level: leveled.level, exp: leveled.exp, hp, maxHp, gold },
    feedback,
    died,
    fromLevel,
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState(),
      feedback: [],

      addTask: (draft) => {
        const now = new Date()
        const task = {
          ...draft,
          id: newId(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          createdOn: getGameDate(now),
        } as Task
        set((state) => ({
          tasks: [...state.tasks, task],
          meta: { ...state.meta, updatedAt: now.toISOString() },
        }))
      },

      updateTask: (id, patch) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? ({ ...task, ...patch, updatedAt: new Date().toISOString() } as Task)
              : task,
          ),
        }))
      },

      archiveTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, archivedAt: new Date().toISOString() } : task,
          ),
        }))
      },

      completeTask: (id, metricValue) => {
        const state = get()
        const task = state.tasks.find((item) => item.id === id)
        if (!task || task.type === 'habit') return

        const now = new Date()
        const today = getGameDate(now)
        const reward = completionReward(task.difficulty)

        const event: TaskEvent = {
          id: newId(),
          taskId: task.id,
          action: 'complete',
          localDate: today,
          timestamp: now.toISOString(),
          expDelta: reward.exp,
          goldDelta: reward.gold,
          hpDelta: 0,
          ...(task.metric && metricValue !== undefined
            ? { metricValue, metricUnit: task.metric.unit }
            : {}),
        }

        const applied = applyDeltas(state.character, reward)
        const petResult = progressPets({
          eggs: state.eggs,
          pets: state.pets,
          today,
          rng: Math.random,
          newId,
        })

        const feedback: FeedbackItem[] = [
          {
            id: newId(),
            kind: 'reward',
            title: task.title,
            detail: `+${reward.exp} EXP · +${reward.gold} Gold${
              metricValue !== undefined && task.metric
                ? ` · ${metricValue}${task.metric.unit} 기록`
                : ''
            }`,
          },
          ...applied.feedback,
        ]
        feedback.push(...petFeedback(petResult.newEgg, petResult.hatched))

        set({
          character: applied.character,
          events: pruneEvents([...state.events, event], today),
          eggs: petResult.eggs,
          pets: petResult.pets,
          tasks:
            task.type === 'todo'
              ? state.tasks.map((item) =>
                  item.id === id ? { ...item, completedOn: today } : item,
                )
              : state.tasks,
          feedback: [...state.feedback, ...feedback],
          meta: { ...state.meta, updatedAt: now.toISOString() },
        })
      },

      recordHabit: (id, polarity) => {
        const state = get()
        const task = state.tasks.find((item) => item.id === id)
        if (!task || task.type !== 'habit') return

        const now = new Date()
        const today = getGameDate(now)
        const todayCount = countHabitEvents(state.events, task.id, today, polarity)
        const reward =
          polarity === 'positive'
            ? positiveHabitReward(task.difficulty, todayCount)
            : negativeHabitPenalty(task.difficulty)

        const event: TaskEvent = {
          id: newId(),
          taskId: task.id,
          action: polarity === 'positive' ? 'habit_positive' : 'habit_negative',
          localDate: today,
          timestamp: now.toISOString(),
          expDelta: reward.exp,
          goldDelta: reward.gold,
          hpDelta: reward.hp,
        }

        const applied = applyDeltas(state.character, reward)
        const feedback: FeedbackItem[] = [
          polarity === 'positive'
            ? {
                id: newId(),
                kind: 'reward',
                title: task.title,
                detail: `+${reward.exp} EXP · +${reward.gold} Gold${
                  todayCount > 0 ? ` (오늘 ${todayCount + 1}번째)` : ''
                }`,
              }
            : {
                id: newId(),
                kind: 'penalty',
                title: task.title,
                detail: `HP ${reward.hp}`,
              },
          ...applied.feedback,
        ]

        set({
          character: applied.character,
          events: pruneEvents([...state.events, event], today),
          feedback: [...state.feedback, ...feedback],
          meta: { ...state.meta, updatedAt: now.toISOString() },
        })
      },

      runSettlement: () => {
        const state = get()
        const today = getGameDate(new Date())
        const plan = planSettlement({
          tasks: state.tasks,
          events: state.events,
          settledDates: state.settlements.map((item) => item.date),
          lastSettledDate: state.meta.lastSettledDate,
          today,
          maxHp: state.character.maxHp,
        })

        if (plan.days.length === 0) {
          if (state.meta.lastSettledDate !== addDays(today, -1)) {
            set({ meta: { ...state.meta, lastSettledDate: addDays(today, -1) } })
          }
          return
        }

        const now = new Date().toISOString()
        const newEvents: TaskEvent[] = []
        const newSettlements: DailySettlement[] = []

        for (const day of plan.days) {
          // 상한이 걸리면 과제별 피해를 비율대로 줄인다.
          const ratio = day.rawDamage > 0 ? day.damage / day.rawDamage : 0
          const entries = day.entries.map((entry) => ({
            taskId: entry.taskId,
            hpDelta: -Math.max(1, Math.round(Math.abs(entry.hpDelta) * ratio)),
          }))

          for (const entry of entries) {
            newEvents.push({
              id: newId(),
              taskId: entry.taskId,
              action: 'miss_penalty',
              localDate: day.date,
              timestamp: now,
              expDelta: 0,
              goldDelta: 0,
              hpDelta: entry.hpDelta,
            })
          }

          newSettlements.push({
            date: day.date,
            settledAt: now,
            entries,
            cappedBy: day.rawDamage - day.damage,
          })
        }

        const totalHp = newEvents.reduce((sum, event) => sum + event.hpDelta, 0)
        const applied = applyDeltas(state.character, { exp: 0, gold: 0, hp: totalHp })

        const feedback: FeedbackItem[] = []
        if (totalHp < 0) {
          feedback.push({
            id: newId(),
            kind: 'penalty',
            title: '놓친 반복 과제 정산',
            detail: `${plan.days.filter((day) => day.damage > 0).length}일치 · HP ${totalHp}${
              plan.skippedDays > 0 ? ` (${plan.skippedDays}일은 건너뜀)` : ''
            }`,
          })
        }

        set({
          character: applied.character,
          events: pruneEvents([...state.events, ...newEvents], today),
          settlements: [...state.settlements, ...newSettlements],
          meta: { ...state.meta, lastSettledDate: addDays(today, -1), updatedAt: now },
          feedback: [...state.feedback, ...feedback, ...applied.feedback],
        })
      },

      dismissFeedback: (id) => {
        set((state) => ({ feedback: state.feedback.filter((item) => item.id !== id) }))
      },

      resetAll: () => set({ ...initialState(), feedback: [] }),
    }),
    {
      name: 'life-rpg-save',
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        character: state.character,
        tasks: state.tasks,
        events: state.events,
        settlements: state.settlements,
        eggs: state.eggs,
        pets: state.pets,
        meta: state.meta,
      }),
      migrate: (persisted, version) => {
        // 저장 형식이 바뀌면 여기서 단계별로 변환한다.
        if (version < SCHEMA_VERSION) return persisted as GameState
        return persisted as GameState
      },
    },
  ),
)

function petFeedback(newEgg?: Egg, hatched?: Pet): FeedbackItem[] {
  const items: FeedbackItem[] = []
  if (hatched) {
    items.push({ id: newId(), kind: 'hatch', title: '알이 부화했습니다!', detail: '펫 화면에서 확인하세요.' })
  }
  if (newEgg) {
    items.push({ id: newId(), kind: 'egg', title: '알을 발견했습니다', detail: '과제를 완료하면 부화합니다.' })
  }
  return items
}
