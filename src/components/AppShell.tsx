import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { Capacitor } from '@capacitor/core'
import { signOut } from 'firebase/auth'
import { LogOut } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { TabBar } from '@/components/TabBar'
import { auth } from '@/lib/firebase'

async function handleSignOut() {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.signOut()
  }
  await signOut(auth)
}

export function AppShell({ title }: { title: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950 text-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-800 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <h1 className="text-lg font-semibold">{title}</h1>
        <button
          onClick={handleSignOut}
          className="text-neutral-500 hover:text-neutral-300"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
