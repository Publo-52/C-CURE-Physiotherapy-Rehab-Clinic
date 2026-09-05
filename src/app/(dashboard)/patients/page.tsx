export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PatientsTable } from "./patients-table"

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
          totalBill: true,
          amountPaidToday: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const patients = patientsRaw.map(p => {
    const totalBilled = p.payments.reduce((s, x) => s + x.totalBill, 0)
    const totalPaid = p.payments.reduce((s, x) => s + x.amountPaidToday, 0)
    const totalDue = Math.max(0, totalBilled - totalPaid)
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
      totalDue,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">Manage your patients and their treatment records.</p>
        </div>
        <Link href="/patients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Patient
          </Button>
        </Link>
      </div>

      <PatientsTable initialPatients={patients} />
    </div>
  )
}

