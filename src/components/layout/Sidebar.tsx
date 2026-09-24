import {
  BookOpen,
  ClipboardList,
  Egg,
  LayoutDashboard,
  ScrollText,
  Settings,
  Sparkles,
  Store,
  Swords,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '대시보드', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: '과제 관리', icon: ClipboardList, end: false },
  { to: '/study', label: '공부', icon: BookOpen, end: false },
  { to: '/character', label: '캐릭터', icon: Sparkles, end: false },
  { to: '/dungeon', label: '탑', icon: Swords, end: false },
  { to: '/shop', label: '상점', icon: Store, end: false },
  { to: '/pets', label: '펫', icon: Egg, end: false },
  { to: '/history', label: '기록', icon: ScrollText, end: false },
  { to: '/settings', label: '설정', icon: Settings, end: false },
]

export function Sidebar() {
  return (
    <nav
      aria-label="주 메뉴"
      className="flex w-56 shrink-0 flex-col gap-1 border-r border-abyss-700 bg-abyss-900 p-3"
    >
      <div className="mb-4 px-2 pt-2">
        <p className="text-lg font-bold tracking-tight text-ember-400">LIFE RPG</p>
        <p className="text-xs text-slate-400">현실을 퀘스트로</p>
      </div>

      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-abyss-700 font-semibold text-ember-400'
                : 'text-slate-300 hover:bg-abyss-800 hover:text-slate-100',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={18} aria-hidden />
              <span>{label}</span>
              {isActive && <span className="sr-only">(현재 위치)</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
