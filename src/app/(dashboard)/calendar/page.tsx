export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import CalendarView from "./calendar-view"

export default async function CalendarPage() {
  let visits: any[] = []
  let events: any[] = []
  let patients: any[] = []

  try {
    const [fetchedVisits, fetchedEvents, fetchedPatients] = await Promise.all([
      prisma.visit.findMany({
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
      }),
      prisma.event.findMany({
        orderBy: { date: 'asc' }
      }),
      prisma.patient.findMany({
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
    ])
    
    visits = fetchedVisits
    events = fetchedEvents
    patients = fetchedPatients
  } catch (error) {
    console.error('Calendar: Failed to load data:', error)
  }

  return <CalendarView visits={visits} events={events} patients={patients} />
}
