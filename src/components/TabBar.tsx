import clsx from 'clsx'
import { CalendarCheck, Dumbbell, HeartPulse, LayoutGrid, ListTodo } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home', icon: LayoutGrid, end: true },
  { to: '/today', label: 'Today', icon: CalendarCheck, end: false },
  { to: '/list', label: 'List', icon: ListTodo, end: false },
  { to: '/workouts', label: 'Gym', icon: Dumbbell, end: false },
  { to: '/health', label: 'Health', icon: HeartPulse, end: false },
]

export function TabBar() {
  return (
    <nav className="sticky bottom-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
      <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]',
                isActive ? 'text-indigo-400' : 'text-neutral-500',
              )
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
