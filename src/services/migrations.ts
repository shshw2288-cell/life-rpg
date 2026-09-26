import { STARTING_TOWER_KEYS } from '../data/battleConfig'
import { CHARACTER_DEFAULTS } from '../data/gameConfig'
import { GACHA } from '../data/petConfig'
import { findRegion } from '../data/regionConfig'
import { DEFAULT_PLACEMENTS, STARTER_FURNITURE } from '../data/roomConfig'
import { makeBattlePet } from '../engine/petCombat'
import { clearedRegionIds } from '../engine/regions'
import { resetPlacements, sanitizePlacements } from '../engine/room'
import { defaultLoadout, initSkillStates, normalizeLoadout } from '../engine/skills'
import { monsterForFloor } from '../engine/tower'
import { addDays, getGameDate } from '../lib/date'
import type { BattleState } from '../types/battle'
import type { GameState } from '../types/gameState'
import { SCHEMA_VERSION } from '../types/gameState'
import type { Pet } from '../types/pet'
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
      cosmetics: state.cosmetics ?? { hat: null, face: null, aura: null, cape: null },
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

  // v7 -> v8: 입장 제한 폐지. 열쇠 적립칸을 만들고 100 Gold와 열쇠 2개를 지급한다.
  if (version < 8) {
    state = {
      ...state,
      keyProgress: state.keyProgress ?? 0,
      towerKeys: (state.towerKeys ?? 0) + 2,
      character: state.character
        ? { ...state.character, gold: (state.character.gold ?? 0) + 100 }
        : state.character,
    }
  }

  // v8 -> v9: 스킬 장착 · 지역 · 내 방 추가.
  // 이미 오른 층으로 지역 진행도를 그대로 인정하고, 그 지역의 첫 클리어 보상을 한 번만 지급한다.
  if (version < 9) {
    state = grantClearedRegions({
      ...state,
      skillLoadout: state.skillLoadout ?? defaultLoadout(),
      room: state.room ?? { owned: [...STARTER_FURNITURE], placements: [...DEFAULT_PLACEMENTS] },
    })
  }

  return withDefaults(state)
}

/**
 * 이미 깬 지역의 첫 클리어 보상을 한 번만 지급한다.
 * regionClears 에 기록해 두므로 다음 실행에서 다시 주지 않는다.
 */
function grantClearedRegions(state: Partial<GameState>): Partial<GameState> {
  const highest = state.tower?.highestCleared ?? 0
  const cleared = clearedRegionIds(highest)
  const already = new Set(state.regionClears ?? [])
  const pending = cleared.filter((id) => !already.has(id))
  if (pending.length === 0) {
    return { ...state, regionClears: state.regionClears ?? [] }
  }

  const pets: Pet[] = [...(state.pets ?? [])]
  const ownedCosmetics = [...(state.ownedCosmetics ?? [])]
  const room = state.room ?? { owned: [...STARTER_FURNITURE], placements: [...DEFAULT_PLACEMENTS] }
  const owned = [...room.owned]
  const today = getGameDate(new Date())

  for (const id of pending) {
    const reward = findRegion(id)?.firstClearReward
    if (!reward) continue
    if (reward.kind === 'pet' && !pets.some((pet) => pet.speciesId === reward.id)) {
      pets.push({ id: `region-${reward.id}`, speciesId: reward.id, hatchedOn: today })
    }
    if (reward.kind === 'cosmetic' && !ownedCosmetics.includes(reward.id)) {
      ownedCosmetics.push(reward.id)
    }
    if (reward.kind === 'furniture' && !owned.includes(reward.id)) {
      owned.push(reward.id)
    }
  }

  return {
    ...state,
    pets,
    ownedCosmetics,
    room: { ...room, owned },
    regionClears: [...already, ...pending],
  }
}

/**
 * 진행 중이던 전투를 새 형식에 맞춘다.
 * 몬스터 정보는 층에서 다시 만들고, 새로 생긴 칸은 기본값으로 채운다.
 * 이렇게 하면 업데이트 도중이던 전투도 버리지 않고 이어서 할 수 있다.
 */
function normalizeBattle(
  battle: BattleState | null | undefined,
  loadout: string[],
  activePetId: string | null,
): BattleState | null {
  if (!battle) return null
  return {
    ...battle,
    monsterDef: monsterForFloor(battle.floor),
    playerStatuses: battle.playerStatuses ?? [],
    monsterStatuses: battle.monsterStatuses ?? [],
    skills: battle.skills ?? initSkillStates(loadout),
    pet: battle.pet ?? makeBattlePet(activePetId),
    intent: battle.intent ?? null,
    patternIndex: battle.patternIndex ?? 0,
  }
}

/** 빠진 값을 기본값으로 채워 언제나 온전한 상태를 돌려준다 */
export function withDefaults(state: Partial<GameState>): GameState {
  const today = getGameDate(new Date())
  const now = new Date().toISOString()

  const tower = state.tower ?? { highestCleared: 0, lastFloor: 1 }
  const activePetId = state.activePetId ?? null
  const skillLoadout = normalizeLoadout(
    state.skillLoadout ?? defaultLoadout(),
    tower.highestCleared,
  )
  const ownedFurniture = state.room?.owned?.length
    ? Array.from(new Set(state.room.owned))
    : [...STARTER_FURNITURE]
  const placements = state.room?.placements
    ? sanitizePlacements(state.room.placements, ownedFurniture)
    : resetPlacements(ownedFurniture)

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
    activePetId,
    petTickets: state.petTickets ?? GACHA.startingTickets,
    materials: state.materials ?? {},
    dungeonDay: state.dungeonDay ?? { date: today, entriesUsed: 0 },
    towerKeys: state.towerKeys ?? STARTING_TOWER_KEYS,
    keyProgress: state.keyProgress ?? 0,
    tower,
    skillLoadout,
    regionClears: state.regionClears ?? [],
    room: { owned: ownedFurniture, placements },
    battle: normalizeBattle(state.battle, skillLoadout, activePetId),
    inventory: state.inventory ?? {},
    ownedCosmetics: state.ownedCosmetics ?? [],
    cosmetics: {
      hat: state.cosmetics?.hat ?? null,
      face: state.cosmetics?.face ?? null,
      aura: state.cosmetics?.aura ?? null,
      cape: state.cosmetics?.cape ?? null,
    },
    meta: {
      lastSettledDate: state.meta?.lastSettledDate ?? addDays(today, -1),
      createdAt: state.meta?.createdAt ?? now,
      updatedAt: now,
    },
  }
}
