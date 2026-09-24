import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MATERIALS } from '../data/battleConfig'
import { CHARACTER_DEFAULTS, DEATH_PENALTY, HISTORY_RETENTION_DAYS } from '../data/gameConfig'
import { MONSTERS, findMonster } from '../data/monsterConfig'
import { GACHA, GRADES } from '../data/petConfig'
import { calcRewards, createBattle, deriveCombatStats, takeTurn } from '../engine/combat'
import { countCompletionsOn, entryStatus, rollOverDay } from '../engine/dungeon'
import { countHabitEvents } from '../engine/ledger'
import { applyExp } from '../engine/leveling'
import { drawPets, petBonuses, progressPets, type DrawResult } from '../engine/pets'
import { completionReward, negativeHabitPenalty, positiveHabitReward } from '../engine/rewards'
import { planSettlement } from '../engine/schedule'
import { addDays, diffDays, getGameDate } from '../lib/date'
import { newId } from '../lib/id'
import type { PlayerAction } from '../types/battle'
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

/**
 * 새 과제 입력값. 유니온 각 갈래에 따로 Omit을 적용해야
 * repeatDays·polarity 같은 타입별 필드가 살아남는다.
 */
type DraftOf<T> = T extends Task ? Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdOn'> : never
export type TaskDraft = DraftOf<Task>

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
  /** 던전 입장. 남은 입장 횟수가 없으면 아무 일도 하지 않는다. */
  enterDungeon: (monsterId?: string) => void
  /** 전투 중 행동 한 번 */
  battleAction: (action: PlayerAction) => void
  /** 결과 화면을 닫고 던전 입구로 돌아간다 */
  leaveBattle: () => void
  /** 펫 뽑기. 뽑기권이 모자라면 아무 일도 하지 않는다. */
  drawPet: (count: number) => DrawResult[]
  /** 뽑기권을 Gold로 구매 */
  buyTicket: (count?: number) => void
  /** 동행 펫 지정. null이면 해제 */
  setActivePet: (speciesId: string | null) => void
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
    activePetId: null,
    petTickets: GACHA.startingTickets,
    materials: {},
    dungeonDay: { date: today, entriesUsed: 0 },
    battle: null,
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
        const reward = applyPetBonus(completionReward(task.difficulty), state.activePetId)

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
          character: {
            ...applied.character,
            // 중복 부화 환급금
            gold: applied.character.gold + petResult.refundGold,
          },
          events: pruneEvents([...state.events, event], today),
          eggs: petResult.eggs,
          pets: petResult.pets,
          petTickets: state.petTickets + petResult.ticketsGained,
          // 첫 펫이면 자동으로 동행 지정
          activePetId: state.activePetId ?? petResult.hatched?.speciesId ?? null,
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
            ? applyPetBonus(positiveHabitReward(task.difficulty, todayCount), state.activePetId)
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

      enterDungeon: (monsterId) => {
        const state = get()
        // 이미 진행 중인 전투가 있으면 새로 시작하지 않는다 (입장권 낭비 방지)
        if (state.battle && state.battle.status === 'active') return

        const today = getGameDate(new Date())
        const day = rollOverDay(state.dungeonDay, today)
        const status = entryStatus({
          today,
          day,
          completionsToday: countCompletionsOn(state.events, today),
        })
        if (status.remaining <= 0) return

        const monster = findMonster(monsterId ?? MONSTERS[0].id) ?? MONSTERS[0]
        // 동행 펫의 전투 효과를 능력치에 더한다
        const stats = deriveCombatStats(state.character.level, petBonuses(state.activePetId).combat)

        set({
          // 입장할 때 횟수를 먼저 차감한다. 새로고침으로 되돌릴 수 없다.
          dungeonDay: { date: today, entriesUsed: day.entriesUsed + 1 },
          battle: createBattle({ id: newId(), monster, stats, startedOn: today }),
        })
      },

      battleAction: (action) => {
        const state = get()
        const battle = state.battle
        if (!battle || battle.status !== 'active') return

        const result = takeTurn(battle, action, Math.random)
        if (result.battle === battle) return // MP 부족 등으로 아무 일도 일어나지 않음

        let next = result.battle
        const patch: Partial<GameStore> = {}
        const feedback: FeedbackItem[] = []

        // 승리 보상은 여기서 딱 한 번만 지급한다.
        // rewardGranted 플래그가 저장되므로 새로고침·연타로 다시 받을 수 없다.
        if (next.status === 'won' && !next.rewardGranted) {
          const monster = findMonster(next.monsterId)
          if (monster) {
            const rewards = calcRewards(monster, Math.random)
            const materials = { ...state.materials }
            for (const [id, amount] of Object.entries(rewards.materials)) {
              materials[id] = (materials[id] ?? 0) + amount
            }

            next = { ...next, rewardGranted: true, rewards }
            patch.materials = materials
            patch.character = { ...state.character, gold: state.character.gold + rewards.gold }

            const materialText = Object.entries(rewards.materials)
              .map(([id, amount]) => `${MATERIALS[id]?.name ?? id} x${amount}`)
              .join(', ')
            feedback.push({
              id: newId(),
              kind: 'reward',
              title: `${monster.name} 처치!`,
              detail: `+${rewards.gold} Gold${materialText ? ` · ${materialText}` : ''}`,
            })
          }
        }

        if (next.status === 'lost') {
          feedback.push({
            id: newId(),
            kind: 'penalty',
            title: '던전에서 패배했습니다',
            detail: '생활 HP와 과제 기록에는 영향이 없습니다.',
          })
        }

        set({ ...patch, battle: next, feedback: [...state.feedback, ...feedback] })
      },

      leaveBattle: () => set({ battle: null }),

      drawPet: (count) => {
        const state = get()
        if (count <= 0 || state.petTickets < count) return []

        const results = drawPets({
          count,
          ownedIds: state.pets.map((pet) => pet.speciesId),
          rng: Math.random,
        })

        const today = getGameDate(new Date())
        const newPets: Pet[] = []
        let refund = 0
        for (const result of results) {
          if (result.duplicate) {
            refund += result.refundGold
          } else {
            newPets.push({ id: newId(), speciesId: result.species.id, hatchedOn: today })
          }
        }

        const best = results.reduce((top, result) =>
          GRADES[result.species.grade].multiplier > GRADES[top.species.grade].multiplier
            ? result
            : top,
        )

        set({
          petTickets: state.petTickets - count,
          pets: [...state.pets, ...newPets],
          character: { ...state.character, gold: state.character.gold + refund },
          // 첫 펫이면 자동으로 동행으로 지정한다
          activePetId: state.activePetId ?? newPets[0]?.speciesId ?? state.activePetId,
          feedback: [
            ...state.feedback,
            {
              id: newId(),
              kind: best.species.grade === 'S' || best.species.grade === 'A' ? 'hatch' : 'egg',
              title: `${best.species.grade}등급 ${best.species.name}!`,
              detail:
                count > 1
                  ? `${count}회 뽑기 · 새 펫 ${newPets.length}마리${refund > 0 ? ` · 중복 환급 ${refund} Gold` : ''}`
                  : best.duplicate
                    ? `중복 · ${best.refundGold} Gold 환급`
                    : '새로운 친구가 늘었습니다',
            },
          ],
        })

        return results
      },

      buyTicket: (count = 1) => {
        const state = get()
        const cost = GACHA.ticketGoldCost * count
        if (state.character.gold < cost) return
        set({
          character: { ...state.character, gold: state.character.gold - cost },
          petTickets: state.petTickets + count,
        })
      },

      setActivePet: (speciesId) => {
        const state = get()
        if (speciesId && !state.pets.some((pet) => pet.speciesId === speciesId)) return
        set({ activePetId: speciesId })
      },
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
        activePetId: state.activePetId,
        petTickets: state.petTickets,
        materials: state.materials,
        dungeonDay: state.dungeonDay,
        battle: state.battle,
        meta: state.meta,
      }),
      migrate: (persisted, version) => {
        let state = persisted as Partial<GameState>

        // v1 -> v2: 던전 필드 추가. 기존 과제·기록은 그대로 둔다.
        if (version < 2) {
          state = {
            ...state,
            materials: state.materials ?? {},
            dungeonDay: state.dungeonDay ?? { date: getGameDate(new Date()), entriesUsed: 0 },
            battle: state.battle ?? null,
          }
        }

        // v2 -> v3: 펫 등급·뽑기 추가. 이미 모은 펫은 그대로 두고 첫 마리를 동행으로 지정한다.
        if (version < 3) {
          state = {
            ...state,
            petTickets: state.petTickets ?? GACHA.startingTickets,
            activePetId: state.activePetId ?? state.pets?.[0]?.speciesId ?? null,
          }
        }

        return { ...state, schemaVersion: SCHEMA_VERSION } as GameState
      },
    },
  ),
)

/** 동행 펫의 EXP·Gold 효과를 보상에 적용한다 */
function applyPetBonus(
  reward: { exp: number; gold: number; hp: number },
  activePetId: string | null,
): { exp: number; gold: number; hp: number } {
  const bonus = petBonuses(activePetId)
  return {
    exp: Math.round(reward.exp * bonus.expRate),
    gold: Math.round(reward.gold * bonus.goldRate),
    hp: reward.hp,
  }
}

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
