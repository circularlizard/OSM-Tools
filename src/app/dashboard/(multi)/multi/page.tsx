import Link from 'next/link'
import { Users, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function MultiSectionDashboard() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-lg bg-primary text-primary-foreground px-4 py-3">
        <h1 className="text-2xl md:text-3xl font-bold">Multi-Section Viewer</h1>
        <p className="mt-1 text-sm md:text-base opacity-90">
          View events, members, and attendance across multiple sections
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Preview Feature</AlertTitle>
        <AlertDescription>
          The Multi-Section Viewer reuses Expedition Viewer components while keeping the section
          selector enabled. A dedicated <code>osm-multisection</code> provider and generalized hydrator
          pipeline are planned (see docs/future/platform-strategy-analysis.md §6).
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Events
            </CardTitle>
            <CardDescription>
              View events and attendance across your accessible sections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/events">
              <Button className="w-full">Go to Events</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
            <CardDescription>
              View member information across your accessible sections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/members">
              <Button className="w-full">Go to Members</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="text-sm">Technical Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Access Control:</strong> OSM scopes continue to enforce which sections you can access.
            The dashboard surfaces data only for sections you are permitted to view.
          </p>
          <p>
            <strong>Section Selector:</strong> Unlike SEEE-specific apps, the Multi-Section Viewer keeps the
            selector visible so you can switch across sections or view multiple sections simultaneously.
          </p>
          <p>
            <strong>Future Enhancements:</strong> A dedicated multi-section provider and generalized hydration
            strategy will ship in a future release. Until then, the viewer provides a lightweight preview
            experience that relies on the existing Expedition Viewer infrastructure.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
