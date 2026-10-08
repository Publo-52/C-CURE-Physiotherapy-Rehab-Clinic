export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserPlus, Users } from "lucide-react"
import { PatientsTable } from "./patients-table"
import { calculatePatientBilling } from "@/lib/billing"

export default async function PatientsPage() {
  const patientsRaw = await prisma.patient.findMany({
    select: {
      id: true,
      patientId: true,
      name: true,
      phone: true,
      disease: true,
      status: true,
      presentStatus: true,
      visitDoneToday: true,
      registrationDate: true,
      perVisitFee: true,
      payments: {
        select: {
          id: true,
          invoiceNumber: true,
          totalBill: true,
          amountPaidToday: true,
          status: true,
          paymentNotes: true,
          visitId: true,
          paymentDate: true,
          visit: { select: { id: true, status: true } },
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const patients = patientsRaw.map(p => {
    const { totalBilled, totalPaid, remainingDue } = calculatePatientBilling(p.payments)
    return {
      id: p.id,
      patientId: p.patientId,
      name: p.name,
      phone: p.phone,
      disease: p.disease,
      status: p.status,
      presentStatus: p.presentStatus,
      visitDoneToday: p.visitDoneToday,
      registrationDate: p.registrationDate,
      perVisitFee: p.perVisitFee || 0,
      totalBilled,
      totalPaid,
      totalDue: remainingDue,
    }
  })

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">
              Patient Directory
            </h1>
            <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full tabular-num">
              {patients.length} Total
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 font-medium flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            Manage clinical profiles, treatment histories, and daily attendance records.
          </p>
        </div>
        <Link href="/patients/new">
          <Button size="sm" className="shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all rounded-xl font-bold active-press">
            <UserPlus className="mr-1.5 h-4 w-4" /> Add Patient
          </Button>
        </Link>
      </div>

      <PatientsTable initialPatients={patients} />
    </div>
  )
}
