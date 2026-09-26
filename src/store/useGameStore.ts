import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MATERIALS, STARTING_TOWER_KEYS } from '../data/battleConfig'
import { CHARACTER_DEFAULTS, DEATH_PENALTY, HISTORY_RETENTION_DAYS } from '../data/gameConfig'
import { GACHA, GRADES } from '../data/petConfig'
import {
  DEFAULT_PLACEMENTS,
  STARTER_FURNITURE,
  findFurniture,
  type FurnitureDef,
} from '../data/roomConfig'
import { findCosmetic, findItem, type CosmeticSlot } from '../data/shopConfig'
import { newlyAchievedFurniture } from '../engine/achievements'
import {
  calcRewards,
  createBattle,
  deriveCombatStats,
  takeTurn,
  useItemTurn,
} from '../engine/combat'
import { makeBattlePet } from '../engine/petCombat'
import { newlyClearedRegion } from '../engine/regions'
import {
  firstFreeSpot,
  placeFurniture as placeInRoom,
  removeFurniture as removeFromRoom,
  resetPlacements,
} from '../engine/room'
import { SKILL_SLOTS, defaultLoadout, normalizeLoadout, unlockedSkillIds } from '../engine/skills'
import { canChallenge, firstClearBonus, monsterForFloor } from '../engine/tower'
import { addKeyProgress, entryStatus, rollOverDay } from '../engine/dungeon'
import { countHabitEvents } from '../engine/ledger'
import { applyExp } from '../engine/leveling'
import { drawPets, petBonuses, progressPets, type DrawResult } from '../engine/pets'
import { completionReward, negativeHabitPenalty, positiveHabitReward } from '../engine/rewards'
import { planSettlement } from '../engine/schedule'
import { staleCompletedTodos } from '../engine/tasks'
import { useBattleAnimStore } from '../features/dungeon/battleAnimStore'
import { countRoundsOn, justReachedTarget, roundReward } from '../engine/study'
import { migrateSave } from '../services/migrations'
import { STUDY } from '../data/studyConfig'
import { addDays, diffDays, getGameDate } from '../lib/date'
import { newId } from '../lib/id'
import type { BattleState, PlayerAction } from '../types/battle'
import type { Character, DailySettlement, GameState } from '../types/gameState'
import { SCHEMA_VERSION } from '../types/gameState'
import type { Egg, Pet } from '../types/pet'
import type { Subject } from '../types/study'
import type { Task, TaskEvent } from '../types/task'
import { EMPTY_WORKOUT, type BigThreeLift, type MuscleGroup } from '../types/workout'
import { MAX_WEIGHT } from '../data/workoutConfig'

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

export type SubjectDraft = Omit<
  Subject,
  'id' | 'createdAt' | 'updatedAt' | 'createdOn' | 'rounds' | 'archivedAt'
>

