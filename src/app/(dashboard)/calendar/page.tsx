export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import CalendarView from "./calendar-view"

export default async function CalendarPage() {
  const visits = await prisma.visit.findMany({
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          patientId: true,
          phone: true,
        }
      }
    },
    orderBy: { date: 'asc' }
  })

  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      name: true,
      patientId: true,
    },
    take: 50
  })

  return <CalendarView visits={visits} patients={patients} />
}

