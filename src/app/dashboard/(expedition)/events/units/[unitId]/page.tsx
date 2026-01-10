'use client'

import { use } from 'react'
import { UnitAttendanceDetail } from '@/components/domain/consolidated-attendance/UnitAttendanceDetail'

interface UnitDetailPageProps {
  params: Promise<{ unitId: string }>
}

export default function UnitDetailPage({ params }: UnitDetailPageProps) {
  const resolvedParams = use(params)
  const unitId = decodeURIComponent(resolvedParams.unitId)
  return (
    <UnitAttendanceDetail
      unitId={unitId}
      overviewHref="/dashboard/events/units"
      eventDetailBaseHref="/dashboard/events"
    />
  )
}
