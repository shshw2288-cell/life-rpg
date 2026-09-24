import type { GameState } from '../types/gameState'
import { SCHEMA_VERSION } from '../types/gameState'
import { migrateSave } from './migrations'

/** 백업 파일 형식. 기기를 옮기거나 되돌릴 때 쓴다. */
export interface BackupFile {
  app: 'life-rpg'
  schemaVersion: number
  exportedAt: string
  state: GameState
}

export const BACKUP_APP_ID = 'life-rpg'

export function createBackup(state: GameState): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  }
}

/** 파일 이름: life-rpg-backup-2025-09-25.json */
export function backupFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `life-rpg-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

export interface BackupSummary {
  tasks: number
  events: number
  level: number
  gold: number
  pets: number
  highestFloor: number
  exportedAt: string
}

export type ParseResult =
  | { ok: true; state: GameState; summary: BackupSummary }
  | { ok: false; error: string }

/**
 * 가져온 파일을 검사한다.
 * 형식이 어긋나면 이유를 한국어로 돌려주고, 옛 버전이면 현재 형식으로 올린다.
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON 파일이 아닙니다. 내보내기로 만든 파일을 선택해 주세요.' }
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: '내용이 비어 있거나 형식이 올바르지 않습니다.' }
  }

  const file = raw as Partial<BackupFile>

  if (file.app !== BACKUP_APP_ID) {
    return { ok: false, error: '이 게임의 백업 파일이 아닙니다.' }
  }

  const version = file.schemaVersion
  if (typeof version !== 'number' || Number.isNaN(version) || version < 1) {
    return { ok: false, error: '백업 버전 정보가 없습니다.' }
  }

  if (version > SCHEMA_VERSION) {
    return {
      ok: false,
      error: `더 새로운 버전(v${version})의 백업입니다. 앱을 최신으로 갱신한 뒤 다시 시도해 주세요.`,
    }
  }

  const state = file.state as Partial<GameState> | undefined
  if (!state || typeof state !== 'object') {
    return { ok: false, error: '저장 데이터가 들어 있지 않습니다.' }
  }
  if (!state.character || typeof state.character.level !== 'number') {
    return { ok: false, error: '캐릭터 정보가 손상되었습니다.' }
  }
  if (state.tasks !== undefined && !Array.isArray(state.tasks)) {
    return { ok: false, error: '과제 목록이 손상되었습니다.' }
  }
  if (state.events !== undefined && !Array.isArray(state.events)) {
    return { ok: false, error: '기록 목록이 손상되었습니다.' }
  }

  const migrated = migrateSave(state, version)

  return {
    ok: true,
    state: migrated,
    summary: {
      tasks: migrated.tasks.length,
      events: migrated.events.length,
      level: migrated.character.level,
      gold: migrated.character.gold,
      pets: migrated.pets.length,
      highestFloor: migrated.tower.highestCleared,
      exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : '알 수 없음',
    },
  }
}
