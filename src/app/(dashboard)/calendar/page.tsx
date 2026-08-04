export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import CalendarView from "./calendar-view"

export default async function CalendarPage() {
  let visits: any[] = []
  let patients: any[] = []

  try {
    visits = await prisma.visit.findMany({
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
  } catch (error) {
    console.error('Calendar: Failed to load visits:', error)
    visits = []
  }

  try {
    patients = await prisma.patient.findMany({
      where: {
        status: 'Active'
      },
      select: {
        id: true,
        name: true,
        patientId: true,
      },
      orderBy: {
        name: 'asc'
      },
      take: 1000
    })
  } catch (error) {
    console.error('Calendar: Failed to load patients:', error)
    patients = []
  }

  return <CalendarView visits={visits} patients={patients} />
}
