import { EmptyState, PageShell } from '../components/layout/PageShell'

export function HistoryPage() {
  return (
    <PageShell
      title="기록"
      description="날짜별 수행 결과와 HP·EXP·Gold 변화를 확인합니다."
    >
      <EmptyState
        message="아직 기록이 없습니다."
        hint="과제를 완료하면 이곳에 게임 날짜별로 쌓입니다."
      />
    </PageShell>
  )
}