interface GameStore extends GameState {
  feedback: FeedbackItem[]
  addTask: (draft: TaskDraft) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  archiveTask: (id: string) => void
  completeTask: (id: string, metricValue?: number) => void
  recordHabit: (id: string, polarity: 'positive' | 'negative') => void
  runSettlement: () => void
  /** 하루가 지난 완료 할 일을 목록에서 내린다 (기록에는 남는다) */
  archiveStaleTodos: () => void
  dismissFeedback: (id: string) => void
  resetAll: () => void
  /** 탑 도전. 남은 입장 횟수가 없거나 잠긴 층이면 아무 일도 하지 않는다. */
  enterDungeon: (floor?: number) => void
  /** 전투 중 행동 한 번 */
  battleAction: (action: PlayerAction) => void
  /** 전투 중 아이템 사용 */
  useBattleItem: (itemId: string) => void
  /** 상점 구매 */
  buyShopItem: (itemId: string, count?: number) => void
  buyCosmetic: (cosmeticId: string) => void
  /** 꾸미기 장착 / 해제 */
  equipCosmetic: (slot: CosmeticSlot, cosmeticId: string | null) => void
  /** 결과 화면을 닫고 던전 입구로 돌아간다 */
  leaveBattle: () => void
  /** 펫 뽑기. 뽑기권이 모자라면 아무 일도 하지 않는다. */
  drawPet: (count: number) => DrawResult[]
  /** 뽑기권을 Gold로 구매 */
  buyTicket: (count?: number) => void
  /** 동행 펫 지정. null이면 해제 */
  setActivePet: (speciesId: string | null) => void
  /** 공부 과목 추가 */
  addSubject: (draft: SubjectDraft) => void
  updateSubject: (id: string, patch: Partial<Subject>) => void
  archiveSubject: (id: string) => void
  /** 회독 1회 기록 (+버튼) */
  addRound: (id: string) => void
  /** 잘못 누른 회독 되돌리기. 회독 수만 줄이고 이미 받은 보상은 두 번 계산하지 않는다. */
  undoRound: (id: string) => void
  /** 할 일을 과목에 연결한다. subjectId가 null이면 연결 해제. */
  assignTaskToSubject: (taskId: string, subjectId: string | null) => void
  /** 운동 종목 추가 */
  addExercise: (group: MuscleGroup, name: string, weight?: number) => void
  /** 종목 무게 조절. delta만큼 더하고 0~상한으로 자른다. */
  adjustExerciseWeight: (id: string, delta: number) => void
  setExerciseWeight: (id: string, weight: number) => void
  removeExercise: (id: string) => void
  /** 3대 운동 무게 조절 */
  adjustBigThree: (lift: BigThreeLift, delta: number) => void
  setBigThree: (lift: BigThreeLift, weight: number) => void
  /**
   * 스킬 장착/해제. 전투 중에는 바꿀 수 없고, 같은 스킬을 두 번 넣을 수 없다.
   * 슬롯이 꽉 차 있으면 아무 일도 하지 않는다.
   */
  toggleSkill: (skillId: string) => void
  /** 가구를 격자에 놓는다(이미 놓여 있으면 옮긴다). 규칙에 어긋나면 아무 일도 하지 않는다. */
  placeFurniture: (furnitureId: string, x: number, y: number) => void
  /** 가구를 배치에서 내린다. 보유 목록에서는 사라지지 않는다. */
  pickUpFurniture: (furnitureId: string) => void
  /** 배치만 기본 상태로 되돌린다. 보유 가구는 그대로다. */
  resetRoom: () => void
  /** 저장된 기록을 보고 새로 조건을 채운 가구를 지급한다. 여러 번 불러도 중복 지급되지 않는다. */
  syncRoomUnlocks: () => void
  /** 백업 파일로 내보낼 현재 상태 */
  exportSave: () => GameState
  /** 백업에서 상태를 통째로 되돌린다 */
  importSave: (state: GameState) => void
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
    subjects: [],
    workout: EMPTY_WORKOUT,
    events: [],
    settlements: [],
    eggs: [],
    pets: [],
    activePetId: null,
    petTickets: GACHA.startingTickets,
    materials: {},
    dungeonDay: { date: today, entriesUsed: 0 },
    towerKeys: STARTING_TOWER_KEYS,
    keyProgress: 0,
    tower: { highestCleared: 0, lastFloor: 1 },
    skillLoadout: defaultLoadout(),
    regionClears: [],
    room: { owned: [...STARTER_FURNITURE], placements: DEFAULT_PLACEMENTS.map((item) => ({ ...item })) },
    battle: null,
    inventory: {},
    ownedCosmetics: [],
    cosmetics: { hat: null, face: null, aura: null, cape: null },
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
        // 과제를 완료할수록 탑의 열쇠가 쌓인다 (날짜가 바뀌어도 사라지지 않음)
        const keys = addKeyProgress(state.keyProgress, state.towerKeys)

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
        if (keys.earned > 0) {
          feedback.push({
            id: newId(),
            kind: 'reward',
            title: `탑의 열쇠 +${keys.earned}`,
            detail: '탑에 한 번 더 들어갈 수 있습니다.',
          })
        }

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
          towerKeys: keys.towerKeys,
          keyProgress: keys.keyProgress,
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

      archiveStaleTodos: () => {
        const state = get()
        const today = getGameDate(new Date())
        const stale = staleCompletedTodos(state.tasks, today)
        if (stale.length === 0) return

        const staleIds = new Set(stale.map((task) => task.id))
        const now = new Date().toISOString()
        set({
          tasks: state.tasks.map((task) =>
            staleIds.has(task.id) ? { ...task, archivedAt: now } : task,
          ),
        })
      },

