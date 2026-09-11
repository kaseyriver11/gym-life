import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { DailyPage } from '@/features/daily/DailyPage'
import { HealthPage } from '@/features/health/HealthPage'
import { LongTermPage } from '@/features/longterm/LongTermPage'
import { WorkoutsPage } from '@/features/workouts/WorkoutsPage'

function Gate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-950">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<AppShell title="Gym-Life" />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/today" element={<DailyPage />} />
        <Route path="/list" element={<LongTermPage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/health" element={<HealthPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </HashRouter>
  )
}

export default App
