export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import { Users, IndianRupee, Activity, Calendar, UserPlus, ArrowRight, CheckCircle2, XCircle, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DashboardChart from "./dashboard-chart"
import { VisitQueue } from "./visit-queue"
import { getISTDayBounds } from "@/lib/date-utils"

export default async function DashboardPage() {
  const { todayStart, todayEnd } = getISTDayBounds()

  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [
    paymentAggregates,
    activePatients,
    todaysRegistered,
    queuePatients,
    todaysVisitsData,
    recentPatients,
    pastPayments,
    rawEvents,
    scheduledVisits,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { totalBill: true, amountPaidToday: true } }),
    prisma.patient.count({ where: { status: 'Active' } }),
    prisma.patient.count({ where: { createdAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.patient.findMany({
      where: { presentStatus: true },
      select: { id: true, patientId: true, name: true, phone: true, disease: true },
      orderBy: { name: 'asc' },
    }),
    prisma.visit.findMany({
      where: { date: { gte: todayStart, lt: todayEnd } },
      select: { status: true, patient: { select: { presentStatus: true } } },
    }),
    prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, patientId: true, name: true, phone: true, disease: true, status: true },
    }),
    prisma.payment.findMany({
      where: { paymentDate: { gte: sevenDaysAgo } },
      select: { amountPaidToday: true, paymentDate: true },
    }),
    prisma.event.findMany({ 
      where: { date: { gte: todayStart } },
      orderBy: { date: 'asc' },
      take: 20,
      select: { id: true, title: true, date: true, type: true },
    }),
    prisma.visit.findMany({
      where: { status: 'Scheduled', date: { gte: todayStart } },
      orderBy: { date: 'asc' },
      take: 20,
      select: {
        id: true,
        date: true,
        type: true,
        patient: { select: { name: true, patientId: true } },
      },
    }),
  ])

  const todaysVisits = todaysVisitsData.length
  const presentPatients = queuePatients.length
  const totalRevenue = paymentAggregates._sum.amountPaidToday || 0
  const totalBilled = paymentAggregates._sum.totalBill || 0
  const totalOutstandingDues = Math.max(0, totalBilled - totalRevenue)
  const todaysCompletedSessions = todaysVisitsData.filter(v => v.status === 'Completed').length
  const absentPatients = todaysVisitsData.filter(v => v.status !== 'Completed' && !v.patient.presentStatus).length

  // Merge general events + scheduled patient visits
  const upcomingEvents = [
    ...rawEvents.map(e => ({
      id: e.id, title: e.title, date: e.date, type: e.type, kind: 'event' as const,
    })),
    ...scheduledVisits.map(v => ({
      id: v.id,
      title: v.patient?.name ? `Visit: ${v.patient.name}` : 'Patient Visit',
      date: v.date,
      type: v.type || 'Clinic Visit',
      kind: 'visit' as const,
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  // 7-Day Revenue Chart Data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      date: d.getDate(),
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: 0,
    }
  })

  pastPayments.forEach(p => {
    const pDate = new Date(p.paymentDate)
    const matchedDay = last7Days.find(
      d => d.year === pDate.getFullYear() && d.month === pDate.getMonth() && d.date === pDate.getDate()
    )
    if (matchedDay) {
      matchedDay.revenue += p.amountPaidToday
    }
  })

  const chartData = last7Days.map(d => ({
    day: d.dayLabel,
    revenue: Math.round(d.revenue),
  }))

  // UI helpers
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const eventTypeColor: Record<string, string> = {
    'Meeting':     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'Task':        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Reminder':    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'Clinic Visit':'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    'Other':       'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  }
  const eventBorderColor: Record<string, string> = {
    'Meeting':      'border-l-blue-400',
    'Task':         'border-l-amber-400',
    'Reminder':     'border-l-violet-400',
    'Clinic Visit': 'border-l-teal-400',
    'Other':        'border-l-slate-400',
  }

  return (
    <div className="space-y-6 fade-in-up">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 flex items-center gap-2 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="radar-wave absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            {dateStr}
          </p>
        </div>
        <Link href="/patients/new">
          <Button size="sm" className="shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 transition-all rounded-xl font-bold active-press">
            <UserPlus className="mr-1.5 h-4 w-4" /> Add Patient
          </Button>
        </Link>
      </div>

      {/* ── Row 1: Primary KPI cards ─────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

        <div className="card-handmade overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-cyan-500" />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-[10px] font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 px-2 py-0.5 rounded-full">
                Lifetime
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black tabular-num tracking-tight text-foreground">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Total Collections</p>
          </div>
        </div>

        <div className="card-handmade overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black tabular-num tracking-tight text-foreground">
              {activePatients}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Patients Under Care</p>
          </div>
        </div>

        <div className="card-handmade overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
                Today
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black tabular-num tracking-tight text-foreground">
              {todaysVisits}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Scheduled Visits</p>
          </div>
        </div>

        <div className="card-handmade overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-amber-500" />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 px-2 py-0.5 rounded-full">
                Pending
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black tabular-num tracking-tight text-rose-600 dark:text-rose-400">
              ₹{totalOutstandingDues.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Outstanding Dues</p>
          </div>
        </div>
      </div>

      {/* ── Row 2: Secondary KPI cards ───────────────────────── */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">

        <div className="card-handmade p-4 sm:p-5 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">New Today</p>
            <p className="text-xl sm:text-2xl font-black tabular-num text-primary">{todaysRegistered}</p>
            <p className="text-[10.5px] text-muted-foreground font-medium">Registered</p>
          </div>
        </div>

        <div className="card-handmade p-4 sm:p-5 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Present</p>
            <p className="text-xl sm:text-2xl font-black tabular-num text-emerald-600 dark:text-emerald-400">{presentPatients}</p>
            <p className="text-[10.5px] text-muted-foreground font-medium">In Clinic</p>
          </div>
        </div>

        <div className="card-handmade p-4 sm:p-5 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 shrink-0">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Absent</p>
            <p className="text-xl sm:text-2xl font-black tabular-num text-rose-600 dark:text-rose-400">{absentPatients}</p>
            <p className="text-[10.5px] text-muted-foreground font-medium">Missed Today</p>
          </div>
        </div>

        <div className="card-handmade p-4 sm:p-5 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 shrink-0">
            <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Done</p>
            <p className="text-xl sm:text-2xl font-black tabular-num text-blue-600 dark:text-blue-400">{todaysCompletedSessions}</p>
            <p className="text-[10.5px] text-muted-foreground font-medium">Sessions Complete</p>
          </div>
        </div>
      </div>

      {/* ── Row 3: Visit Queue + Upcoming Schedule ───────────── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <div className="card-handmade lg:col-span-4 p-5">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-border/60 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-foreground">Today&apos;s Visit Queue</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Active patients awaiting treatment</p>
            </div>
          </div>
          <div>
            <VisitQueue initialPatients={queuePatients} />
          </div>
        </div>

        <div className="card-handmade lg:col-span-3 p-5">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-border/60 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-foreground">Upcoming Schedule</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Next appointments &amp; events</p>
            </div>
            <Link href="/calendar" className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-colors">
              Open <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div>
            <div className="space-y-2.5">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Calendar className="h-8 w-8 opacity-30" />
                  <p className="text-xs text-center font-medium">No upcoming events.<br />Open the Scheduler to add one.</p>
                </div>
              ) : (
                upcomingEvents.map((event, i) => {
                  const borderCls = eventBorderColor[event.type] ?? 'border-l-slate-400'
                  const badgeCls  = eventTypeColor[event.type]  ?? eventTypeColor['Other']
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border border-l-[4px] bg-card/60 hover:bg-card hover:shadow-xs transition-all duration-200 ${borderCls}`}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{event.title}</p>
                        <p className="text-[10.5px] text-muted-foreground font-medium mt-0.5 tabular-num">
                          {new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          {' at '}
                          {new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${badgeCls}`}>
                        {event.type}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Revenue Trend + Recent Patients ───────────── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <div className="card-handmade lg:col-span-4 p-5">
          <div className="pb-2 border-b border-border/60 mb-2">
            <h2 className="text-base font-extrabold text-foreground">7-Day Revenue Trend</h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Daily collections performance</p>
          </div>
          <div className="pt-2">
            <DashboardChart data={chartData} />
          </div>
        </div>

        <div className="card-handmade lg:col-span-3 p-5">
          <div className="flex flex-row items-center justify-between pb-3 border-b border-border/60 mb-3">
            <div>
              <h2 className="text-base font-extrabold text-foreground">Recent Patients</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Latest registrations</p>
            </div>
            <Link href="/patients" className="text-xs text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div>
            <div className="space-y-1.5">
              {recentPatients.map((patient, i) => (
                <Link
                  key={patient.id}
                  href={`/patients/${patient.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted/60 transition-all group active-press"
                >
                  <div
                    className="h-8.5 w-8.5 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-xs"
                    style={{background: `linear-gradient(135deg, oklch(0.55 0.16 ${192 + i * 15}), oklch(0.65 0.14 ${175 + i * 15}))`}}
                  >
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-tight text-foreground group-hover:text-primary transition-colors truncate">{patient.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{patient.disease || 'General Condition'}</p>
                  </div>
                  <span className="text-[9.5px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-mono font-bold flex-shrink-0 tabular-num">
                    {patient.patientId}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
