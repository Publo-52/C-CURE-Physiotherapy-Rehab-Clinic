export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, IndianRupee, Activity, Calendar } from "lucide-react"

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
      name: true,
      phone: true,
      status: true
    }
  })

  // Calculate outstanding dues (sum of remainingDue from the LATEST payment of each patient)
  // Fetching only required fields to avoid memory overload and slow queries
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePatients}</div>
            <p className="text-xs text-muted-foreground">Currently under treatment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysVisits}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{totalOutstandingDues}</div>
            <p className="text-xs text-muted-foreground">Pending collection</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
              Financial Charts (Recharts) Coming Soon
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentPatients.map(patient => (
                <div key={patient.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.phone}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    <span className="text-xs bg-muted px-2 py-1 rounded">{patient.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
