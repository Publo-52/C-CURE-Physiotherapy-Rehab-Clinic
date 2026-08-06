export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { EditPaymentForm } from './edit-payment-form'

interface Props {
  params: Promise<{ id: string; paymentId: string }>
}

export default async function EditPaymentPage({ params }: Props) {
  const { id, paymentId } = await params

  const [patient, payment] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      select: { id: true, name: true, patientId: true }
    }),
    prisma.payment.findUnique({
      where: { id: paymentId }
    })
  ])

  if (!patient || !payment || payment.patientId !== id) {
    return notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <EditPaymentForm patient={patient} payment={payment} />
    </div>
  )
}
