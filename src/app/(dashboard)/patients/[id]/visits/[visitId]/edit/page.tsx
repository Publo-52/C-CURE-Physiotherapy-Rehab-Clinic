export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditVisitForm } from './edit-visit-form'

interface Props {
  params: Promise<{ id: string; visitId: string }>
}

export default async function EditVisitPage({ params }: Props) {
  const { id, visitId } = await params

  const [patient, visit] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      select: { id: true, name: true, patientId: true }
    }),
    prisma.visit.findUnique({
      where: { id: visitId }
    })
  ])

  if (!patient || !visit || visit.patientId !== id) {
    return notFound()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <EditVisitForm patient={patient} visit={visit} />
    </div>
  )
}
