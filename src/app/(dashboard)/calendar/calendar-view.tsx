'use client'

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, User, Clock, MapPin, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface VisitItem {
  id: string
  visitNumber: number
  date: string | Date
  type: string
  treatmentGiven?: string | null
  notes?: string | null
  patient: {
    id: string
    name: string
    patientId: string
    phone: string
  }
}

interface PatientItem {
  id: string
  name: string
  patientId: string
}

interface CalendarViewProps {
  visits: VisitItem[]
  patients: PatientItem[]
}

export default function CalendarView({ visits, patients }: CalendarViewProps) {
  const [selectedVisit, setSelectedVisit] = useState<VisitItem | null>(null)
  const [filterType, setFilterType] = useState('All')

  const filteredVisits = filterType === 'All' 
    ? visits 
    : visits.filter(v => v.type.toLowerCase() === filterType.toLowerCase())

  const events = filteredVisits.map((v) => ({
    id: v.id,
    title: `${v.patient.name} (${v.type})`,
    start: new Date(v.date),
    extendedProps: {
      visit: v,
    },
    backgroundColor: v.type === 'Home Visit' ? '#e11d48' : v.type === 'Online Consultation' ? '#8b5cf6' : '#2563eb',
    borderColor: 'transparent',
  }))

  const handleEventClick = (info: any) => {
    const visit = info.event.extendedProps.visit
    if (visit) {
      setSelectedVisit(visit)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar & Appointments</h1>
          <p className="text-muted-foreground">Schedule and manage patient treatment visits.</p>
        </div>
        <div className="flex gap-2">
          {patients.length > 0 && (
            <Link href={`/patients/${patients[0].id}/visits/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Record Visit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Filter Visit Type:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {['All', 'Clinic Visit', 'Home Visit', 'Online Consultation'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterType === type 
                  ? 'bg-primary text-primary-foreground shadow-xs' 
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <Card className="shadow-sm border">
        <CardContent className="p-4 sm:p-6">
          <div className="full-calendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin as any, timeGridPlugin as any, interactionPlugin as any]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              aspectRatio={1.6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Event Details Modal */}
      {selectedVisit && (
        <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {selectedVisit.patient.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground font-mono">{selectedVisit.patient.patientId}</span>
                <Badge variant="outline">{selectedVisit.type}</Badge>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {new Date(selectedVisit.date).toLocaleString()}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 text-primary" />
                  Phone: {selectedVisit.patient.phone}
                </p>
              </div>
              {selectedVisit.treatmentGiven && (
                <div>
                  <span className="font-semibold block text-xs text-muted-foreground uppercase tracking-wider mb-1">Treatment</span>
                  <p className="bg-muted p-2.5 rounded-md">{selectedVisit.treatmentGiven}</p>
                </div>
              )}
              {selectedVisit.notes && (
                <div>
                  <span className="font-semibold block text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes</span>
                  <p className="bg-muted p-2.5 rounded-md text-muted-foreground">{selectedVisit.notes}</p>
                </div>
              )}
              <div className="pt-2 flex justify-end">
                <Link href={`/patients/${selectedVisit.patient.id}`}>
                  <Button size="sm">Go to Patient Profile</Button>
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
