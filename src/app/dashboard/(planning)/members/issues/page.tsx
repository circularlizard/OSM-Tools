import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { getAuthConfig } from '@/lib/auth'
import { MemberIssuesClient } from './MemberIssuesClient'

export default async function MemberIssuesPage() {
  const authOptions = await getAuthConfig()
  const session = await getServerSession(authOptions)
  const role = (session as { roleSelection?: string } | null)?.roleSelection

  if (role !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Forbidden</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to access Member Data Issues.
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
      <MemberIssuesClient />
    </div>
  )
}
