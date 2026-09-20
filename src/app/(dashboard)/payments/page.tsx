export const dynamic = 'force-dynamic'

import { TrendingDown, TrendingUp, AlertCircle, IndianRupee, ShieldAlert, CheckCircle2 } from "lucide-react"
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
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">
          Payments &amp; Financial Ledger
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
          <IndianRupee className="h-3.5 w-3.5 text-primary" />
          Comprehensive transaction logs, patient invoices, and outstanding clinic dues.
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        
        {/* Total Collected */}
        <div className="card-handmade overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Collected</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tabular-num text-emerald-600 dark:text-emerald-400">
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Lifetime verified collections
            </p>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="card-handmade overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-amber-500" />
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Outstanding Dues</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tabular-num text-rose-600 dark:text-rose-400">
              ₹{totalDues.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-rose-500" /> Pending uncollected bills
            </p>
          </div>
        </div>

        {/* Pending Accounts */}
        <div className="card-handmade overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Accounts</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tabular-num text-amber-600 dark:text-amber-400">
              {pendingCount}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">
              Patients with active balances
            </p>
          </div>
        </div>
      </div>

      <PaymentsTable payments={payments} />
    </div>
  )
}
