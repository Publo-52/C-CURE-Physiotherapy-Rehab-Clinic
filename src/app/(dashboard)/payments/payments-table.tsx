'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PaymentItem {
  id: string
  invoiceNumber: string
  paymentDate: string | Date
  totalBill: number
  amountPaidToday: number
  remainingDue: number
  status: string
  paymentMode: string
  patient: {
    id: string
    name: string
    patientId: string
  }
}

interface PaymentsTableProps {
  payments: PaymentItem[]
}

const statusColor: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'Paid': 'default',
  'Partially Paid': 'secondary',
  'Due': 'destructive',
  'Overdue': 'destructive',
  'Advance Paid': 'outline',
}

export default function PaymentsTable({ payments }: PaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = 
      p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' || p.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  return (
    <Card className="shadow-sm border">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <CardTitle className="text-xl">All Payment Records</CardTitle>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoice or patient..."
              className="pl-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-1 bg-muted p-1 rounded-lg text-xs self-start sm:self-auto">
            {['All', 'Paid', 'Partially Paid', 'Due'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  statusFilter === status 
                    ? 'bg-background text-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {filteredPayments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {searchTerm ? 'No payment records match your search query.' : 'No payment records yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Bill</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Paid</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Due</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mode</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{p.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <Link href={`/patients/${p.patient.id}`} className="font-medium text-primary hover:underline block">
                        {p.patient.name}
                      </Link>
                      <span className="text-muted-foreground text-xs font-mono">{p.patient.patientId}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">₹{p.totalBill}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">₹{p.amountPaidToday}</td>
                    <td className={`py-3 px-4 text-right font-medium ${p.remainingDue > 0 ? 'text-destructive' : ''}`}>
                      ₹{p.remainingDue}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={statusColor[p.status] || 'secondary'}>{p.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.paymentMode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
