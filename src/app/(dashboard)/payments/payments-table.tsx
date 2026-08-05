'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Search, Share2, Copy, Check, MessageCircle, Printer } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

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

function ShareDropdown({ payment }: { payment: PaymentItem }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const dateStr = formatDate(payment.paymentDate)
  const paymentText = 
`🏥 *C-CURE Physiotherapy & Rehab Clinic*
👨‍⚕️ Dr. Sonatan Manna

📋 *Payment Receipt*
━━━━━━━━━━━━━━━━━━━━
🆔 Invoice: ${payment.invoiceNumber}
👤 Patient: ${payment.patient.name} (${payment.patient.patientId})
📅 Date: ${dateStr}
━━━━━━━━━━━━━━━━━━━━
💰 Total Bill: ₹${payment.totalBill}
✅ Amount Paid: ₹${payment.amountPaidToday}
${payment.remainingDue > 0 ? `⚠️ Remaining Due: ₹${payment.remainingDue}` : '✅ No Dues Remaining'}
💳 Payment Mode: ${payment.paymentMode}
📊 Status: ${payment.status}
━━━━━━━━━━━━━━━━━━━━
Thank you for visiting us! 🙏`

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentText).then(() => {
      setCopied(true)
      toast.success('Payment details copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
      setOpen(false)
    })
  }

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(paymentText)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
    setOpen(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment Receipt - ${payment.invoiceNumber}`,
          text: paymentText,
        })
      } catch (e) {
        // User cancelled
      }
      setOpen(false)
    } else {
      handleCopy()
    }
  }

  const handlePrintPDF = () => {
    const printContent = `
      <html>
        <head>
          <title>Payment Receipt - ${payment.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; }
            .header h1 { color: #0ea5e9; margin: 0 0 10px 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 5px 0; font-size: 16px; color: #555; font-weight: bold; }
            .title { text-align: center; font-size: 20px; text-transform: uppercase; margin-bottom: 20px; background: #f0f9ff; padding: 10px; border-radius: 5px;}
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .box p { margin: 8px 0; font-size: 14px; }
            .box strong { display: inline-block; width: 120px; color: #475569; }
            .amounts { background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; text-align: right; margin-bottom: 30px; }
            .amounts p { margin: 10px 0; font-size: 16px; }
            .amounts .total { font-size: 20px; font-weight: bold; color: #166534; border-top: 1px solid #bbf7d0; padding-top: 10px; }
            .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>C-CURE PHYSIOTHERAPY & REHAB CLINIC</h1>
            <p>Dr. Sonatan Manna</p>
          </div>
          <div class="title">Payment Receipt</div>
          
          <div class="grid">
            <div class="box">
              <p><strong>Invoice Number:</strong> ${payment.invoiceNumber}</p>
              <p><strong>Date:</strong> ${dateStr}</p>
              <p><strong>Payment Mode:</strong> ${payment.paymentMode}</p>
              <p><strong>Status:</strong> ${payment.status}</p>
            </div>
            <div class="box">
              <p><strong>Patient Name:</strong> ${payment.patient.name}</p>
              <p><strong>Patient ID:</strong> ${payment.patient.patientId}</p>
            </div>
          </div>

          <div class="amounts">
            <p><strong>Total Bill:</strong> ₹${payment.totalBill}</p>
            <p><strong>Previous Due:</strong> ₹${payment.remainingDue + payment.amountPaidToday - payment.totalBill > 0 ? payment.remainingDue + payment.amountPaidToday - payment.totalBill : 0}</p>
            <div class="total">Amount Paid Today: ₹${payment.amountPaidToday}</div>
            <p style="color: ${payment.remainingDue > 0 ? '#dc2626' : '#16a34a'}; margin-top: 10px;">
              <strong>Current Due:</strong> ₹${payment.remainingDue}
            </p>
          </div>

          <div class="footer">
            <p>Thank you for visiting C-CURE Physiotherapy & Rehab Clinic.</p>
            <p>Wishing you a speedy recovery!</p>
          </div>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      // Wait for styling to apply
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        title="Share Payment Record"
        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-8 z-50 w-48 bg-card border rounded-xl shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Share Receipt</p>
              <p className="text-[10px] text-muted-foreground truncate">{payment.invoiceNumber}</p>
            </div>
            <div className="p-1">
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-green-500/10 text-green-600 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-blue-500/10 text-blue-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share / More...
              </button>
              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-orange-500/10 text-orange-600 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print / Save PDF
              </button>
              <div className="h-px bg-border my-1 mx-2" />
              <button
                onClick={handleCopy}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-foreground"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
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
      <CardHeader className="flex flex-col gap-4 pb-4 border-b">
        <CardTitle className="text-xl">All Payment Records</CardTitle>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

          <div className="flex gap-1 bg-muted p-1 rounded-lg text-xs overflow-x-auto">
            {['All', 'Paid', 'Partially Paid', 'Due'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
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
          <>
            {/* ── Mobile Card View (< md) ── */}
            <div className="block md:hidden divide-y divide-border">
              {filteredPayments.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  {/* Invoice + Date */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-semibold text-primary">{p.invoiceNumber}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(p.paymentDate)}</p>
                    </div>
                    <Badge variant={statusColor[p.status] || 'secondary'}>{p.status}</Badge>
                  </div>

                  {/* Patient */}
                  <div>
                    <Link href={`/patients/${p.patient.id}`} className="font-medium text-sm text-primary hover:underline block">
                      {p.patient.name}
                    </Link>
                    <span className="text-muted-foreground text-xs font-mono">{p.patient.patientId}</span>
                  </div>

                  {/* Amounts grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/40 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">Bill</p>
                      <p className="text-xs font-semibold">₹{p.totalBill}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Paid</p>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">₹{p.amountPaidToday}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${p.remainingDue > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-muted/40'}`}>
                      <p className={`text-[10px] ${p.remainingDue > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>Due</p>
                      <p className={`text-xs font-semibold ${p.remainingDue > 0 ? 'text-destructive' : ''}`}>₹{p.remainingDue}</p>
                    </div>
                  </div>

                  {/* Mode + Share */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.paymentMode}</span>
                    <ShareDropdown payment={p} />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop Table View (≥ md) ── */}
            <div className="hidden md:block overflow-x-auto">
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
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Share</th>
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
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">₹{p.totalBill}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">₹{p.amountPaidToday}</td>
                      <td className={`py-3 px-4 text-right font-medium ${p.remainingDue > 0 ? 'text-destructive' : ''}`}>
                        ₹{p.remainingDue}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusColor[p.status] || 'secondary'}>{p.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{p.paymentMode}</td>
                      <td className="py-3 px-4 text-center">
                        <ShareDropdown payment={p} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


