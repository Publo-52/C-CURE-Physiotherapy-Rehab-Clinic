export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, IndianRupee, Activity, Calendar, UserPlus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DashboardChart from "./dashboard-chart"

export default async function DashboardPage() {
  // Fetch KPI data
  const totalRevenueResult = await prisma.payment.aggregate({
    _sum: { amountPaidToday: true }
  })
  const totalRevenue = totalRevenueResult._sum.amountPaidToday || 0

  const activePatients = await prisma.patient.count({
    where: { status: 'Active' }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todaysVisits = await prisma.visit.count({
    where: {
      date: {
        gte: today,
        lt: tomorrow
      }
    }
  })

  // Get recent 5 patients for the list
  const recentPatients = await prisma.patient.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      patientId: true,
      name: true,
      phone: true,
      disease: true,
      status: true
    }
  })

  // Outstanding dues
  const patientsForDues = await prisma.patient.findMany({
    select: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          remainingDue: true
        }
      }
    }
  })
  
  const totalOutstandingDues = patientsForDues.reduce((acc, patient) => {
    if (patient.payments.length > 0) {
      const latestPayment = patient.payments[0]
      if (latestPayment.remainingDue > 0) {
        return acc + latestPayment.remainingDue
      }
    }
    return acc
  }, 0)

  // Aggregate past 7 days payments for chart
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const pastPayments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: sevenDaysAgo }
    },
    select: {
      amountPaidToday: true,
      paymentDate: true
    }
  })

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
    visits: daysMap[day].visits
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>7-Day Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DashboardChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
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
  )
}

