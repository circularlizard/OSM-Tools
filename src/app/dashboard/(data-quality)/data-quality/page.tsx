import Link from 'next/link'
import { Users, AlertTriangle, Shield, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DataQualityDashboard() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-lg bg-primary text-primary-foreground px-4 py-3">
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="data-quality-title">
          OSM Data Quality
        </h1>
        <p className="mt-1 text-sm md:text-base opacity-90">
          Identify and resolve data quality issues across your sections
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
            <CardDescription>
              View member information and loading status for the selected section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/data-quality/members">
              <Button className="w-full">View Members</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Member Data Issues
            </CardTitle>
            <CardDescription>
              Review and address data quality issues for members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/data-quality/members/issues">
              <Button className="w-full">View Issues</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              Patrol Readiness
            </CardTitle>
            <CardDescription>
              Track patrol readiness and training status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-5 w-5" />
              Badge Adapters
            </CardTitle>
            <CardDescription>
              Configure badge ID mappings for training data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-muted-foreground/20">
        <CardHeader>
          <CardTitle className="text-sm">About Data Quality</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Multi-Section Access:</strong> Use the section selector to switch between
            sections you have permission to access. Each section&apos;s data is loaded independently.
          </p>
          <p>
            <strong>Data Loading:</strong> Member data is loaded progressively. Use the
            &quot;Load data&quot; button on the Issues page to fetch detailed contact and medical
            information for all members.
          </p>
          <p>
            <strong>Exports:</strong> All data views support export to spreadsheet (XLSX) and
            PDF formats via the export dropdown in each view&apos;s header.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
