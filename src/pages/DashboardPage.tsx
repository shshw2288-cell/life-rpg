import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'
import { formatDisplayDate, getGameDate } from '../lib/date'

export function DashboardPage() {
  const today = getGameDate(new Date())

  return (
    <PageShell title="오늘의 퀘스트" description={`${formatDisplayDate(today)} 기준`}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <Panel title="반복 과제">
            <EmptyState
              message="오늘 예정된 반복 과제가 없습니다."
              hint="과제 관리 화면에서 추가할 수 있습니다."
            />
          </Panel>
          <Panel title="습관">
            <EmptyState message="등록한 습관이 없습니다." />
          </Panel>
          <Panel title="할 일">
            <EmptyState message="남아 있는 할 일이 없습니다." />
          </Panel>
        </div>

        <aside className="flex flex-col gap-4">
          <Panel title="오늘의 성과">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">획득 EXP</dt>
                <dd className="tabular-nums text-mana-400">0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">획득 Gold</dt>
                <dd className="tabular-nums text-gold-400">0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">연속 수행일</dt>
                <dd className="tabular-nums text-slate-200">0일</dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    </PageShell>
  )
}
