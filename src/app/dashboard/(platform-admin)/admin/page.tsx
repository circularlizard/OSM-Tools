import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { getAuthConfig } from '@/lib/auth'
import { PatrolManagement } from './PatrolManagement'
import { PlatformCacheStatusPanel } from './PlatformCacheStatusPanel'
import { SEEESectionConfig } from './SEEESectionConfig'
import { DeveloperTools } from './DeveloperTools'
import { AuditLog } from './AuditLog'

export default async function AdminPage() {
  const authOptions = await getAuthConfig()
  const session = await getServerSession(authOptions)
  // roleSelection is added to session by our JWT callback
  const role = (session as { roleSelection?: string } | null)?.roleSelection

  if (role !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Forbidden</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to access Platform Admin Console.
        </p>
        <div className="mt-4">
          <Link href="/dashboard" className="underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-lg bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold flex items-center gap-2"
            data-testid="admin-title"
          >
            <Settings className="h-6 w-6" aria-hidden />
            <span>Platform Admin Console</span>
          </h1>
          <p className="mt-1 text-sm md:text-base opacity-90">
            Manage platform configuration, caches, and developer tools
          </p>
        </div>
      </div>
      
      <PlatformCacheStatusPanel />
      <SEEESectionConfig />
      <PatrolManagement />
      <DeveloperTools />
      <AuditLog />
    </div>
  )
}