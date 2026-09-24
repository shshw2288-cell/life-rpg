import { PageShell, Panel } from '../components/layout/PageShell'
import { DAY_START_HOUR, SETTLEMENT } from '../data/gameConfig'

export function SettingsPage() {
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

        <Panel title="데이터">
          <p className="text-sm text-slate-400">
            내보내기·가져오기·초기화는 저장 기능을 붙이는 단계에서 추가합니다.
          </p>
        </Panel>
      </div>
    </PageShell>
  )
}
