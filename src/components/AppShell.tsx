import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { Capacitor } from '@capacitor/core'
import { format } from 'date-fns'
import { signOut } from 'firebase/auth'
import { LogOut } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { TabBar } from '@/components/TabBar'
import { sessionSetProgress, useWorkoutSessions } from '@/features/workouts/use-workout-sessions'
import { auth } from '@/lib/firebase'

async function handleSignOut() {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.signOut()
  }
  await signOut(auth)
}

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Today's set-completion progress, visible from anywhere in the app (not
 * just the dashboard) so you can glance at where you stand mid-workout
 * without navigating back. Only shows once there's something to show
 * progress on — an empty or fully-finished session renders nothing. */
function HeaderWorkoutProgress() {
  const { items: sessions } = useWorkoutSessions()
  const session = sessions.find((s) => s.date === todayISO())
  if (!session || session.entries.length === 0) return null

  const { totalSets, loggedSets } = sessionSetProgress(session)
  if (totalSets === 0 || loggedSets === totalSets) return null
  const pct = Math.round((loggedSets / totalSets) * 100)

  return (
    <Link to="/workouts" className="flex items-center gap-2">
      <span className="text-xs font-medium text-neutral-400">
        {loggedSets}/{totalSets} sets
      </span>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-neutral-800">
        <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </span>
    </Link>
  )
}

export function AppShell({ title }: { title: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950 text-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-3">
          <HeaderWorkoutProgress />
          <button
            onClick={handleSignOut}
            className="text-neutral-500 hover:text-neutral-300"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
