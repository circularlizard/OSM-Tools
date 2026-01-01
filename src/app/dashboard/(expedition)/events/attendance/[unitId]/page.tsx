'use client'

import { UnitAttendanceDetail } from '@/components/domain/consolidated-attendance/UnitAttendanceDetail'

interface UnitDetailPageProps {
  params: { unitId: string }
}

export default function UnitDetailPage({ params }: UnitDetailPageProps) {
  const unitId = decodeURIComponent(params.unitId)
  return (
    <UnitAttendanceDetail
      unitId={unitId}
      overviewHref="/dashboard/events/attendance"
      eventDetailBaseHref="/dashboard/events"
    />
  )
}
