import { STARTING_TOWER_KEYS } from '../data/battleConfig'
import { CHARACTER_DEFAULTS } from '../data/gameConfig'
import { GACHA } from '../data/petConfig'
import { addDays, getGameDate } from '../lib/date'
import type { GameState } from '../types/gameState'
import { SCHEMA_VERSION } from '../types/gameState'
import { EMPTY_WORKOUT } from '../types/workout'

/**
 * 저장 데이터를 현재 형식으로 올린다.
 * localStorage 복원과 백업 가져오기가 같은 함수를 쓴다.
 */
export function migrateSave(input: Partial<GameState>, version: number): GameState {
  let state: Partial<GameState> = { ...input }

  // v1 -> v2: 던전 필드 추가. 기존 과제·기록은 그대로 둔다.
  if (version < 2) {
    state = {
      ...state,
      materials: state.materials ?? {},
      dungeonDay: state.dungeonDay ?? { date: getGameDate(new Date()), entriesUsed: 0 },
      battle: state.battle ?? null,
    }
  }

  // v2 -> v3: 펫 등급·뽑기 추가. 이미 모은 펫은 두고 첫 마리를 동행으로 지정한다.
  if (version < 3) {
    state = {
      ...state,
      petTickets: state.petTickets ?? GACHA.startingTickets,
      activePetId: state.activePetId ?? state.pets?.[0]?.speciesId ?? null,
    }
  }

  // v3 -> v4: 탑·상점 추가.
  // 예전 전투는 몬스터를 id로만 저장해 층 구조로 복원할 수 없어 진행 중이던 한 판만 버린다.
  if (version < 4) {
    state = {
      ...state,
      towerKeys: state.towerKeys ?? 0,
      tower: state.tower ?? { highestCleared: 0, lastFloor: 1 },
      inventory: state.inventory ?? {},
      ownedCosmetics: state.ownedCosmetics ?? [],
      cosmetics: state.cosmetics ?? { hat: null, face: null, aura: null },
      battle: null,
    }
  }

  // v4 -> v5: 공부 과목 추가. 기존 데이터는 건드리지 않는다.
  if (version < 5) {
    state = { ...state, subjects: state.subjects ?? [] }
  }

  // v5 -> v6: 운동 기록 추가.
  if (version < 6) {
    state = { ...state, workout: state.workout ?? EMPTY_WORKOUT }
  }

  // v6 -> v7: 탑의 열쇠 1개 지급. 버전으로 한 번만 실행되므로 중복 지급되지 않는다.
  if (version < 7) {
    state = { ...state, towerKeys: (state.towerKeys ?? 0) + STARTING_TOWER_KEYS }
  }

  return withDefaults(state)
}

/** 빠진 값을 기본값으로 채워 언제나 온전한 상태를 돌려준다 */
export function withDefaults(state: Partial<GameState>): GameState {
  const today = getGameDate(new Date())
  const now = new Date().toISOString()

  return {
    schemaVersion: SCHEMA_VERSION,
    character: {
      level: state.character?.level ?? CHARACTER_DEFAULTS.level,
      exp: state.character?.exp ?? CHARACTER_DEFAULTS.exp,
      hp: state.character?.hp ?? CHARACTER_DEFAULTS.maxHp,
      maxHp: state.character?.maxHp ?? CHARACTER_DEFAULTS.maxHp,
      gold: state.character?.gold ?? CHARACTER_DEFAULTS.gold,
    },
    tasks: state.tasks ?? [],
    subjects: state.subjects ?? [],
    workout: {
      bigThree: { ...EMPTY_WORKOUT.bigThree, ...state.workout?.bigThree },
      bigThreeBest: { ...EMPTY_WORKOUT.bigThreeBest, ...state.workout?.bigThreeBest },
      exercises: state.workout?.exercises ?? [],
    },
    events: state.events ?? [],
    settlements: state.settlements ?? [],
    eggs: state.eggs ?? [],
    pets: state.pets ?? [],
    activePetId: state.activePetId ?? null,
    petTickets: state.petTickets ?? GACHA.startingTickets,
    materials: state.materials ?? {},
    dungeonDay: state.dungeonDay ?? { date: today, entriesUsed: 0 },
    towerKeys: state.towerKeys ?? STARTING_TOWER_KEYS,
    tower: state.tower ?? { highestCleared: 0, lastFloor: 1 },
    battle: state.battle ?? null,
    inventory: state.inventory ?? {},
    ownedCosmetics: state.ownedCosmetics ?? [],
    cosmetics: state.cosmetics ?? { hat: null, face: null, aura: null },
    meta: {
      lastSettledDate: state.meta?.lastSettledDate ?? addDays(today, -1),
      createdAt: state.meta?.createdAt ?? now,
      updatedAt: now,
    },
  }
}
