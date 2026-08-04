'use client'

import { useState, useMemo, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock, Plus, X, GripVertical, Trash2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { updateVisitDate, createScheduledVisit, deleteVisit } from '@/app/actions/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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

const VISIT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Clinic Visit':         { bg: 'bg-blue-500/20',   text: 'text-blue-600 dark:text-blue-300',   dot: 'bg-blue-500' },
  'Home Visit':           { bg: 'bg-rose-500/20',    text: 'text-rose-600 dark:text-rose-300',   dot: 'bg-rose-500' },
  'Online Consultation':  { bg: 'bg-purple-500/20',  text: 'text-purple-600 dark:text-purple-300', dot: 'bg-purple-500' },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function CalendarView({ visits, patients }: CalendarViewProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedVisit, setSelectedVisit] = useState<VisitItem | null>(null)
  const [filterType, setFilterType] = useState('All')
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')
  const [isPending, startTransition] = useTransition()
  
  // Optimistic visits for drag and drop responsiveness
  const [optimisticVisits, setOptimisticVisits] = useState<VisitItem[]>(visits)

  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null)
  const [visitType, setVisitType] = useState('Clinic Visit')
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date()
    d.setHours(10, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [duration, setDuration] = useState(30)
  const [treatmentGiven, setTreatmentGiven] = useState('')
  const [exerciseGiven, setExerciseGiven] = useState('')
  const [notes, setNotes] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useMemo(() => {
    setOptimisticVisits(visits)
  }, [visits])

  const filteredVisits = useMemo(() =>
    filterType === 'All'
      ? optimisticVisits
      : optimisticVisits.filter(v => v.type === filterType),
    [optimisticVisits, filterType]
  )

  const visitsByDay = useMemo(() => {
    const map: Record<string, VisitItem[]> = {}
    for (const v of filteredVisits) {
      const d = new Date(v.date)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(v)
    }
    return map
  }, [filteredVisits])

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay   = getFirstDayOfMonth(currentYear, currentMonth)
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  // upcoming visits for list view
  const upcomingVisits = useMemo(() =>
    [...filteredVisits]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [filteredVisits]
  )

  const colorFor = (type: string) =>
    VISIT_COLORS[type] ?? { bg: 'bg-gray-500/20', text: 'text-gray-300', dot: 'bg-gray-500' }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, visitId: string) => {
    e.dataTransfer.setData('text/plain', visitId)
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    const visitId = e.dataTransfer.getData('text/plain')
    if (!visitId) return

    const visit = optimisticVisits.find(v => v.id === visitId)
    if (!visit || isSameDay(new Date(visit.date), targetDate)) return

    // Optimistic Update
    const newDateStr = targetDate.toISOString()
    setOptimisticVisits(prev => prev.map(v => 
      v.id === visitId ? { ...v, date: newDateStr } : v
    ))
    
    toast.success('Visit rescheduled successfully!')

    // Server Action
    startTransition(async () => {
      const res = await updateVisitDate(visitId, newDateStr)
      if (res.error) {
        toast.error(res.error)
        setOptimisticVisits(visits) // Revert on error
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Filter patients list for autocomplete search
  const searchedPatients = useMemo(() => {
    if (!patientSearch) return []
    const term = patientSearch.toLowerCase()
    return patients.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.patientId.toLowerCase().includes(term)
    ).slice(0, 5)
  }, [patients, patientSearch])

  // Schedule Appointment Form Submit Handler
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) {
      toast.error('Please select a patient.')
      return
    }

    setIsSubmitting(true)
    const res = await createScheduledVisit({
      patientId: selectedPatient.id,
      date: visitDate,
      type: visitType,
      duration,
      treatmentGiven,
      exerciseGiven,
      notes
    })

    if (res.error) {
      toast.error(res.error)
      setIsSubmitting(false)
    } else if (res.success && res.visit) {
      toast.success('Appointment scheduled successfully!')
      setOptimisticVisits(prev => [...prev, res.visit as any])
      setIsSubmitting(false)
      setIsCreateOpen(false)
      
      // Reset State
      setSelectedPatient(null)
      setPatientSearch('')
      setVisitType('Clinic Visit')
      setTreatmentGiven('')
      setExerciseGiven('')
      setNotes('')
    }
  }

  // Cancel/Delete Appointment Handler
  const handleCancelAppointment = async (visitId: string) => {
    if (!confirm('Are you sure you want to cancel and delete this appointment?')) return
    
    setIsDeleting(true)
    const res = await deleteVisit(visitId)
    if (res.error) {
      toast.error(res.error)
      setIsDeleting(false)
    } else if (res.success) {
      toast.success('Appointment cancelled successfully.')
      setOptimisticVisits(prev => prev.filter(v => v.id !== visitId))
      setIsDeleting(false)
      setSelectedVisit(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduler &amp; Appointments</h1>
          <p className="text-muted-foreground">Add, track, and manage all patient treatment sessions effectively.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Schedule Appointment
        </Button>
      </div>

      {/* Filter + View Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Filter Type:</span>
          <div className="flex flex-wrap gap-2 text-xs">
            {['All', 'Clinic Visit', 'Home Visit', 'Online Consultation'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 text-xs">
          {(['month', 'week', 'list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all ${
                view === v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* Nav Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Month View */}
        {view === 'month' && (
          <div>
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum = i - firstDay + 1
                const isValid = dayNum >= 1 && dayNum <= daysInMonth
                const cellDate = new Date(currentYear, currentMonth, dayNum)
                const key = `${currentYear}-${currentMonth}-${dayNum}`
                const dayVisits = isValid ? (visitsByDay[key] ?? []) : []
                const isToday = isValid && isSameDay(cellDate, today)

                return (
                  <div
                    key={i}
                    onDragOver={handleDragOver}
                    onDrop={isValid ? (e) => handleDrop(e, cellDate) : undefined}
                    className={`min-h-[100px] p-1.5 border-b border-r last:border-r-0 transition-colors ${
                      !isValid ? 'bg-muted/20' : 'hover:bg-muted/30'
                    }`}
                  >
                    {isValid && (
                      <>
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                            isToday
                              ? 'bg-primary text-primary-foreground shadow'
                              : 'text-foreground'
                          }`}
                        >
                          {dayNum}
                        </span>
                        <div className="space-y-1">
                          {dayVisits.slice(0, 3).map(v => {
                            const c = colorFor(v.type)
                            return (
                              <button
                                key={v.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, v.id)}
                                onClick={() => setSelectedVisit(v)}
                                className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-semibold truncate leading-4 cursor-grab active:cursor-grabbing ${c.bg} ${c.text} hover:opacity-90 transition-opacity flex items-center justify-between border border-transparent hover:border-foreground/10`}
                              >
                                <span className="truncate">{v.patient.name}</span>
                                <GripVertical className="h-2.5 w-2.5 opacity-40 flex-shrink-0" />
                              </button>
                            )
                          })}
                          {dayVisits.length > 3 && (
                            <span className="text-[10px] text-muted-foreground pl-1 font-medium block">
                              +{dayVisits.length - 3} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {view === 'week' && (() => {
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay())
          const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek)
            d.setDate(startOfWeek.getDate() + i)
            return d
          })
          return (
            <div>
              <div className="grid grid-cols-7 border-b">
                {weekDays.map((d, i) => (
                  <div key={i} className={`py-3 text-center border-r last:border-r-0 ${isSameDay(d, today) ? 'bg-primary/10' : ''}`}>
                    <div className="text-xs text-muted-foreground">{DAYS[i]}</div>
                    <div className={`text-sm font-bold mt-0.5 mx-auto h-7 w-7 flex items-center justify-center rounded-full ${isSameDay(d, today) ? 'bg-primary text-primary-foreground' : ''}`}>
                      {d.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[300px]">
                {weekDays.map((d, i) => {
                  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
                  const dayVisits = visitsByDay[key] ?? []
                  return (
                    <div 
                      key={i} 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, d)}
                      className={`p-1.5 border-r last:border-r-0 min-h-[300px] space-y-1.5 ${isSameDay(d, today) ? 'bg-primary/5' : ''}`}
                    >
                      {dayVisits.map(v => {
                        const c = colorFor(v.type)
                        return (
                          <button
                            key={v.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, v.id)}
                            onClick={() => setSelectedVisit(v)}
                            className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-semibold leading-snug cursor-grab active:cursor-grabbing border ${c.bg} ${c.text} hover:opacity-90 transition-opacity relative group`}
                          >
                            <GripVertical className="absolute right-1 top-1 h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                            <div className="truncate pr-4 font-bold">{v.patient.name}</div>
                            <div className="opacity-85 font-medium">{new Date(v.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* List View */}
        {view === 'list' && (
          <div className="divide-y">
            {upcomingVisits.length === 0 && (
              <div className="py-16 text-center text-muted-foreground text-sm">No scheduled appointments found.</div>
            )}
            {upcomingVisits.map(v => {
              const c = colorFor(v.type)
              const d = new Date(v.date)
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVisit(v)}
                  className="w-full text-left px-6 py-4 hover:bg-muted/40 transition-colors flex items-center gap-4 border-b last:border-b-0"
                >
                  <div className="text-center min-w-[48px]">
                    <div className="text-xs text-muted-foreground">{MONTHS[d.getMonth()].slice(0,3)}</div>
                    <div className="text-xl font-bold leading-none">{d.getDate()}</div>
                    <div className="text-xs text-muted-foreground">{d.getFullYear()}</div>
                  </div>
                  <div className={`w-1.5 self-stretch rounded-full ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{v.patient.name}</div>
                    <div className="text-xs text-muted-foreground font-medium">{v.patient.patientId} · {v.type}</div>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block font-mono">
                    {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
        {Object.entries(VISIT_COLORS).map(([type, c]) => (
          <div key={type} className="flex items-center gap-1.5 font-medium">
            <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
            {type}
          </div>
        ))}
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedVisit(null)}
        >
          <div
            className="bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVisit(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-base">{selectedVisit.patient.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{selectedVisit.patient.patientId}</div>
              </div>
              <Badge variant="outline" className="ml-auto">{selectedVisit.type}</Badge>
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                {new Date(selectedVisit.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <User className="h-4 w-4 text-primary" />
                {selectedVisit.patient.phone}
              </div>
            </div>

            {selectedVisit.treatmentGiven && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Treatment Plan / Given</div>
                <p className="bg-muted rounded-lg p-3 text-sm font-medium">{selectedVisit.treatmentGiven}</p>
              </div>
            )}

            {selectedVisit.notes && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Physiotherapy Notes</div>
                <p className="bg-muted rounded-lg p-3 text-sm text-muted-foreground font-medium">{selectedVisit.notes}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 gap-2 border-t">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleCancelAppointment(selectedVisit.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {isDeleting ? 'Cancelling...' : 'Cancel Appointment'}
              </Button>
              <Link href={`/patients/${selectedVisit.patient.id}`}>
                <Button size="sm">Go to Patient Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 relative overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h2 className="text-xl font-bold">Schedule Appointment</h2>
              <p className="text-sm text-muted-foreground">Create a new treatment session for a patient.</p>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {/* Search Patient */}
              <div className="space-y-2 relative">
                <Label htmlFor="patientSearch">Search Patient *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="patientSearch"
                    placeholder="Type name or Patient ID..."
                    value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.patientId})` : patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value)
                      if (selectedPatient) setSelectedPatient(null)
                    }}
                    className="pl-9"
                    required
                  />
                  {selectedPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null)
                        setPatientSearch('')
                      }}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete list */}
                {searchedPatients.length > 0 && !selectedPatient && (
                  <div className="absolute z-10 w-full bg-popover border rounded-lg shadow-lg mt-1 overflow-hidden divide-y">
                    {searchedPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p)
                          setPatientSearch(`${p.name} (${p.patientId})`)
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center justify-between"
                      >
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{p.patientId}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visitDate">Date &amp; Time *</Label>
                  <Input
                    id="visitDate"
                    type="datetime-local"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitType">Visit Type *</Label>
                  <select
                    id="visitType"
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="Clinic Visit">Clinic Visit</option>
                    <option value="Home Visit">Home Visit</option>
                    <option value="Online Consultation">Online Consultation</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min="5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">Planned Treatment Program</Label>
                <Textarea
                  id="treatment"
                  placeholder="e.g. Cervical Traction, IFT, Stretching exercises"
                  value={treatmentGiven}
                  onChange={(e) => setTreatmentGiven(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercises">Exercises</Label>
                <Textarea
                  id="exercises"
                  placeholder="e.g. Home exercise plan, Isometric neck exercises"
                  value={exerciseGiven}
                  onChange={(e) => setExerciseGiven(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Physiotherapist Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any general observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
