'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock, Plus, X, GripVertical, Trash2, Search, Video, Home, Building, FileText, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { updateVisitDate, createScheduledVisit, deleteVisit, createEvent, deleteEvent } from '@/app/actions/calendar'
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

interface EventItem {
  id: string
  title: string
  description?: string | null
  date: string | Date
  type: string // 'Meeting' | 'Task' | 'Reminder' | 'Other'
  duration: number
}

interface PatientItem {
  id: string
  name: string
  patientId: string
}

interface CalendarViewProps {
  visits: VisitItem[]
  events: EventItem[]
  patients: PatientItem[]
}

// Custom Premium Styling Palette
const ITEM_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; icon: any }> = {
  'Clinic Visit':         { bg: 'bg-blue-50 dark:bg-blue-950/40',   text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-900',   dot: 'bg-blue-500', icon: Building },
  'Home Visit':           { bg: 'bg-rose-50 dark:bg-rose-950/40',    text: 'text-rose-700 dark:text-rose-300',   border: 'border-rose-200 dark:border-rose-900',   dot: 'bg-rose-500', icon: Home },
  'Online Consultation':  { bg: 'bg-purple-50 dark:bg-purple-950/40',  text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-900', dot: 'bg-purple-500', icon: Video },
  'Meeting':              { bg: 'bg-emerald-50 dark:bg-emerald-950/40',text: 'text-emerald-700 dark:text-emerald-300',border: 'border-emerald-200 dark:border-emerald-900',dot: 'bg-emerald-500', icon: User },
  'Task':                 { bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-200 dark:border-amber-900',  dot: 'bg-amber-500', icon: CheckCircle2 },
  'Reminder':             { bg: 'bg-indigo-50 dark:bg-indigo-950/40',text: 'text-indigo-700 dark:text-indigo-300',border: 'border-indigo-200 dark:border-indigo-900',dot: 'bg-indigo-500', icon: Clock },
  'Other':                { bg: 'bg-slate-50 dark:bg-slate-950/40',  text: 'text-slate-700 dark:text-slate-300',  border: 'border-slate-200 dark:border-slate-900',  dot: 'bg-slate-500', icon: FileText },
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

export default function CalendarView({ visits, events, patients }: CalendarViewProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  
  // Selected Detail Modal state
  const [selectedDetail, setSelectedDetail] = useState<{ type: 'visit' | 'event'; data: any } | null>(null)
  
  const [filterType, setFilterType] = useState('All')
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')
  const [isPending, startTransition] = useTransition()
  
  // States for dynamic rendering
  const [optimisticVisits, setOptimisticVisits] = useState<VisitItem[]>(visits)
  const [optimisticEvents, setOptimisticEvents] = useState<EventItem[]>(events)

  // Modals / Schedule Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [scheduleMode, setScheduleMode] = useState<'visit' | 'event'>('visit')
  
  // Visit scheduling states
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

  // Event scheduling states
  const [eventTitle, setEventTitle] = useState('')
  const [eventType, setEventType] = useState('Meeting')
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date()
    d.setHours(11, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [eventDuration, setEventDuration] = useState(30)
  const [eventDescription, setEventDescription] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    setOptimisticVisits(visits)
    setOptimisticEvents(events)
  }, [visits, events])

  // Combine and unify visits + events for rendering
  const unifiedItems = useMemo(() => {
    const list: Array<{ id: string; date: Date; type: string; title: string; subtitle?: string; colorKey: string; itemType: 'visit' | 'event'; original: any }> = []
    
    for (const v of optimisticVisits) {
      list.push({
        id: v.id,
        date: new Date(v.date),
        type: v.type,
        title: v.patient.name,
        subtitle: v.patient.patientId,
        colorKey: v.type,
        itemType: 'visit',
        original: v
      })
    }

    for (const e of optimisticEvents) {
      list.push({
        id: e.id,
        date: new Date(e.date),
        type: e.type,
        title: e.title,
        subtitle: e.type,
        colorKey: e.type,
        itemType: 'event',
        original: e
      })
    }

    return list
  }, [optimisticVisits, optimisticEvents])

  const filteredItems = useMemo(() => {
    if (filterType === 'All') return unifiedItems
    if (filterType === 'Visits') return unifiedItems.filter(i => i.itemType === 'visit')
    if (filterType === 'Events/Meetings') return unifiedItems.filter(i => i.itemType === 'event')
    return unifiedItems.filter(i => i.type === filterType)
  }, [unifiedItems, filterType])

  const itemsByDay = useMemo(() => {
    const map: Record<string, typeof filteredItems> = {}
    for (const item of filteredItems) {
      const d = item.date
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [filteredItems])

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

  const upcomingItems = useMemo(() =>
    [...filteredItems].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [filteredItems]
  )

  const styleFor = (key: string) =>
    ITEM_STYLES[key] ?? { bg: 'bg-slate-50 dark:bg-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800', dot: 'bg-slate-500', icon: FileText }

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId)
  }

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain')
    if (!itemId) return

    const item = unifiedItems.find(i => i.id === itemId)
    if (!item || isSameDay(item.date, targetDate)) return

    const newDateStr = targetDate.toISOString()

    // Optimistic Update
    if (item.itemType === 'visit') {
      setOptimisticVisits(prev => prev.map(v => 
        v.id === itemId ? { ...v, date: newDateStr } : v
      ))
    } else {
      setOptimisticEvents(prev => prev.map(ev => 
        ev.id === itemId ? { ...ev, date: newDateStr } : ev
      ))
    }
    
    toast.success('Rescheduled successfully!')

    // Server Action
    startTransition(async () => {
      const res = await updateVisitDate(itemId, newDateStr)
      if (res.error) {
        toast.error(res.error)
        setOptimisticVisits(visits) // Revert on error
        setOptimisticEvents(events)
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const searchedPatients = useMemo(() => {
    if (!patientSearch) return []
    const term = patientSearch.toLowerCase()
    return patients.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.patientId.toLowerCase().includes(term)
    ).slice(0, 5)
  }, [patients, patientSearch])

  // Submit Handler for custom scheduling
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (scheduleMode === 'visit') {
      if (!selectedPatient) {
        toast.error('Please select a patient.')
        setIsSubmitting(false)
        return
      }

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
      } else if (res.success && res.visit) {
        toast.success('Appointment scheduled successfully!')
        setOptimisticVisits(prev => [...prev, res.visit as any])
        setIsCreateOpen(false)
        // Reset state
        setSelectedPatient(null)
        setPatientSearch('')
        setVisitType('Clinic Visit')
        setTreatmentGiven('')
        setExerciseGiven('')
        setNotes('')
      }
    } else {
      if (!eventTitle) {
        toast.error('Title is required.')
        setIsSubmitting(false)
        return
      }

      const res = await createEvent({
        title: eventTitle,
        date: eventDate,
        type: eventType,
        duration: eventDuration,
        description: eventDescription
      })

      if (res.error) {
        toast.error(res.error)
      } else if (res.success && res.event) {
        toast.success('Event added successfully!')
        setOptimisticEvents(prev => [...prev, res.event as any])
        setIsCreateOpen(false)
        // Reset state
        setEventTitle('')
        setEventType('Meeting')
        setEventDescription('')
      }
    }

    setIsSubmitting(false)
  }

  // Deletion logic
  const handleDeleteItem = async () => {
    if (!selectedDetail) return
    const { type, data } = selectedDetail
    
    if (!confirm(`Are you sure you want to delete this ${type === 'visit' ? 'appointment' : 'event'}?`)) return
    
    setIsDeleting(true)
    let res
    if (type === 'visit') {
      res = await deleteVisit(data.id)
    } else {
      res = await deleteEvent(data.id)
    }

    if (res.error) {
      toast.error(res.error)
      setIsDeleting(false)
    } else if (res.success) {
      toast.success(`${type === 'visit' ? 'Appointment' : 'Event'} deleted successfully.`)
      if (type === 'visit') {
        setOptimisticVisits(prev => prev.filter(v => v.id !== data.id))
      } else {
        setOptimisticEvents(prev => prev.filter(ev => ev.id !== data.id))
      }
      setIsDeleting(false)
      setSelectedDetail(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Clinic Scheduler</h1>
          <p className="text-muted-foreground text-sm">Add and organize treatment sessions, staff meetings, and professional reminders effectively.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-lg hover:shadow-primary/20 transition-all font-semibold">
          <Plus className="mr-2 h-4 w-4" /> Add to Schedule
        </Button>
      </div>

      {/* Filter / Category Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-3.5 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">View Filter:</span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {['All', 'Visits', 'Events/Meetings', 'Clinic Visit', 'Home Visit', 'Meeting', 'Task', 'Reminder'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl text-xs">
          {(['month', 'week', 'list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg font-bold capitalize transition-all ${
                view === v
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Shell */}
      <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b bg-muted/10">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-muted transition-colors border shadow-sm bg-background"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-xl font-extrabold tracking-tight">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-muted transition-colors border shadow-sm bg-background"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Month View Grid */}
        {view === 'month' && (
          <div>
            <div className="grid grid-cols-7 border-b bg-muted/5 font-semibold text-xs tracking-wider uppercase text-muted-foreground">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center border-r last:border-r-0">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-collapse">
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum = i - firstDay + 1
                const isValid = dayNum >= 1 && dayNum <= daysInMonth
                const cellDate = new Date(currentYear, currentMonth, dayNum)
                const key = `${currentYear}-${currentMonth}-${dayNum}`
                const dayItems = isValid ? (itemsByDay[key] ?? []) : []
                const isToday = isValid && isSameDay(cellDate, today)

                return (
                  <div
                    key={i}
                    onDragOver={handleDragOver}
                    onDrop={isValid ? (e) => handleDrop(e, cellDate) : undefined}
                    className={`min-h-[110px] p-2 border-b border-r last:border-r-0 transition-all ${
                      !isValid ? 'bg-muted/15' : 'hover:bg-muted/20 bg-background'
                    }`}
                  >
                    {isValid && (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              isToday
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'text-muted-foreground/80'
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {dayItems.slice(0, 3).map(item => {
                            const st = styleFor(item.colorKey)
                            const IconComponent = st.icon
                            return (
                              <button
                                key={item.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onClick={() => setSelectedDetail({ type: item.itemType, data: item.original })}
                                className={`w-full text-left px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold truncate cursor-grab active:cursor-grabbing border ${st.bg} ${st.text} ${st.border} hover:scale-[1.01] transition-all flex items-center justify-center sm:justify-between gap-1 shadow-sm`}
                              >
                                <span className={`sm:hidden block h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                <span className="hidden sm:inline-flex items-center gap-1.5 w-full min-w-0">
                                  <IconComponent className="h-3 w-3 flex-shrink-0 opacity-80" />
                                  <span className="truncate flex-1">{item.title}</span>
                                  <GripVertical className="h-3 w-3 opacity-30 flex-shrink-0" />
                                </span>
                              </button>
                            )
                          })}
                          {dayItems.length > 3 && (
                            <span className="text-[9px] text-primary/80 font-bold pl-1.5">
                              +{dayItems.length - 3} more items
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

        {/* Week View Layout */}
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
              <div className="grid grid-cols-7 border-b bg-muted/5">
                {weekDays.map((d, i) => (
                  <div key={i} className={`py-3.5 text-center border-r last:border-r-0 ${isSameDay(d, today) ? 'bg-primary/5' : ''}`}>
                    <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{DAYS[i]}</div>
                    <div className={`text-base font-black mt-1 mx-auto h-8 w-8 flex items-center justify-center rounded-full ${isSameDay(d, today) ? 'bg-primary text-primary-foreground shadow-md' : ''}`}>
                      {d.getDate()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[420px] bg-background">
                {weekDays.map((d, i) => {
                  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
                  const dayItems = itemsByDay[key] ?? []
                  return (
                    <div 
                      key={i} 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, d)}
                      className={`p-2 border-r last:border-r-0 min-h-[420px] space-y-2 ${isSameDay(d, today) ? 'bg-primary/5' : ''}`}
                    >
                      {dayItems.map(item => {
                        const st = styleFor(item.colorKey)
                        const IconComponent = st.icon
                        return (
                          <button
                            key={item.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={() => setSelectedDetail({ type: item.itemType, data: item.original })}
                            className={`w-full text-left p-2 rounded-xl text-[10px] font-bold leading-snug cursor-grab active:cursor-grabbing border ${st.bg} ${st.text} ${st.border} hover:shadow transition-all relative group flex flex-col gap-1`}
                          >
                            <GripVertical className="absolute right-2 top-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                            <div className="flex items-center gap-1 font-black truncate pr-4">
                              <IconComponent className="h-3 w-3 opacity-70" />
                              <span className="truncate">{item.title}</span>
                            </div>
                            <div className="opacity-80 text-[9px] font-medium">
                              {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
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

        {/* List View Design */}
        {view === 'list' && (
          <div className="divide-y bg-background">
            {upcomingItems.length === 0 && (
              <div className="py-20 text-center text-muted-foreground text-sm">No upcoming appointments or meetings scheduled.</div>
            )}
            {upcomingItems.map(item => {
              const st = styleFor(item.colorKey)
              const IconComponent = st.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedDetail({ type: item.itemType, data: item.original })}
                  className="w-full text-left px-6 py-4.5 hover:bg-muted/30 transition-all flex items-center gap-5 border-b last:border-b-0"
                >
                  <div className="text-center min-w-[55px] border rounded-xl py-1.5 px-2 bg-muted/10 shadow-sm font-sans">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">{MONTHS[item.date.getMonth()].slice(0,3)}</div>
                    <div className="text-xl font-extrabold leading-none text-foreground">{item.date.getDate()}</div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{item.date.getFullYear()}</div>
                  </div>
                  <div className={`w-1.5 self-stretch rounded-full ${st.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground truncate">{item.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${st.bg} ${st.text} ${st.border} font-bold px-2 py-0.5`}>
                        {item.type}
                      </Badge>
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{item.subtitle}</div>
                    )}
                  </div>
                  <div className="text-xs font-bold text-muted-foreground font-mono bg-muted/40 px-3 py-1.5 rounded-lg">
                    {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-2 py-1.5 border rounded-xl bg-card">
        <span className="font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Legend:</span>
        {Object.entries(ITEM_STYLES).map(([type, c]) => (
          <div key={type} className="flex items-center gap-1.5 font-bold">
            <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
            {type}
          </div>
        ))}
      </div>

      {/* Unified Details Modal (Visit or Event) */}
      {selectedDetail && (() => {
        const { type, data } = selectedDetail
        const isVisit = type === 'visit'
        const colorKey = data.type
        const st = styleFor(colorKey)
        const dateObj = new Date(data.date)

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedDetail(null)}
          >
            <div
              className="bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4.5 relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedDetail(null)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title Block */}
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-full ${st.bg} ${st.text} border ${st.border} flex items-center justify-center shadow-inner`}>
                  <st.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-extrabold text-lg tracking-tight leading-snug">
                    {isVisit ? data.patient.name : data.title}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {isVisit ? `Patient ID: ${data.patient.patientId}` : `Event Category: ${data.type}`}
                  </div>
                </div>
                <Badge variant="outline" className={`ml-auto font-bold ${st.bg} ${st.text} ${st.border}`}>{data.type}</Badge>
              </div>

              {/* Time and Info Grid */}
              <div className="border-y py-3.5 space-y-2.5 text-sm font-medium">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Clock className="h-4.5 w-4.5 text-primary" />
                  <span className="font-bold text-foreground">
                    {dateObj.toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">({data.duration} mins)</span>
                </div>
                {isVisit && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <User className="h-4.5 w-4.5 text-primary" />
                    <span>Phone: {data.patient.phone}</span>
                  </div>
                )}
              </div>

              {/* Description or Clinical detail blocks */}
              {isVisit ? (
                <div className="space-y-3.5">
                  {data.treatmentGiven && (
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Treatment Program</div>
                      <p className="bg-muted/50 border rounded-xl p-3 text-sm font-semibold">{data.treatmentGiven}</p>
                    </div>
                  )}
                  {data.notes && (
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Clinician Notes</div>
                      <p className="bg-muted/50 border rounded-xl p-3 text-sm text-muted-foreground font-semibold">{data.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                data.description && (
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Description / Details</div>
                    <p className="bg-muted/50 border rounded-xl p-3 text-sm font-semibold text-muted-foreground">{data.description}</p>
                  </div>
                )
              )}

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-2 gap-2 border-t">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteItem}
                  disabled={isDeleting}
                  className="font-bold"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  {isDeleting ? 'Deleting...' : isVisit ? 'Cancel Appointment' : 'Delete Event'}
                </Button>
                {isVisit && (
                  <Link href={`/patients/${data.patient.id}`}>
                    <Button size="sm" className="font-bold">Patient Profile</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Unified Creation Modal */}
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
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors border"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div>
              <h2 className="text-2xl font-black tracking-tight">Schedule Builder</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Select a category and fill in the details.</p>
            </div>

            {/* Toggle Category Buttons */}
            <div className="grid grid-cols-2 p-1 bg-muted rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setScheduleMode('visit')}
                className={`py-2 rounded-lg transition-all ${
                  scheduleMode === 'visit'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Patient Treatment Visit
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode('event')}
                className={`py-2 rounded-lg transition-all ${
                  scheduleMode === 'event'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Meeting / Task / Reminder
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              
              {/* PATIENT VISIT FIELDS */}
              {scheduleMode === 'visit' && (
                <div className="space-y-4">
                  {/* Search Patient */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="patientSearch">Search Patient *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patientSearch"
                        placeholder="Type patient name or Patient ID..."
                        value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.patientId})` : patientSearch}
                        onChange={(e) => {
                          setPatientSearch(e.target.value)
                          if (selectedPatient) setSelectedPatient(null)
                        }}
                        className="pl-9 font-semibold"
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

                    {/* Auto Complete Dropdown */}
                    {searchedPatients.length > 0 && !selectedPatient && (
                      <div className="absolute z-10 w-full bg-popover border rounded-xl shadow-lg mt-1 overflow-hidden divide-y">
                        {searchedPatients.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(p)
                              setPatientSearch(`${p.name} (${p.patientId})`)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center justify-between transition-colors"
                          >
                            <span className="font-bold">{p.name}</span>
                            <span className="text-xs text-muted-foreground font-mono font-bold">{p.patientId}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Visit Time grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitDate">Date &amp; Time *</Label>
                      <Input
                        id="visitDate"
                        type="datetime-local"
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        required
                        className="font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visitType">Visit Type *</Label>
                      <select
                        id="visitType"
                        value={visitType}
                        onChange={(e) => setVisitType(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-semibold"
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
                        required
                        className="font-semibold"
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
                      className="font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exercises">Exercises</Label>
                    <Textarea
                      id="exercises"
                      placeholder="e.g. Home exercise plan, Isometric neck exercises"
                      value={exerciseGiven}
                      onChange={(e) => setExerciseGiven(e.target.value)}
                      className="font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Physiotherapist Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any general observations or medical restrictions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* GENERAL EVENT FIELDS */}
              {scheduleMode === 'event' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">Event Title / Task *</Label>
                    <Input
                      id="eventTitle"
                      placeholder="e.g. Clinic Staff Meeting, Restock ultrasound gel"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      required
                      className="font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Date &amp; Time *</Label>
                      <Input
                        id="eventDate"
                        type="datetime-local"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        className="font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type *</Label>
                      <select
                        id="eventType"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-semibold"
                        required
                      >
                        <option value="Meeting">Meeting</option>
                        <option value="Task">Task / Chore</option>
                        <option value="Reminder">Reminder</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventDuration">Duration (minutes)</Label>
                      <Input
                        id="eventDuration"
                        type="number"
                        value={eventDuration}
                        onChange={(e) => setEventDuration(Number(e.target.value))}
                        min="5"
                        required
                        className="font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDescription">Description / Notes</Label>
                    <Textarea
                      id="eventDescription"
                      placeholder="Details of the meeting agenda or chore requirements..."
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Form Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="font-bold"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? 'Scheduling...' : 'Add to Schedule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
