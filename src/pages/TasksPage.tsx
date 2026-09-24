import { EmptyState, PageShell, Panel } from '../components/layout/PageShell'

export function TasksPage() {
  return (
    <PageShell
      title="과제 관리"
      description="습관, 반복 과제, 할 일을 추가하고 수정합니다."
    >
      <div className="flex flex-col gap-4">
        <Panel title="습관">
          <EmptyState message="등록한 습관이 없습니다." />
        </Panel>
        <Panel title="반복 과제">
          <EmptyState message="등록한 반복 과제가 없습니다." />
        </Panel>
        <Panel title="할 일">
          <EmptyState message="등록한 할 일이 없습니다." />
        </Panel>
      </div>
    </PageShell>
  )
}
