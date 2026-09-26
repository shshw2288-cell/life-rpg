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

  it('v6 저장 데이터에는 탑의 열쇠 1개가 지급된다', () => {
    const before = { ...sample, towerKeys: 2 }
    const migrated = migrateSave(before, 6)
    expect(migrated.towerKeys).toBe(3)

    // 이미 v7이면 다시 주지 않는다
    expect(migrateSave(migrated, 7).towerKeys).toBe(3)
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
    expect(result.state.cosmetics).toEqual({ hat: null, face: null, aura: null })
    expect(result.state.character.level).toBe(3)
  })
})
