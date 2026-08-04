export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, IndianRupee, Activity, Calendar, UserPlus, ArrowRight, CheckCircle2, XCircle, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DashboardChart from "./dashboard-chart"
import { VisitQueue } from "./visit-queue"

export default async function DashboardPage() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [
    totalRevenueResult,
    activePatients,
    todaysVisits,
    todaysRegistered,
    presentPatients,
    queuePatients,
    todaysVisitsData,
    recentPatients,
    totalOutstandingDuesResult,
    pastPayments,
    rawEvents,
    scheduledVisits,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amountPaidToday: true } }),
    prisma.patient.count({ where: { status: 'Active' } }),
    prisma.visit.count({ where: { date: { gte: todayStart, lt: todayEnd } } }),
    prisma.patient.count({ where: { createdAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.patient.count({ where: { presentStatus: true } }),
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
    prisma.payment.aggregate({ _sum: { remainingDue: true } }),
    prisma.payment.findMany({
      where: { paymentDate: { gte: sevenDaysAgo } },
      select: { amountPaidToday: true, paymentDate: true },
    }),
    prisma.event.findMany({ orderBy: { date: 'asc' } }),
    prisma.visit.findMany({
      where: { status: 'Scheduled' },
      orderBy: { date: 'asc' },
      include: { patient: { select: { name: true, patientId: true } } },
    }),
  ])

  const totalRevenue = totalRevenueResult._sum.amountPaidToday || 0
  const totalOutstandingDues = totalOutstandingDuesResult._sum.remainingDue || 0
  const todaysCompletedSessions = todaysVisitsData.filter(v => v.status === 'Completed').length
  const absentPatients = todaysVisitsData.filter(v => !v.patient.presentStatus).length

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

  // Chart data
  const daysMap: Record<string, { revenue: number; visits: number }> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toLocaleDateString('en-US', { weekday: 'short' })
    daysMap[key] = { revenue: 0, visits: 0 }
  }
  pastPayments.forEach(p => {
    const key = new Date(p.paymentDate).toLocaleDateString('en-US', { weekday: 'short' })
    if (daysMap[key]) daysMap[key].revenue += p.amountPaidToday
  })
  const chartData = Object.keys(daysMap).map(day => ({
    day, revenue: daysMap[day].revenue, visits: daysMap[day].visits,
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary pulse-dot" />
            {dateStr}
          </p>
        </div>
        <Link href="/patients/new">
          <Button size="sm" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
            <UserPlus className="mr-1.5 h-4 w-4" /> Add Patient
          </Button>
        </Link>
      </div>

      {/* ── Row 1: Primary KPI cards ─────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

        <div className="card-hover rounded-2xl overflow-hidden shadow-sm border border-border bg-card">
          <div className="h-1.5 w-full" style={{background:'linear-gradient(90deg,oklch(0.52 0.16 195),oklch(0.65 0.14 175))'}} />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl" style={{background:'oklch(0.52 0.16 195 / 12%)'}}>
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" style={{color:'oklch(0.52 0.16 195)'}} />
              </div>
              <span className="text-[10px] font-semibold bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">Lifetime</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Total collections</p>
          </div>
        </div>

        <div className="card-hover rounded-2xl overflow-hidden shadow-sm border border-border bg-card">
          <div className="h-1.5 w-full" style={{background:'linear-gradient(90deg,oklch(0.45 0.18 250),oklch(0.55 0.16 230))'}} />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl" style={{background:'oklch(0.45 0.18 250 / 12%)'}}>
                <Users className="h-4 w-4 sm:h-5 sm:w-5" style={{color:'oklch(0.45 0.18 250)'}} />
              </div>
              <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold">{activePatients}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Under care</p>
          </div>
        </div>

        <div className="card-hover rounded-2xl overflow-hidden shadow-sm border border-border bg-card">
          <div className="h-1.5 w-full" style={{background:'linear-gradient(90deg,oklch(0.55 0.18 155),oklch(0.65 0.15 145))'}} />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl" style={{background:'oklch(0.55 0.18 155 / 12%)'}}>
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" style={{color:'oklch(0.55 0.18 155)'}} />
              </div>
              <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Today</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold">{todaysVisits}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Scheduled visits</p>
          </div>
        </div>

        <div className="card-hover rounded-2xl overflow-hidden shadow-sm border border-border bg-card">
          <div className="h-1.5 w-full" style={{background:'linear-gradient(90deg,oklch(0.55 0.22 15),oklch(0.65 0.18 25))'}} />
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
              </div>
              <span className="text-[10px] font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">Pending</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-500">₹{totalOutstandingDues.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Outstanding dues</p>
          </div>
        </div>
      </div>

      {/* ── Row 2: Secondary KPI cards ───────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

        <div className="card-hover rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-primary/15 shrink-0">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wide">New Today</p>
            <p className="text-xl sm:text-2xl font-extrabold text-primary">{todaysRegistered}</p>
            <p className="text-[10px] text-primary/60">Registered</p>
          </div>
        </div>

        <div className="card-hover rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4 sm:p-5 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-800/30 shrink-0">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400/70 uppercase tracking-wide">Present</p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{presentPatients}</p>
            <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/50">In clinic</p>
          </div>
        </div>

        <div className="card-hover rounded-2xl border border-rose-200 dark:border-rose-800/40 bg-rose-50/60 dark:bg-rose-900/10 p-4 sm:p-5 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-800/30 shrink-0">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400/70 uppercase tracking-wide">Absent</p>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">{absentPatients}</p>
            <p className="text-[10px] text-rose-500/60">Missed today</p>
          </div>
        </div>

        <div className="card-hover rounded-2xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-900/10 p-4 sm:p-5 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-800/30 shrink-0">
            <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400/70 uppercase tracking-wide">Done</p>
            <p className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-400">{todaysCompletedSessions}</p>
            <p className="text-[10px] text-blue-500/60">Sessions complete</p>
          </div>
        </div>
      </div>

      {/* ── Row 3: Visit Queue + Upcoming Schedule ───────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Today&apos;s Visit Queue</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Active patients scheduled for today</p>
            </div>
          </CardHeader>
          <CardContent>
            <VisitQueue initialPatients={queuePatients} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Upcoming Schedule</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Next 5 events &amp; appointments</p>
            </div>
            <Link href="/calendar" className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors">
              Open <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Calendar className="h-8 w-8 opacity-30" />
                  <p className="text-xs text-center">No upcoming events.<br />Open the Scheduler to add one.</p>
                </div>
              ) : (
                upcomingEvents.map((event, i) => {
                  const borderCls = eventBorderColor[event.type] ?? 'border-l-slate-400'
                  const badgeCls  = eventTypeColor[event.type]  ?? eventTypeColor['Other']
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center justify-between p-3 rounded-xl border border-l-[3px] bg-muted/20 hover:bg-muted/40 transition-colors ${borderCls}`}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          {' at '}
                          {new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${badgeCls}`}>
                        {event.type}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Revenue Trend + Recent Patients ───────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">7-Day Revenue Trend</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Daily revenue for the past week</p>
          </CardHeader>
          <CardContent className="pt-0">
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Recent Patients</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest registrations</p>
            </div>
            <Link href="/patients" className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentPatients.map((patient, i) => (
                <Link
                  key={patient.id}
                  href={`/patients/${patient.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all group"
                >
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm"
                    style={{background: `linear-gradient(135deg, oklch(0.52 0.16 ${195 + i * 15}), oklch(0.62 0.14 ${175 + i * 15}))`}}
                  >
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight group-hover:text-primary transition-colors truncate">{patient.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{patient.disease || 'General'}</p>
                  </div>
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono font-bold flex-shrink-0">
                    {patient.patientId}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