      dismissFeedback: (id) => {
        set((state) => ({ feedback: state.feedback.filter((item) => item.id !== id) }))
      },

      resetAll: () => set({ ...initialState(), feedback: [] }),

      enterDungeon: (floor) => {
        const state = get()
        // 이미 진행 중인 전투가 있으면 새로 시작하지 않는다 (입장권 낭비 방지)
        if (state.battle && state.battle.status === 'active') return

        const target = floor ?? state.tower.highestCleared + 1
        if (!canChallenge(target, state.tower.highestCleared)) return

        const today = getGameDate(new Date())
        const day = rollOverDay(state.dungeonDay, today)
        const status = entryStatus({
          today,
          day,
          towerKeys: state.towerKeys,
          keyProgress: state.keyProgress,
        })
        if (status.remaining <= 0) return

        // 오늘 무료 입장을 먼저 쓰고, 다 썼으면 열쇠를 쓴다
        const useKey = status.freeLeft <= 0

        // 새 전투를 시작하기 전에 이전 연출을 정리한다
        useBattleAnimStore.getState().reset()

        const monster = monsterForFloor(target)
        // 동행 펫의 전투 효과를 능력치에 더한다
        const stats = deriveCombatStats(state.character.level, petBonuses(state.activePetId).combat)
        // 스킬 구성과 동행 펫은 이 시점에 확정되어 전투 내내 바뀌지 않는다
        const skillIds = normalizeLoadout(state.skillLoadout, state.tower.highestCleared)

        set({
          // 입장할 때 횟수를 먼저 차감한다. 새로고침으로 되돌릴 수 없다.
          dungeonDay: useKey ? day : { date: today, entriesUsed: day.entriesUsed + 1 },
          towerKeys: useKey ? state.towerKeys - 1 : state.towerKeys,
          tower: { ...state.tower, lastFloor: target },
          battle: createBattle({
            id: newId(),
            monster,
            stats,
            startedOn: today,
            skillIds,
            pet: makeBattlePet(state.activePetId),
          }),
        })
      },

      battleAction: (action) => {
        const state = get()
        const battle = state.battle
        if (!battle || battle.status !== 'active') return
        // 연출이 재생되는 동안 들어온 입력은 무시한다 (같은 공격이 두 번 실행되지 않게)
        if (useBattleAnimStore.getState().isBlocking()) return

        const result = takeTurn(battle, action, Math.random, {
          reviveRatio: reviveRatioOf(state.inventory),
        })
        if (result.battle === battle) return // MP 부족 등으로 아무 일도 일어나지 않음

        set(resolveBattleResult(state, result.battle))
        useBattleAnimStore.getState().enqueue(battle.id, result.steps)
      },

      useBattleItem: (itemId) => {
        const state = get()
        const battle = state.battle
        if (!battle || battle.status !== 'active') return
        if (useBattleAnimStore.getState().isBlocking()) return

        const item = findItem(itemId)
        if (!item || !item.usableInBattle) return
        if ((state.inventory[itemId] ?? 0) <= 0) return
        if (item.effect.kind !== 'heal' && item.effect.kind !== 'mana') return

        const result = useItemTurn(
          battle,
          { kind: item.effect.kind, ratio: item.effect.ratio, name: item.name },
          Math.random,
          { reviveRatio: reviveRatioOf(state.inventory) },
        )

        const spent = { ...state.inventory, [itemId]: state.inventory[itemId] - 1 }
        set({ ...resolveBattleResult({ ...state, inventory: spent }, result.battle), inventory: spent })
        useBattleAnimStore.getState().enqueue(battle.id, result.steps)
      },

      buyShopItem: (itemId, count = 1) => {
        const state = get()
        const item = findItem(itemId)
        if (!item || count <= 0) return

        const cost = item.price * count
        if (state.character.gold < cost) return

        const patch: Partial<GameStore> = {
          character: { ...state.character, gold: state.character.gold - cost },
        }

        // 뽑기권과 탑의 열쇠는 각자의 칸으로 바로 들어간다
        if (item.effect.kind === 'ticket') {
          patch.petTickets = state.petTickets + count
        } else if (item.effect.kind === 'entry') {
          patch.towerKeys = state.towerKeys + count
        } else {
          patch.inventory = {
            ...state.inventory,
            [itemId]: (state.inventory[itemId] ?? 0) + count,
          }
        }

        set({
          ...patch,
          feedback: [
            ...state.feedback,
            {
              id: newId(),
              kind: 'reward',
              title: `${item.name} 구매`,
              detail: `-${cost} Gold${count > 1 ? ` · ${count}개` : ''}`,
            },
          ],
        })
      },

