import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FeedbackToasts } from '../components/feedback/FeedbackToasts'
import { EffectLayer } from '../features/effects/EffectLayer'
import { Sidebar } from '../components/layout/Sidebar'
import { TopBar } from '../components/layout/TopBar'
import { CharacterPage } from '../pages/CharacterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { DungeonPage } from '../pages/DungeonPage'
import { HistoryPage } from '../pages/HistoryPage'
import { PetsPage } from '../pages/PetsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { ShopPage } from '../pages/ShopPage'
import { StudyPage } from '../pages/StudyPage'
import { WorkoutPage } from '../pages/WorkoutPage'
import { TasksPage } from '../pages/TasksPage'
import { useGameStore } from '../store/useGameStore'

export default function App() {
  const runSettlement = useGameStore((state) => state.runSettlement)
  const archiveStaleTodos = useGameStore((state) => state.archiveStaleTodos)

  // 앱을 열 때, 그리고 오전 8시를 넘길 때
  // 1) 놓친 반복 과제를 한 번만 정산하고
  // 2) 하루가 지난 완료 할 일을 목록에서 내린다.
  useEffect(() => {
    const tick = () => {
      runSettlement()
      archiveStaleTodos()
    }
    tick()
    const timer = setInterval(tick, 60_000)
    return () => clearInterval(timer)
  }, [runSettlement, archiveStaleTodos])

  return (
    <HashRouter>
      <div className="flex h-full min-h-screen bg-abyss-950">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/study" element={<StudyPage />} />
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/character" element={<CharacterPage />} />
              <Route path="/dungeon" element={<DungeonPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/pets" element={<PetsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <FeedbackToasts />
        <EffectLayer />
      </div>
    </HashRouter>
  )
}
