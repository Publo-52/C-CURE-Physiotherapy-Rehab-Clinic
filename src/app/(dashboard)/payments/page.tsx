export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import PaymentsTable from "./payments-table"

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: { patient: { select: { id: true, name: true, patientId: true } } },
    orderBy: { paymentDate: 'desc' },
  })

  const totalCollected = payments.reduce((acc, p) => acc + p.amountPaidToday, 0)
  const totalDues = payments.reduce((acc, p) => acc + p.remainingDue, 0)
  const overduePayments = payments.filter(p => p.status === 'Due' || p.status === 'Partially Paid')

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Payments & Financial Ledger</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalCollected.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Total payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{totalDues.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Total pending dues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Accounts</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{overduePayments.length}</div>
            <p className="text-xs text-muted-foreground">patients with pending dues</p>
          </CardContent>
        </Card>
      </div>

      <PaymentsTable payments={payments} />
    </div>
  )
}