      buyCosmetic: (cosmeticId) => {
        const state = get()
        const cosmetic = findCosmetic(cosmeticId)
        if (!cosmetic) return
        if (state.ownedCosmetics.includes(cosmeticId)) return
        if (state.character.gold < cosmetic.price) return

        set({
          character: { ...state.character, gold: state.character.gold - cosmetic.price },
          ownedCosmetics: [...state.ownedCosmetics, cosmeticId],
          // 산 즉시 장착해준다
          cosmetics: { ...state.cosmetics, [cosmetic.slot]: cosmeticId },
          feedback: [
            ...state.feedback,
            {
              id: newId(),
              kind: 'reward',
              title: `${cosmetic.name} 구매`,
              detail: `-${cosmetic.price} Gold · 바로 착용했습니다`,
            },
          ],
        })
      },

      equipCosmetic: (slot, cosmeticId) => {
        const state = get()
        if (cosmeticId && !state.ownedCosmetics.includes(cosmeticId)) return
        set({ cosmetics: { ...state.cosmetics, [slot]: cosmeticId } })
      },

      leaveBattle: () => {
        // 화면을 나가면 남은 연출도 버린다
        useBattleAnimStore.getState().reset()
        set({ battle: null })
        // 방금 딴 보스로 열린 가구가 있으면 바로 지급한다 (이미 가진 것은 그대로)
        get().syncRoomUnlocks()
      },

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

      addSubject: (draft) => {
        const now = new Date()
        const subject: Subject = {
          ...draft,
          id: newId(),
          rounds: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          createdOn: getGameDate(now),
        }
        set((state) => ({ subjects: [...state.subjects, subject] }))
      },

      updateSubject: (id, patch) => {
        set((state) => ({
          subjects: state.subjects.map((subject) =>
            subject.id === id
              ? { ...subject, ...patch, updatedAt: new Date().toISOString() }
              : subject,
          ),
        }))
      },

      archiveSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.map((subject) =>
            subject.id === id ? { ...subject, archivedAt: new Date().toISOString() } : subject,
          ),
        }))
      },

      addRound: (id) => {
        const state = get()
        const subject = state.subjects.find((item) => item.id === id)
        if (!subject) return

        const now = new Date()
        const today = getGameDate(now)
        const todayCount = countRoundsOn(state.events, subject.id, today)
        const reward = applyPetBonus(
          roundReward(subject.difficulty, todayCount),
          state.activePetId,
        )

        const rounds = subject.rounds + 1
        const reachedTarget = justReachedTarget(rounds, subject.targetRounds)
        const bonusGold = reachedTarget ? STUDY.targetBonusGold : 0

        const event: TaskEvent = {
          id: newId(),
          taskId: subject.id,
          action: 'study_round',
          localDate: today,
          timestamp: now.toISOString(),
          expDelta: reward.exp,
          goldDelta: reward.gold + bonusGold,
          hpDelta: 0,
          metricValue: rounds,
          metricUnit: '회독',
        }

        const applied = applyDeltas(state.character, {
          exp: reward.exp,
          gold: reward.gold + bonusGold,
          hp: 0,
        })

        set({
          character: applied.character,
          subjects: state.subjects.map((item) =>
            item.id === id ? { ...item, rounds, updatedAt: now.toISOString() } : item,
          ),
          events: pruneEvents([...state.events, event], today),
          feedback: [
            ...state.feedback,
            {
              id: newId(),
              kind: 'reward',
              title: `${subject.name} ${rounds}회독`,
              detail: `+${reward.exp} EXP · +${reward.gold + bonusGold} Gold${
                todayCount > 0 ? ` (오늘 ${todayCount + 1}번째)` : ''
              }`,
            },
            ...(reachedTarget
              ? [
                  {
                    id: newId(),
                    kind: 'levelup' as const,
                    title: `${subject.name} 목표 달성!`,
                    detail: `${subject.targetRounds}회독 완료 · 보너스 +${STUDY.targetBonusGold} Gold`,
                  },
                ]
              : []),
            ...applied.feedback,
          ],
          meta: { ...state.meta, updatedAt: now.toISOString() },
        })
      },

      assignTaskToSubject: (taskId, subjectId) => {
        const state = get()
        if (subjectId && !state.subjects.some((subject) => subject.id === subjectId)) return
        set({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? ({
                  ...task,
                  subjectId: subjectId ?? undefined,
                  updatedAt: new Date().toISOString(),
                } as Task)
              : task,
          ),
        })
      },

      addExercise: (group, name, weight = 0) => {
        const trimmed = name.trim()
        if (!trimmed) return
        const state = get()
        // 같은 부위에 같은 이름이 있으면 추가하지 않는다
        if (
          state.workout.exercises.some(
            (exercise) =>
              !exercise.archivedAt && exercise.group === group && exercise.name === trimmed,
          )
        ) {
          return
        }

        const now = new Date()
        const clamped = clampWeight(weight)
        set({
          workout: {
            ...state.workout,
            exercises: [
              ...state.workout.exercises,
              {
                id: newId(),
                group,
                name: trimmed,
                weight: clamped,
                best: clamped,
                updatedOn: getGameDate(now),
                createdAt: now.toISOString(),
              },
            ],
          },
        })
      },

      adjustExerciseWeight: (id, delta) => {
        const state = get()
        const exercise = state.workout.exercises.find((item) => item.id === id)
        if (!exercise) return
        applyExerciseWeight(set, state, id, exercise.weight + delta)
      },

      setExerciseWeight: (id, weight) => {
        applyExerciseWeight(set, get(), id, weight)
      },

      removeExercise: (id) => {
        set((state) => ({
          workout: {
            ...state.workout,
            exercises: state.workout.exercises.filter((exercise) => exercise.id !== id),
          },
        }))
      },

      adjustBigThree: (lift, delta) => {
        const state = get()
        applyBigThree(set, state, lift, state.workout.bigThree[lift] + delta)
      },

      setBigThree: (lift, weight) => {
        applyBigThree(set, get(), lift, weight)
      },

      undoRound: (id) => {
        set((state) => ({
          subjects: state.subjects.map((subject) =>
            subject.id === id && subject.rounds > 0
              ? { ...subject, rounds: subject.rounds - 1, updatedAt: new Date().toISOString() }
              : subject,
          ),
        }))
      },

      toggleSkill: (skillId) => {
        const state = get()
        // 전투 중에는 구성을 바꿀 수 없다 (이번 판의 스킬은 입장할 때 확정된다)
        if (state.battle && state.battle.status === 'active') return
        if (!unlockedSkillIds(state.tower.highestCleared).includes(skillId)) return

        const equipped = state.skillLoadout.includes(skillId)
        if (!equipped && state.skillLoadout.length >= SKILL_SLOTS) return

        const next = equipped
          ? state.skillLoadout.filter((id) => id !== skillId)
          : [...state.skillLoadout, skillId]
        set({ skillLoadout: normalizeLoadout(next, state.tower.highestCleared) })
      },

      placeFurniture: (furnitureId, x, y) => {
        const state = get()
        if (!state.room.owned.includes(furnitureId)) return
        const next = placeInRoom(state.room.placements, furnitureId, x, y)
        if (!next) return
        set({ room: { ...state.room, placements: next } })
      },

      pickUpFurniture: (furnitureId) => {
        const state = get()
        set({
          room: { ...state.room, placements: removeFromRoom(state.room.placements, furnitureId) },
        })
      },

      resetRoom: () => {
        const state = get()
        set({ room: { ...state.room, placements: resetPlacements(state.room.owned) } })
      },

      syncRoomUnlocks: () => {
        const state = get()
        const fresh = newlyAchievedFurniture(
          {
            subjects: state.subjects,
            workout: state.workout,
            tower: state.tower,
            character: state.character,
          },
          state.room.owned,
        )
        if (fresh.length === 0) return

        const { owned, placements } = addFurniture(state.room, fresh)
        set({
          room: { owned, placements },
          feedback: [
            ...state.feedback,
            ...fresh.map((def) => ({
              id: newId(),
              kind: 'evolve' as const,
              title: `새 가구: ${def.name}`,
              detail: '내 방에서 배치할 수 있습니다.',
            })),
          ],
        })
      },

      exportSave: () => {
        const state = get()
        return {
          schemaVersion: SCHEMA_VERSION,
          character: state.character,
          tasks: state.tasks,
          subjects: state.subjects,
          workout: state.workout,
          events: state.events,
          settlements: state.settlements,
          eggs: state.eggs,
          pets: state.pets,
          activePetId: state.activePetId,
          petTickets: state.petTickets,
          materials: state.materials,
          dungeonDay: state.dungeonDay,
          towerKeys: state.towerKeys,
          keyProgress: state.keyProgress,
          tower: state.tower,
          skillLoadout: state.skillLoadout,
          regionClears: state.regionClears,
          room: state.room,
          battle: state.battle,
          inventory: state.inventory,
          ownedCosmetics: state.ownedCosmetics,
          cosmetics: state.cosmetics,
          meta: state.meta,
        }
      },

      importSave: (state) => {
        set({ ...state, feedback: [] })
      },
    }),
    {
      name: 'life-rpg-save',
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        character: state.character,
        tasks: state.tasks,
        subjects: state.subjects,
        workout: state.workout,
        events: state.events,
        settlements: state.settlements,
        eggs: state.eggs,
        pets: state.pets,
        activePetId: state.activePetId,
        petTickets: state.petTickets,
        materials: state.materials,
        dungeonDay: state.dungeonDay,
        towerKeys: state.towerKeys,
        keyProgress: state.keyProgress,
        tower: state.tower,
        skillLoadout: state.skillLoadout,
        regionClears: state.regionClears,
        room: state.room,
        battle: state.battle,
        inventory: state.inventory,
        ownedCosmetics: state.ownedCosmetics,
        cosmetics: state.cosmetics,
        meta: state.meta,
      }),
      // 저장 형식 변환은 services/migrations.ts 한 곳에서만 한다 (가져오기도 같은 함수를 쓴다)
      migrate: (persisted, version) => migrateSave(persisted as Partial<GameState>, version),
    },
  ),
)

