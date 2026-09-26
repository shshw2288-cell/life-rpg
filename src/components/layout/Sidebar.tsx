import {
  BookOpen,
  ClipboardList,
  Dumbbell,
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
  { to: '/tasks', label: '과제 관리', short: '과제', icon: ClipboardList, end: false },
  { to: '/study', label: '공부', icon: BookOpen, end: false },
  { to: '/workout', label: '운동', icon: Dumbbell, end: false },
  { to: '/character', label: '캐릭터', icon: Sparkles, end: false },
  { to: '/dungeon', label: '탑', icon: Swords, end: false },
  { to: '/shop', label: '상점', icon: Store, end: false },
  { to: '/pets', label: '펫', icon: Egg, end: false },
  { to: '/history', label: '기록', icon: ScrollText, end: false },
  { to: '/settings', label: '설정', icon: Settings, end: false },
]

/** 넓은 화면용 왼쪽 메뉴 */
export function Sidebar() {
  return (
    <nav
      aria-label="주 메뉴"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-abyss-700 bg-abyss-900 p-3 md:flex"
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

/**
 * 좁은 화면용 하단 메뉴.
 * 화면 폭을 잡아먹지 않도록 아래에 고정하고 가로로 넘긴다.
 */
export function MobileNav() {
  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-abyss-700 bg-abyss-900/95 px-2 py-1.5 backdrop-blur md:hidden"
    >
      {NAV_ITEMS.map(({ to, label, short, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'flex min-w-14 shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] transition-colors',
              isActive ? 'bg-abyss-700 font-bold text-ember-400' : 'text-slate-400',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={18} aria-hidden />
              <span>{short ?? label}</span>
              {isActive && <span className="sr-only">(현재 위치)</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
