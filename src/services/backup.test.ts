import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION } from '../types/gameState'
import { backupFileName, createBackup, parseBackup } from './backup'
import { migrateSave, withDefaults } from './migrations'

const sample = withDefaults({
  character: { level: 7, exp: 20, hp: 30, maxHp: 50, gold: 900 },
  tasks: [
    {
      type: 'daily',
      id: 't1',
      title: '운동',
      difficulty: 3,
      repeatDays: [],
      createdOn: '2025-09-20',
      createdAt: '2025-09-20T08:00:00.000Z',
      updatedAt: '2025-09-20T08:00:00.000Z',
    },
  ],
  tower: { highestCleared: 12, lastFloor: 12 },
})

describe('백업 내보내기', () => {
  it('앱 표시와 버전을 담는다', () => {
    const backup = createBackup(sample)
    expect(backup.app).toBe('life-rpg')
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION)
    expect(backup.state.character.gold).toBe(900)
  })

  it('파일 이름에 날짜가 들어간다', () => {
    expect(backupFileName(new Date(2025, 8, 25))).toBe('life-rpg-backup-2025-09-25.json')
  })
})

describe('백업 가져오기 검사', () => {
  it('내보낸 파일을 그대로 되돌린다', () => {
    const text = JSON.stringify(createBackup(sample))
    const result = parseBackup(text)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.character.level).toBe(7)
    expect(result.state.tasks).toHaveLength(1)
    expect(result.summary).toMatchObject({ level: 7, tasks: 1, highestFloor: 12 })
  })

  it('JSON이 아니면 거부한다', () => {
    const result = parseBackup('이건 그냥 글자')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('JSON')
  })

  it('다른 앱의 파일은 거부한다', () => {
    const result = parseBackup(JSON.stringify({ app: 'other-game', schemaVersion: 1, state: {} }))
    expect(result.ok).toBe(false)
  })

  it('앞으로 나올 버전은 거부한다', () => {
    const backup = { ...createBackup(sample), schemaVersion: SCHEMA_VERSION + 1 }
    const result = parseBackup(JSON.stringify(backup))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('새로운 버전')
  })

  it('캐릭터 정보가 없으면 거부한다', () => {
    const result = parseBackup(
      JSON.stringify({ app: 'life-rpg', schemaVersion: SCHEMA_VERSION, state: { tasks: [] } }),
    )
    expect(result.ok).toBe(false)
  })

  it('과제 목록이 배열이 아니면 거부한다', () => {
    const result = parseBackup(
      JSON.stringify({
        app: 'life-rpg',
        schemaVersion: SCHEMA_VERSION,
        state: { character: { level: 1 }, tasks: '망가짐' },
      }),
    )
    expect(result.ok).toBe(false)
  })

  it('옛 저장 데이터에 열쇠와 Gold를 한 번만 지급한다', () => {
    const before = { ...sample, towerKeys: 2, character: { ...sample.character, gold: 100 } }

    // v6 -> v8: v7의 열쇠 1개 + v8의 열쇠 2개, Gold 100
    const migrated = migrateSave(before, 6)
    expect(migrated.towerKeys).toBe(5)
    expect(migrated.character.gold).toBe(200)

    // 이미 최신이면 다시 주지 않는다
    const again = migrateSave(migrated, SCHEMA_VERSION)
    expect(again.towerKeys).toBe(5)
    expect(again.character.gold).toBe(200)
  })

  it('v7 저장 데이터에는 v8 지급만 적용된다', () => {
    const migrated = migrateSave({ ...sample, towerKeys: 1 }, 7)
    expect(migrated.towerKeys).toBe(3)
    expect(migrated.keyProgress).toBe(0)
  })

  it('v9는 스킬·지역·내 방 기본값을 채운다', () => {
    const migrated = migrateSave({ ...sample, tower: { highestCleared: 0, lastFloor: 1 } }, 8)
    expect(migrated.skillLoadout).toHaveLength(3)
    expect(migrated.regionClears).toEqual([])
    expect(migrated.room.owned.length).toBeGreaterThan(0)
    expect(migrated.room.placements.length).toBeGreaterThan(0)
    expect(migrated.cosmetics.cape).toBeNull()
  })

  it('이미 오른 층으로 지역 진행도를 인정하고 보상을 한 번만 준다', () => {
    // 지역 기능 이전에 25층까지 오른 저장 데이터
    const old = { ...sample, tower: { highestCleared: 25, lastFloor: 25 }, pets: [] }
    const migrated = migrateSave(old, 8)

    expect(migrated.regionClears).toEqual(['forest', 'cave'])
    expect(migrated.room.owned).toContain('sprout_pot')
    expect(migrated.pets.filter((pet) => pet.speciesId === 'spore_cap')).toHaveLength(1)
    // 아직 못 깬 지역의 보상은 없다
    expect(migrated.ownedCosmetics).not.toContain('wind_cloak')

    // 다시 올려도 늘지 않는다
    const again = migrateSave(migrated, SCHEMA_VERSION)
    expect(again.regionClears).toEqual(['forest', 'cave'])
    expect(again.pets.filter((pet) => pet.speciesId === 'spore_cap')).toHaveLength(1)
  })

  it('진행 중이던 전투는 새 형식으로 이어 받는다', () => {
    const old = {
      ...sample,
      tower: { highestCleared: 4, lastFloor: 5 },
      battle: {
        id: 'b1',
        floor: 5,
        startedOn: '2025-09-25',
        turn: 3,
        status: 'active',
        player: { hp: 20, maxHp: 60, mp: 4, maxMp: 20 },
        playerStats: { maxHp: 60, attack: 10, defense: 3, maxMp: 20, critChance: 0.05 },
        monster: { hp: 30, maxHp: 100 },
        defending: false,
        monsterCharging: false,
        patternIndex: 0,
        log: [],
        rewardGranted: false,
        revivedOnce: false,
      },
    }
    // v8 세이브에는 skills·pet·statuses·intent 칸이 없다
    const migrated = migrateSave(old as never, 8)

    expect(migrated.battle).not.toBeNull()
    expect(migrated.battle!.turn).toBe(3)
    expect(migrated.battle!.player.hp).toBe(20)
    expect(migrated.battle!.monsterDef.floor).toBe(5)
    expect(migrated.battle!.playerStatuses).toEqual([])
    expect(migrated.battle!.skills.length).toBeGreaterThan(0)
  })

  it('옛 버전 백업은 현재 형식으로 올려서 받는다', () => {
    const old = {
      app: 'life-rpg',
      schemaVersion: 1,
      exportedAt: '2025-01-01T00:00:00.000Z',
      state: {
        schemaVersion: 1,
        character: { level: 3, exp: 0, hp: 40, maxHp: 50, gold: 120 },
        tasks: [],
        events: [],
        settlements: [],
        meta: { lastSettledDate: '2024-12-31', createdAt: '', updatedAt: '' },
      },
    }
    const result = parseBackup(JSON.stringify(old))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    // v1에는 없던 필드가 기본값으로 채워져야 한다
    expect(result.state.schemaVersion).toBe(SCHEMA_VERSION)
    expect(result.state.tower).toEqual({ highestCleared: 0, lastFloor: 1 })
    expect(result.state.cosmetics).toEqual({ hat: null, face: null, aura: null, cape: null })
    expect(result.state.character.level).toBe(3)
  })
})