/** 무게를 0 ~ 상한 사이로 자르고 0.5kg 단위로 반올림한다 */
function clampWeight(weight: number): number {
  if (!Number.isFinite(weight)) return 0
  return Math.max(0, Math.min(MAX_WEIGHT, Math.round(weight * 2) / 2))
}

type SetState = (partial: Partial<GameStore>) => void

/** 종목 무게를 바꾸고 최고 기록을 갱신한다 */
function applyExerciseWeight(set: SetState, state: GameStore, id: string, weight: number) {
  const next = clampWeight(weight)
  const today = getGameDate(new Date())
  set({
    workout: {
      ...state.workout,
      exercises: state.workout.exercises.map((exercise) =>
        exercise.id === id
          ? { ...exercise, weight: next, best: Math.max(exercise.best, next), updatedOn: today }
          : exercise,
      ),
    },
  })
}

/** 3대 운동 무게를 바꾸고 최고 기록을 갱신한다 */
function applyBigThree(set: SetState, state: GameStore, lift: BigThreeLift, weight: number) {
  const next = clampWeight(weight)
  set({
    workout: {
      ...state.workout,
      bigThree: { ...state.workout.bigThree, [lift]: next },
      bigThreeBest: {
        ...state.workout.bigThreeBest,
        [lift]: Math.max(state.workout.bigThreeBest[lift] ?? 0, next),
      },
    },
  })
}

/** 부활의 부적을 가지고 있으면 회복 비율을, 없으면 null을 준다 */
function reviveRatioOf(inventory: Record<string, number>): number | null {
  if ((inventory.revive_charm ?? 0) <= 0) return null
  const item = findItem('revive_charm')
  return item && item.effect.kind === 'revive' ? item.effect.ratio : null
}

/**
 * 전투 결과를 상태 변화로 바꾼다.
 * 승리 보상은 rewardGranted가 false일 때 한 번만 지급하므로
 * 새로고침이나 버튼 연타로 다시 받을 수 없다.
 */
