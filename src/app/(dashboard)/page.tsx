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

  // Run all independent queries in parallel — 10 concurrent connections to Supabase pooler
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
    // Direct aggregate SUM instead of fetching all patients
    prisma.payment.aggregate({ _sum: { remainingDue: true } }),
    prisma.payment.findMany({
      where: { paymentDate: { gte: sevenDaysAgo } },
      select: { amountPaidToday: true, paymentDate: true },
    }),
  ])

  const totalRevenue = totalRevenueResult._sum.amountPaidToday || 0
  const totalOutstandingDues = totalOutstandingDuesResult._sum.remainingDue || 0
  const todaysCompletedSessions = todaysVisitsData.filter(v => v.status === 'Completed').length
  const absentPatients = todaysVisitsData.filter(v => !v.patient.presentStatus).length

  const daysMap: Record<string, { revenue: number; visits: number }> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toLocaleDateString('en-US', { weekday: 'short' })
    daysMap[key] = { revenue: 0, visits: 0 }
  }

  pastPayments.forEach(p => {
    const key = new Date(p.paymentDate).toLocaleDateString('en-US', { weekday: 'short' })
    if (daysMap[key]) {
      daysMap[key].revenue += p.amountPaidToday
    }
  })

  const chartData = Object.keys(daysMap).map(day => ({
    day,
    revenue: daysMap[day].revenue,
    visits: daysMap[day].visits,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm">Welcome back to Phisiyo Management System.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/patients/new">
            <Button size="sm">
              <UserPlus className="mr-1.5 h-4 w-4" /> Add Patient
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue}</div>
            <p className="text-xs text-muted-foreground">Lifetime collections</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePatients}</div>
            <p className="text-xs text-muted-foreground">Currently under care</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysVisits}</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <Activity className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{totalOutstandingDues}</div>
            <p className="text-xs text-muted-foreground">Pending collections</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Registered Today</CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todaysRegistered}</div>
            <p className="text-xs text-primary/70">New patients today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Present Patients</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{presentPatients}</div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">Currently marked present</p>
          </CardContent>
        </Card>
        
        <Card className="bg-rose-500/5 border-rose-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Absent Patients</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{absentPatients}</div>
            <p className="text-xs text-rose-600/70 dark:text-rose-400/70">Scheduled but absent</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Completed Sessions</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{todaysCompletedSessions}</div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Finished today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>7-Day Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Visit Queue</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Active patients scheduled for visits today</p>
              </div>
            </CardHeader>
            <CardContent>
              <VisitQueue initialPatients={queuePatients} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Patients</CardTitle>
              <Link href="/patients" className="text-xs text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPatients.map(patient => (
                  <Link key={patient.id} href={`/patients/${patient.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium leading-none">{patient.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {patient.phone} • {patient.disease || 'General'}
                      </p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">{patient.patientId}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

