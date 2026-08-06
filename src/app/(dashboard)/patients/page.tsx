export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PatientsTable } from "./patients-table"

export default async function PatientsPage() {
  const patients = await prisma.patient.findMany({
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
    },
    orderBy: { createdAt: 'desc' }
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