function resolveBattleResult(state: GameStore, battle: BattleState): Partial<GameStore> {
  let next = battle
  const patch: Partial<GameStore> = {}
  const feedback: FeedbackItem[] = []

  // 부활의 부적이 이번 전투에서 쓰였으면 소모 처리
  if (next.revivedOnce && !state.battle?.revivedOnce) {
    patch.inventory = {
      ...state.inventory,
      revive_charm: Math.max(0, (state.inventory.revive_charm ?? 0) - 1),
    }
    feedback.push({
      id: newId(),
      kind: 'reward',
      title: '부활의 부적 발동',
      detail: '쓰러지지 않고 다시 일어섰습니다.',
    })
  }

  if (next.status === 'won' && !next.rewardGranted) {
    const monster = next.monsterDef
    const base = calcRewards(monster, Math.random)
    const bonus = firstClearBonus(next.floor, state.tower.highestCleared)
    const gold = base.gold + bonus

    const materials = { ...state.materials }
    for (const [id, amount] of Object.entries(base.materials)) {
      materials[id] = (materials[id] ?? 0) + amount
    }

    next = {
      ...next,
      rewardGranted: true,
      rewards: { gold, materials: base.materials, firstClearBonus: bonus || undefined },
    }
    patch.materials = materials
    patch.character = { ...state.character, gold: state.character.gold + gold }
    patch.tower = {
      highestCleared: Math.max(state.tower.highestCleared, next.floor),
      lastFloor: next.floor,
    }

    const materialText = Object.entries(base.materials)
      .map(([id, amount]) => `${MATERIALS[id]?.name ?? id} x${amount}`)
      .join(', ')
    feedback.push({
      id: newId(),
      kind: monster.isBoss ? 'levelup' : 'reward',
      title: `${next.floor}층 ${monster.name} 처치!`,
      detail: `+${gold} Gold${bonus ? ` (첫 격파 +${bonus})` : ''}${materialText ? ` · ${materialText}` : ''}`,
    })

    // 지역 첫 클리어 보상은 regionClears 에 기록된 적이 없을 때만 한 번 지급한다
    const region = newlyClearedRegion(next.floor, state.regionClears)
    if (region) {
      patch.regionClears = [...state.regionClears, region.id]
      const reward = region.firstClearReward
      if (reward) {
        if (reward.kind === 'furniture') {
          const added = addFurniture(state.room, [findFurniture(reward.id)].filter(isFurniture))
          patch.room = added
        } else if (reward.kind === 'pet') {
          if (!state.pets.some((pet) => pet.speciesId === reward.id)) {
            patch.pets = [
              ...state.pets,
              { id: newId(), speciesId: reward.id, hatchedOn: next.startedOn },
            ]
          }
          patch.activePetId = state.activePetId ?? reward.id
        } else if (reward.kind === 'cosmetic') {
          const cosmetic = findCosmetic(reward.id)
          if (cosmetic && !state.ownedCosmetics.includes(reward.id)) {
            patch.ownedCosmetics = [...state.ownedCosmetics, reward.id]
            patch.cosmetics = { ...state.cosmetics, [cosmetic.slot]: reward.id }
          }
        }
      }
      feedback.push({
        id: newId(),
        kind: 'evolve',
        title: `${region.name} 정복!`,
        detail: reward
          ? `${reward.name} 획득 · ${reward.note}`
          : '새로운 지역이 열렸습니다.',
      })
    }
  }

  if (next.status === 'lost') {
    feedback.push({
      id: newId(),
      kind: 'penalty',
      title: `${next.floor}층에서 패배했습니다`,
      detail: '생활 HP와 과제 기록에는 영향이 없습니다.',
    })
  }

  return { ...patch, battle: next, feedback: [...state.feedback, ...feedback] }
}

function isFurniture(def: FurnitureDef | undefined): def is FurnitureDef {
  return Boolean(def)
}

/**
 * 새로 얻은 가구를 보유 목록에 넣고, 자리가 있으면 바로 놓아준다.
 * 이미 가지고 있는 가구는 다시 넣지 않으므로 중복 지급이 생기지 않는다.
 */
function addFurniture(
  room: GameState['room'],
  items: FurnitureDef[],
): GameState['room'] {
  const owned = [...room.owned]
  let placements = [...room.placements]

  for (const def of items) {
    if (owned.includes(def.id)) continue
    owned.push(def.id)
    const spot = firstFreeSpot(placements, def)
    if (spot) placements = [...placements, { furnitureId: def.id, x: spot.x, y: spot.y }]
  }

  return { owned, placements }
}

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
