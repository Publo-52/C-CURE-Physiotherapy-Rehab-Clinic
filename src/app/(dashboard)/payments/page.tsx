export const dynamic = 'force-dynamic'

import { TrendingDown, TrendingUp, AlertCircle, IndianRupee, ShieldAlert, CheckCircle2 } from "lucide-react"
import prisma from "@/lib/prisma"
import PaymentsTable from "./payments-table"
import { filterValidPayments, calculateLedgerEntries } from "@/lib/billing"

export default async function PaymentsPage() {
  const allPayments = await prisma.payment.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      paymentDate: true,
      totalBill: true,
      amountPaidToday: true,
      remainingDue: true,
      status: true,
      paymentMode: true,
      paymentNotes: true,
      visitId: true,
      patient: { select: { id: true, name: true, patientId: true } },
      visit: { select: { id: true, status: true } },
    },
    orderBy: { paymentDate: 'desc' },
  })

  const validPayments = filterValidPayments(allPayments)
  const totalCollected = validPayments.reduce((s, p) => s + (Number(p.amountPaidToday) || 0), 0)
  const totalBilled = validPayments.reduce((s, p) => s + (Number(p.totalBill) || 0), 0)
  const totalDues = Math.max(0, totalBilled - totalCollected)

  const patientPaymentsMap = new Map<string, typeof allPayments>()
  for (const p of validPayments) {
    const pid = p.patient?.id || 'unknown'
    const list = patientPaymentsMap.get(pid) || []
    list.push(p)
    patientPaymentsMap.set(pid, list)
  }

  // Calculate accurate running due for each patient's payment rows
  const enrichedPaymentsMap = new Map<string, { remainingDue: number; computedStatus: string }>()
  for (const [, pList] of patientPaymentsMap.entries()) {
    const ledger = calculateLedgerEntries(pList)
    for (const entry of ledger) {
      if (entry.id) {
        enrichedPaymentsMap.set(entry.id, {
          remainingDue: entry.remainingDue,
          computedStatus: entry.computedStatus,
        })
      }
    }
  }

  const enrichedPayments = validPayments.map(p => {
    const computed = enrichedPaymentsMap.get(p.id)
    return {
      ...p,
      remainingDue: computed ? computed.remainingDue : p.remainingDue,
      status: computed ? computed.computedStatus : p.status,
    }
  })

  const pendingCount = Array.from(patientPaymentsMap.values()).filter(pList => {
    const b = pList.reduce((s, p) => s + (Number(p.totalBill) || 0), 0)
    const c = pList.reduce((s, p) => s + (Number(p.amountPaidToday) || 0), 0)
    return (b - c) > 0
  }).length

  const payments = enrichedPayments.slice(0, 100)

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
