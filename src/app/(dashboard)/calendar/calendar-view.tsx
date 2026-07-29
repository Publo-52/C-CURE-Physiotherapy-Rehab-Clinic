'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
  'Clinic Visit':         { bg: 'bg-blue-500/20',   text: 'text-blue-300',   dot: 'bg-blue-500' },
  'Home Visit':           { bg: 'bg-rose-500/20',    text: 'text-rose-300',   dot: 'bg-rose-500' },
  'Online Consultation':  { bg: 'bg-purple-500/20',  text: 'text-purple-300', dot: 'bg-purple-500' },
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

  const filteredVisits = useMemo(() =>
    filterType === 'All'
      ? visits
      : visits.filter(v => v.type === filterType),
    [visits, filterType]
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar &amp; Appointments</h1>
          <p className="text-muted-foreground">Schedule and manage patient treatment visits.</p>
        </div>
        {patients.length > 0 && (
          <Link href={`/patients/${patients[0].id}/visits/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Record Visit
            </Button>
          </Link>
        )}
      </div>

      {/* Filter + View Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Filter:</span>
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
                    className={`min-h-[90px] p-1.5 border-b border-r last:border-r-0 transition-colors ${
                      !isValid ? 'bg-muted/20' : 'hover:bg-muted/30'
                    }`}
                  >
                    {isValid && (
                      <>
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                            isToday
                              ? 'bg-primary text-primary-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {dayNum}
                        </span>
                        <div className="space-y-0.5">
                          {dayVisits.slice(0, 2).map(v => {
                            const c = colorFor(v.type)
                            return (
                              <button
                                key={v.id}
                                onClick={() => setSelectedVisit(v)}
                                className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate leading-4 ${c.bg} ${c.text} hover:opacity-80 transition-opacity`}
                              >
                                {v.patient.name}
                              </button>
                            )
                          })}
                          {dayVisits.length > 2 && (
                            <span className="text-[10px] text-muted-foreground pl-1">
                              +{dayVisits.length - 2} more
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
                    <div key={i} className={`p-1.5 border-r last:border-r-0 min-h-[300px] space-y-1 ${isSameDay(d, today) ? 'bg-primary/5' : ''}`}>
                      {dayVisits.map(v => {
                        const c = colorFor(v.type)
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVisit(v)}
                            className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-medium leading-snug ${c.bg} ${c.text} hover:opacity-80 transition-opacity`}
                          >
                            <div className="truncate">{v.patient.name}</div>
                            <div className="opacity-70">{new Date(v.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
              <div className="py-16 text-center text-muted-foreground text-sm">No visits found.</div>
            )}
            {upcomingVisits.map(v => {
              const c = colorFor(v.type)
              const d = new Date(v.date)
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVisit(v)}
                  className="w-full text-left px-6 py-4 hover:bg-muted/40 transition-colors flex items-center gap-4"
                >
                  <div className="text-center min-w-[48px]">
                    <div className="text-xs text-muted-foreground">{MONTHS[d.getMonth()].slice(0,3)}</div>
                    <div className="text-xl font-bold leading-none">{d.getDate()}</div>
                    <div className="text-xs text-muted-foreground">{d.getFullYear()}</div>
                  </div>
                  <div className={`w-1 self-stretch rounded-full ${c.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{v.patient.name}</div>
                    <div className="text-xs text-muted-foreground">{v.patient.patientId} · {v.type}</div>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">
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
          <div key={type} className="flex items-center gap-1.5">
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
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {new Date(selectedVisit.date).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4 text-primary" />
                {selectedVisit.patient.phone}
              </div>
            </div>

            {selectedVisit.treatmentGiven && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Treatment</div>
                <p className="bg-muted rounded-lg p-3 text-sm">{selectedVisit.treatmentGiven}</p>
              </div>
            )}

            {selectedVisit.notes && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</div>
                <p className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">{selectedVisit.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Link href={`/patients/${selectedVisit.patient.id}`}>
                <Button size="sm">Go to Patient Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
