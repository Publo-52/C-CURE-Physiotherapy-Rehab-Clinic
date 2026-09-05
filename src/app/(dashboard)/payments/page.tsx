export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import PaymentsTable from "./payments-table"

export default async function PaymentsPage() {
  const [payments, financialAggregates, pendingAccounts] = await Promise.all([
    prisma.payment.findMany({
      take: 100,
      select: {
        id: true,
        invoiceNumber: true,
        paymentDate: true,
        totalBill: true,
        amountPaidToday: true,
        remainingDue: true,
        status: true,
        paymentMode: true,
        patient: { select: { id: true, name: true, patientId: true } }
      },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.payment.aggregate({ _sum: { totalBill: true, amountPaidToday: true } }),
    prisma.payment.groupBy({
      by: ['patientId'],
      where: { status: { in: ['Due', 'Partially Paid'] } },
    }),
  ])

  const totalCollected = financialAggregates._sum.amountPaidToday || 0
  const totalBilled = financialAggregates._sum.totalBill || 0
  const totalDues = Math.max(0, totalBilled - totalCollected)
  const pendingCount = pendingAccounts.length

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payments & Financial Ledger</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">All payment records and outstanding dues</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalCollected.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Total payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-destructive">₹{totalDues.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Total pending dues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Accounts</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">patients with pending dues</p>
          </CardContent>
        </Card>
      </div>

      <PaymentsTable payments={payments} />
    </div>
  )
}

