import { AlertTriangle, Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { PageShell, Panel } from '../components/layout/PageShell'
import { DAY_START_HOUR, SETTLEMENT } from '../data/gameConfig'
import { backupFileName, createBackup, parseBackup, type BackupSummary } from '../services/backup'
import { useGameStore } from '../store/useGameStore'

export function SettingsPage() {
  const exportSave = useGameStore((state) => state.exportSave)
  const importSave = useGameStore((state) => state.importSave)
  const resetAll = useGameStore((state) => state.resetAll)

  const tasks = useGameStore((state) => state.tasks)
  const events = useGameStore((state) => state.events)
  const character = useGameStore((state) => state.character)
  const pets = useGameStore((state) => state.pets)
  const tower = useGameStore((state) => state.tower)

  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState<{ summary: BackupSummary; apply: () => void } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = () => {
    setError('')
    const backup = createBackup(exportSave())
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName()
    link.click()
    URL.revokeObjectURL(url)
    setNotice(`${backupFileName()} 파일을 내려받았습니다.`)
  }

  const handleFile = async (file: File) => {
    setError('')
    setNotice('')
    const text = await file.text()
    const result = parseBackup(text)

    if (!result.ok) {
      setError(result.error)
      return
    }

    // 덮어쓰기 전에 무엇이 들어오는지 보여주고 확인을 받는다
    setPending({
      summary: result.summary,
      apply: () => {
        importSave(result.state)
        setPending(null)
        setNotice('백업을 불러왔습니다.')
      },
    })
  }

  return (
    <PageShell title="설정">
      <div className="flex flex-col gap-4">
        <Panel title="하루 기준">
          <ul className="space-y-1.5 text-sm text-slate-300">
            <li>하루는 현지 시간 오전 {DAY_START_HOUR}시에 시작합니다.</li>
            <li>오전 0:00~{DAY_START_HOUR - 1}:59에 한 기록은 전날로 집계됩니다.</li>
            <li>
              접속하지 않은 기간은 최근 {SETTLEMENT.maxCatchUpDays}일까지만 정산하며, 하루 피해는
              최대 HP의 {Math.round(SETTLEMENT.dailyDamageCapRatio * 100)}%를 넘지 않습니다.
            </li>
          </ul>
        </Panel>

        <Panel title="데이터 백업">
          <p className="-mt-2 mb-3 text-xs text-slate-500">
            기록은 이 브라우저에만 저장됩니다. 다른 기기나 다른 주소(로컬 ↔ 인터넷)로 옮기려면
            내보낸 파일을 가져오기 하세요.
          </p>

          <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-abyss-800 p-3 text-sm sm:grid-cols-3">
            <div className="flex justify-between">
              <dt className="text-slate-400">레벨</dt>
              <dd className="tabular-nums text-slate-100">{character.level}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Gold</dt>
              <dd className="tabular-nums text-gold-400">{character.gold.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">과제</dt>
              <dd className="tabular-nums text-slate-100">{tasks.length}개</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">기록</dt>
              <dd className="tabular-nums text-slate-100">{events.length}건</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">펫</dt>
              <dd className="tabular-nums text-slate-100">{pets.length}마리</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">최고 층</dt>
              <dd className="tabular-nums text-ember-400">{tower.highestCleared}층</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg bg-ember-500 px-4 py-2 text-sm font-semibold text-abyss-950 hover:bg-ember-400"
            >
              <Download size={16} aria-hidden />
              내보내기
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-abyss-700 px-4 py-2 text-sm text-slate-200 hover:bg-abyss-800"
            >
              <Upload size={16} aria-hidden />
              가져오기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(changeEvent) => {
                const file = changeEvent.target.files?.[0]
                if (file) void handleFile(file)
                changeEvent.target.value = ''
              }}
            />

            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-vital-500/50 px-4 py-2 text-sm text-vital-400 hover:bg-vital-500/10"
            >
              <RotateCcw size={16} aria-hidden />
              초기화
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-1.5 rounded-lg bg-vital-500/10 px-3 py-2 text-sm text-vital-400"
            >
              <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          {notice && !error && (
            <p role="status" className="mt-3 text-sm text-emerald-400">
              {notice}
            </p>
          )}
        </Panel>
      </div>

      {pending && (
        <ConfirmDialog
          title="이 백업으로 덮어쓸까요?"
          danger="지금 이 브라우저의 기록은 모두 사라집니다."
          confirmLabel="덮어쓰기"
          onCancel={() => setPending(null)}
          onConfirm={pending.apply}
        >
          <ul className="space-y-1 text-sm text-slate-300">
            <li>레벨 {pending.summary.level}</li>
            <li>Gold {pending.summary.gold.toLocaleString()}</li>
            <li>과제 {pending.summary.tasks}개 · 기록 {pending.summary.events}건</li>
            <li>펫 {pending.summary.pets}마리 · 최고 {pending.summary.highestFloor}층</li>
            <li className="text-xs text-slate-500">
              내보낸 시각: {formatExportedAt(pending.summary.exportedAt)}
            </li>
          </ul>
        </ConfirmDialog>
      )}

      {confirmReset && (
        <ConfirmDialog
          title="정말 초기화할까요?"
          danger="과제, 기록, 캐릭터, 펫, 탑 진행도가 모두 지워집니다. 되돌릴 수 없습니다."
          confirmLabel="초기화"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetAll()
            setConfirmReset(false)
            setNotice('처음 상태로 되돌렸습니다.')
          }}
        >
          <p className="text-sm text-slate-400">
            먼저 내보내기로 백업해두면 나중에 되돌릴 수 있습니다.
          </p>
        </ConfirmDialog>
      )}
    </PageShell>
  )
}

function formatExportedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ko-KR')
}

function ConfirmDialog({
  title,
  danger,
  confirmLabel,
  onCancel,
  onConfirm,
  children,
}: {
  title: string
  danger: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-2xl border border-abyss-700 bg-abyss-900 p-5">
        <h2 className="mb-3 text-base font-bold text-slate-100">{title}</h2>
        <div className="mb-3">{children}</div>
        <p className="mb-4 rounded-lg bg-vital-500/10 px-3 py-2 text-xs text-vital-400">{danger}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:bg-abyss-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="rounded-lg bg-vital-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vital-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
