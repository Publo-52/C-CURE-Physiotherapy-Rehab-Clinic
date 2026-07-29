import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IndianRupee, TrendingDown, TrendingUp, AlertCircle } from "lucide-react"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: { patient: { select: { name: true, patientId: true } } },
    orderBy: { paymentDate: 'desc' },
  })

  const totalCollected = payments.reduce((acc, p) => acc + p.amountPaidToday, 0)
  const totalDues = payments.reduce((acc, p) => acc + p.remainingDue, 0)
  const overduePayments = payments.filter(p => p.status === 'Due' || p.status === 'Partially Paid')

  const statusColor: Record<string, string> = {
    'Paid': 'default',
    'Partially Paid': 'secondary',
    'Due': 'destructive',
    'Overdue': 'destructive',
    'Advance Paid': 'outline',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Payments & Dues</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalCollected.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{totalDues.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Collections</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{overduePayments.length}</div>
            <p className="text-xs text-muted-foreground">patients with outstanding dues</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No payment records yet. Record a payment from a patient profile.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Invoice</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Bill</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Paid</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Due</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-mono text-xs">{p.invoiceNumber}</td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{p.patient.name}</div>
                        <div className="text-muted-foreground text-xs">{p.patient.patientId}</div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-right">₹{p.totalBill}</td>
                      <td className="py-3 px-2 text-right text-green-600 font-medium">₹{p.amountPaidToday}</td>
                      <td className={`py-3 px-2 text-right font-medium ${p.remainingDue > 0 ? 'text-destructive' : ''}`}>
                        ₹{p.remainingDue}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={(statusColor[p.status] as any) || 'secondary'}>{p.status}</Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{p.paymentMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
