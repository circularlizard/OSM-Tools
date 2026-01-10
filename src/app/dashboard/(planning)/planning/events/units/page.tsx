'use client'

import { AttendanceOverview } from '@/components/domain/consolidated-attendance/AttendanceOverview'

const buildPlannerUnitHref = (unitId: string) =>
  `/dashboard/planning/events/units/${encodeURIComponent(unitId)}`

export default function PlannerUnitOverviewPage() {
  return <AttendanceOverview buildUnitHref={buildPlannerUnitHref} />
}
