import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import EditPatientForm from "./edit-form"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPatientPage({ params }: Props) {
  const { id } = await params
  
  const patient = await prisma.patient.findUnique({
    where: { id }
  })

  if (!patient) return notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit Patient - {patient.name}</h1>
      <EditPatientForm patient={patient} />
    </div>
  )
}
