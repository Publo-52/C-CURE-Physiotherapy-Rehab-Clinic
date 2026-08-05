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

  const handleDownloadPDF = async () => {
    const filename = `Receipt_${payment.invoiceNumber}_${payment.patient.name.replace(/\s+/g, '_')}`

    const receiptContent = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; background: #ffffff; width: 700px; margin: 0 auto; box-sizing: border-box;">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 24px 28px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">C-CURE PHYSIOTHERAPY & REHAB CLINIC</h1>
            <p style="font-size: 13px; color: #bae6fd; font-weight: 600; margin: 4px 0 0 0;">Sanatan Manna (Physiotherapist)</p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #e0f2fe; line-height: 1.5;">
            <p style="margin: 0;">📞 7942688985</p>
            <p style="margin: 2px 0 0 0;">📍 Moyna, Midnapore, West Bengal</p>
          </div>
        </div>

        <div style="background: #f8fafc; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 12px 28px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block;">Invoice Number</span>
            <strong style="font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">${payment.invoiceNumber}</strong>
          </div>
          <div>
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block;">Date Issued</span>
            <strong style="font-size: 13px; font-weight: 700; color: #0f172a;">${dateStr}</strong>
          </div>
          <div>
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block;">Payment Mode</span>
            <strong style="font-size: 13px; font-weight: 700; color: #0f172a;">${payment.paymentMode}</strong>
          </div>
          <div>
            <span style="background: ${payment.status === 'Paid' ? '#dcfce7' : payment.status === 'Partially Paid' ? '#fef9c3' : '#fee2e2'}; color: ${payment.status === 'Paid' ? '#15803d' : payment.status === 'Partially Paid' ? '#a16207' : '#b91c1c'}; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; border: 1px solid currentColor;">${payment.status}</span>
          </div>
        </div>

        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
              <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; color: #0284c7; margin-bottom: 8px;">Patient Information</div>
              <p style="font-size: 13px; margin: 0 0 4px 0;"><strong style="font-weight: 600; color: #475569;">Name:</strong> ${payment.patient.name}</p>
              <p style="font-size: 13px; margin: 0;"><strong style="font-weight: 600; color: #475569;">Patient ID:</strong> <span style="font-family: monospace; font-weight: 600;">${payment.patient.patientId}</span></p>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
              <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; color: #0284c7; margin-bottom: 8px;">Clinic Practitioner</div>
              <p style="font-size: 13px; margin: 0 0 4px 0;"><strong style="font-weight: 600; color: #475569;">Practitioner:</strong> Sanatan Manna</p>
              <p style="font-size: 13px; margin: 0;"><strong style="font-weight: 600; color: #475569;">Designation:</strong> Physiotherapist</p>
            </div>
          </div>

          <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">Description</th>
                  <th style="font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right;">Total Bill</th>
                  <th style="font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right;">Paid Today</th>
                  <th style="font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right;">Current Due</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px 14px; color: #334155;">Physiotherapy Treatment / Consultation Fee</td>
                  <td style="padding: 12px 14px; text-align: right; font-weight: 600; color: #334155;">₹${payment.totalBill.toLocaleString('en-IN')}</td>
                  <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #16a34a;">₹${payment.amountPaidToday.toLocaleString('en-IN')}</td>
                  <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: ${payment.remainingDue > 0 ? '#dc2626' : '#16a34a'};">₹${payment.remainingDue.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: right; margin-bottom: 24px;">
            <div style="display: flex; justify-content: flex-end; gap: 20px; font-size: 13px; color: #166534; margin-bottom: 4px;">
              <span>Total Bill Amount:</span>
              <span style="font-weight: 600; min-width: 80px;">₹${payment.totalBill.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 20px; font-size: 16px; font-weight: 800; color: #15803d; border-top: 1.5px dashed #86efac; padding-top: 8px; margin-top: 8px;">
              <span>Amount Paid Today:</span>
              <span style="min-width: 80px;">₹${payment.amountPaidToday.toLocaleString('en-IN')}</span>
            </div>
            ${payment.remainingDue > 0 ? `
              <div style="color: #dc2626; font-size: 12px; font-weight: 700; margin-top: 6px;">
                Remaining Balance Due: ₹${payment.remainingDue.toLocaleString('en-IN')}
              </div>
            ` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <div style="font-size: 11px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0;">• Thank you for visiting C-CURE Physiotherapy & Rehab Clinic.</p>
              <p style="margin: 2px 0 0 0;">• Official computer-generated payment receipt.</p>
            </div>
            <div style="text-align: right;">
              <div style="width: 140px; border-bottom: 1.5px dashed #94a3b8; margin-bottom: 6px; margin-left: auto;"></div>
              <div style="font-size: 12px; font-weight: 700; color: #0f172a;">Sanatan Manna</div>
              <div style="font-size: 10px; color: #64748b;">Physiotherapist</div>
            </div>
          </div>
        </div>
      </div>
    `

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    container.style.width = '750px'
    container.innerHTML = receiptContent
    document.body.appendChild(container)

    toast.loading('Downloading PDF...', { id: 'pdf-toast' })

    try {
      if (!(window as any).html2pdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      const opt = {
        margin:       [6, 6, 6, 6],
        filename:     `${filename}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      const originalConsoleError = console.error
      console.error = (...args: any[]) => {
        if (typeof args[0] === 'string' && args[0].includes('unsupported color function')) {
          return
        }
        originalConsoleError.apply(console, args)
      }

      try {
        await (window as any).html2pdf().set(opt).from(container).save()
      } finally {
        console.error = originalConsoleError
      }

      toast.success('PDF downloaded!', { id: 'pdf-toast' })
    } catch (err) {
      console.error('PDF download error:', err)
      // Fallback: direct download of receipt file
      const blob = new Blob([`<!DOCTYPE html><html><body>${receiptContent}</body></html>`], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Receipt file downloaded!', { id: 'pdf-toast' })
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container)
      }
      setOpen(false)
    }
  }

  return (
    <div className="relative inline-flex items-center gap-1">
      {/* Primary Download PDF Button */}
      <button
        onClick={handleDownloadPDF}
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
                onClick={handleDownloadPDF}
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


