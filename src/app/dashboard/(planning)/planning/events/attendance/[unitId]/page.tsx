'use client'

import { use } from 'react'
import { UnitAttendanceDetail } from '@/components/domain/consolidated-attendance/UnitAttendanceDetail'

interface PlannerUnitAttendancePageProps {
  params: Promise<{ unitId: string }>
}

export default function PlannerUnitAttendancePage({ params }: PlannerUnitAttendancePageProps) {
  const resolvedParams = use(params)
  const unitId = decodeURIComponent(resolvedParams.unitId)
  return (
    <UnitAttendanceDetail
      unitId={unitId}
      overviewHref="/dashboard/planning/events/attendance"
      eventDetailBaseHref="/dashboard/planning/events"
    />
  )
}
