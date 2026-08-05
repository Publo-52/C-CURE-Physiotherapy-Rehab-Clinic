'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Search, Share2, Copy, Check, MessageCircle, Download, MoreVertical } from 'lucide-react'
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

function DownloadDropdown({ payment }: { payment: PaymentItem }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const dateStr = formatDate(payment.paymentDate)
  const paymentText = 
`🏥 *C-CURE Physiotherapy & Rehab Clinic*
Sanatan Manna (Physiotherapist)

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
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${payment.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 30px; color: #0f172a; background: #fff; line-height: 1.5; }
            .container { max-width: 750px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #fff; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; }
            .brand { flex: 1; }
            .brand h1 { font-size: 22px; font-weight: 800; tracking: -0.5px; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
            .brand p { font-size: 13px; color: #bae6fd; font-weight: 600; margin-top: 4px; }
            .contact-info { text-align: right; font-size: 11px; color: #e0f2fe; line-height: 1.6; }
            .meta-bar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 32px; display: flex; justify-content: space-between; align-items: center; }
            .meta-item { text-align: left; }
            .meta-item span { display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; tracking: 0.5px; }
            .meta-item strong { font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace; }
            .status-badge { background: ${payment.status === 'Paid' ? '#dcfce7' : payment.status === 'Partially Paid' ? '#fef9c3' : '#fee2e2'}; color: ${payment.status === 'Paid' ? '#15803d' : payment.status === 'Partially Paid' ? '#a16207' : '#b91c1c'}; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; border: 1px solid currentColor; }
            .content { padding: 32px; }
            .section-title { font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; color: #0284c7; margin-bottom: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
            .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .info-card p { font-size: 13px; margin-bottom: 6px; color: #334155; }
            .info-card p:last-child { margin-bottom: 0; }
            .info-card strong { font-weight: 600; color: #0f172a; display: inline-block; width: 100px; }
            .table-container { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 28px; }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
            td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            tr:last-child td { border-bottom: none; }
            .summary-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: right; margin-bottom: 32px; }
            .summary-row { display: flex; justify-content: flex-end; gap: 24px; font-size: 13px; margin-bottom: 6px; color: #166534; }
            .summary-total { display: flex; justify-content: flex-end; gap: 24px; font-size: 18px; font-weight: 800; color: #15803d; border-top: 1.5px dashed #86efac; padding-top: 10px; margin-top: 10px; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; pt-20px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
            .notice { font-size: 11px; color: #64748b; max-width: 400px; line-height: 1.5; }
            .signature { text-align: right; }
            .sig-line { width: 160px; border-bottom: 1.5px dashed #94a3b8; margin-bottom: 8px; margin-left: auto; }
            .sig-name { font-size: 13px; font-weight: 700; color: #0f172a; }
            .sig-title { font-size: 11px; color: #64748b; }
            @media print {
              body { padding: 0; background: #fff; }
              .container { border: none; box-shadow: none; max-width: 100%; }
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">
                <h1>C-CURE PHYSIOTHERAPY & REHAB CLINIC</h1>
                <p>Sanatan Manna (Physiotherapist)</p>
              </div>
              <div class="contact-info">
                <p>📞 7942688985</p>
                <p>✉️ sanatan.manna28072015@gmail.com</p>
                <p>📍 Moyna, Midnapore, West Bengal</p>
              </div>
            </div>

            <div class="meta-bar">
              <div class="meta-item">
                <span>Invoice Number</span>
                <strong>${payment.invoiceNumber}</strong>
              </div>
              <div class="meta-item">
                <span>Date Issued</span>
                <strong style="font-family: inherit;">${dateStr}</strong>
              </div>
              <div class="meta-item">
                <span>Payment Mode</span>
                <strong style="font-family: inherit;">${payment.paymentMode}</strong>
              </div>
              <div>
                <span class="status-badge">${payment.status}</span>
              </div>
            </div>

            <div class="content">
              <div class="grid">
                <div class="info-card">
                  <div class="section-title">Patient Information</div>
                  <p><strong>Name:</strong> ${payment.patient.name}</p>
                  <p><strong>Patient ID:</strong> <span style="font-family: monospace; font-weight: 600;">${payment.patient.patientId}</span></p>
                </div>
                <div class="info-card">
                  <div class="section-title">Clinic Practitioner</div>
                  <p><strong>Practitioner:</strong> Sanatan Manna</p>
                  <p><strong>Designation:</strong> Physiotherapist</p>
                </div>
              </div>

              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style="text-align: right;">Total Bill</th>
                      <th style="text-align: right;">Paid Today</th>
                      <th style="text-align: right;">Current Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Physiotherapy Treatment / Consultation Fee</td>
                      <td style="text-align: right; font-weight: 600;">₹${payment.totalBill.toLocaleString('en-IN')}</td>
                      <td style="text-align: right; font-weight: 700; color: #16a34a;">₹${payment.amountPaidToday.toLocaleString('en-IN')}</td>
                      <td style="text-align: right; font-weight: 700; color: ${payment.remainingDue > 0 ? '#dc2626' : '#16a34a'};">₹${payment.remainingDue.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="summary-box">
                <div class="summary-row">
                  <span>Total Bill Amount:</span>
                  <span style="font-weight: 600; width: 90px;">₹${payment.totalBill.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-total">
                  <span>Amount Paid Today:</span>
                  <span style="width: 100px;">₹${payment.amountPaidToday.toLocaleString('en-IN')}</span>
                </div>
                ${payment.remainingDue > 0 ? `
                  <div style="color: #dc2626; font-size: 13px; font-weight: 700; margin-top: 8px;">
                    Remaining Balance Due: ₹${payment.remainingDue.toLocaleString('en-IN')}
                  </div>
                ` : ''}
              </div>

              <div class="footer">
                <div class="notice">
                  <p>• Thank you for visiting C-CURE Physiotherapy & Rehab Clinic.</p>
                  <p>• This is an official computer-generated receipt.</p>
                </div>
                <div class="signature">
                  <div class="sig-line"></div>
                  <div class="sig-name">Sanatan Manna</div>
                  <div class="sig-title">Physiotherapist</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
    setOpen(false)
  }

  return (
    <div className="relative inline-flex items-center gap-1">
      {/* Primary Download PDF Button */}
      <button
        onClick={handlePrintPDF}
        title={`Download PDF for ${payment.patient.name}`}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-all shadow-2xs"
      >
        <Download className="h-3.5 w-3.5" />
        <span>PDF</span>
      </button>

      {/* More Options Dropdown */}
      <button
        onClick={() => setOpen(o => !o)}
        title="More Options"
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 top-8 z-50 w-52 bg-card border rounded-xl shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Download / Share</p>
              <p className="text-[10px] text-muted-foreground truncate">{payment.patient.name} ({payment.invoiceNumber})</p>
            </div>
            <div className="p-1">
              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg hover:bg-primary/10 text-primary transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF Receipt
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg hover:bg-green-500/10 text-green-600 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg hover:bg-blue-500/10 text-blue-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share Options...
              </button>
              <div className="h-px bg-border my-1 mx-2" />
              <button
                onClick={handleCopy}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg hover:bg-muted transition-colors text-foreground"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Text Details'}
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
            <div className="block md:hidden space-y-3 p-3 bg-muted/20">
              {filteredPayments.map((p) => (
                <div key={p.id} className="p-4 space-y-3 bg-background border border-border/70 rounded-2xl shadow-xs">
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

                  {/* Mode + Download */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.paymentMode}</span>
                    <DownloadDropdown payment={p} />
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
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Download</th>
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
                        <DownloadDropdown payment={p} />
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


