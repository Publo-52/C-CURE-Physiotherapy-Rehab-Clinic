'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Search, Share2, Copy, Check, MessageCircle, Download, MoreVertical, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { DeletePaymentButton } from '@/app/(dashboard)/patients/[id]/delete-payment-button'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { sanitizeText } from '@/lib/pdf-generator'

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
      } catch {
        // User cancelled
      }
      setOpen(false)
    } else {
      handleCopy()
    }
  }

  const handleDownloadPDF = async () => {
    toast.loading('Generating PDF receipt...', { id: 'pdf-toast' })
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595.28, 841.89])
      const { width, height } = page.getSize()

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const primaryBlue = rgb(0.01, 0.52, 0.78)
      const darkSlate = rgb(0.06, 0.09, 0.16)
      const textMuted = rgb(0.39, 0.45, 0.55)
      const lightBg = rgb(0.97, 0.98, 0.99)
      const greenText = rgb(0.09, 0.5, 0.24)
      const redText = rgb(0.86, 0.15, 0.15)

      let y = height - 40

      // Header Banner
      page.drawRectangle({
        x: 40,
        y: y - 65,
        width: width - 80,
        height: 65,
        color: primaryBlue,
      })

      page.drawText('C-CURE PHYSIOTHERAPY & REHAB CLINIC', {
        x: 55,
        y: y - 28,
        size: 15,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      })

      page.drawText('Sanatan Manna (Physiotherapist)', {
        x: 55,
        y: y - 46,
        size: 10,
        font: helveticaBold,
        color: rgb(0.73, 0.9, 0.99),
      })

      page.drawText('Ph: 7942688985', {
        x: width - 170,
        y: y - 28,
        size: 9,
        font: helveticaFont,
        color: rgb(0.88, 0.95, 1),
      })

      page.drawText('Moyna, Midnapore, WB', {
        x: width - 170,
        y: y - 44,
        size: 9,
        font: helveticaFont,
        color: rgb(0.88, 0.95, 1),
      })

      y -= 65

      // Meta Bar
      page.drawRectangle({
        x: 40,
        y: y - 42,
        width: width - 80,
        height: 42,
        color: lightBg,
        borderColor: rgb(0.89, 0.91, 0.94),
        borderWidth: 1,
      })

      page.drawText('INVOICE NUMBER', { x: 55, y: y - 18, size: 7, font: helveticaBold, color: textMuted })
      page.drawText(sanitizeText(payment.invoiceNumber), { x: 55, y: y - 32, size: 10, font: helveticaBold, color: darkSlate })

      page.drawText('DATE ISSUED', { x: 200, y: y - 18, size: 7, font: helveticaBold, color: textMuted })
      page.drawText(sanitizeText(dateStr), { x: 200, y: y - 32, size: 10, font: helveticaFont, color: darkSlate })

      page.drawText('PAYMENT MODE', { x: 330, y: y - 18, size: 7, font: helveticaBold, color: textMuted })
      page.drawText(sanitizeText(payment.paymentMode), { x: 330, y: y - 32, size: 10, font: helveticaFont, color: darkSlate })

      page.drawText(sanitizeText(`STATUS: ${payment.status.toUpperCase()}`), {
        x: width - 170,
        y: y - 26,
        size: 9,
        font: helveticaBold,
        color: payment.status === 'Paid' ? greenText : redText,
      })

      y -= 58

      // Info Cards
      const cardW = (width - 95) / 2
      // Patient Box
      page.drawRectangle({
        x: 40,
        y: y - 60,
        width: cardW,
        height: 60,
        color: lightBg,
        borderColor: rgb(0.89, 0.91, 0.94),
        borderWidth: 1,
      })
      page.drawText('PATIENT INFORMATION', { x: 50, y: y - 16, size: 8, font: helveticaBold, color: primaryBlue })
      page.drawText(sanitizeText(`Name: ${payment.patient.name}`), { x: 50, y: y - 34, size: 9, font: helveticaFont, color: darkSlate })
      page.drawText(sanitizeText(`Patient ID: ${payment.patient.patientId}`), { x: 50, y: y - 48, size: 9, font: helveticaFont, color: darkSlate })

      // Practitioner Box
      page.drawRectangle({
        x: 40 + cardW + 15,
        y: y - 60,
        width: cardW,
        height: 60,
        color: lightBg,
        borderColor: rgb(0.89, 0.91, 0.94),
        borderWidth: 1,
      })
      page.drawText('CLINIC PRACTITIONER', { x: 40 + cardW + 25, y: y - 16, size: 8, font: helveticaBold, color: primaryBlue })
      page.drawText('Practitioner: Sanatan Manna', { x: 40 + cardW + 25, y: y - 34, size: 9, font: helveticaFont, color: darkSlate })
      page.drawText('Designation: Physiotherapist', { x: 40 + cardW + 25, y: y - 48, size: 9, font: helveticaFont, color: darkSlate })

      y -= 80

      // Financial Table
      page.drawRectangle({
        x: 40,
        y: y - 65,
        width: width - 80,
        height: 65,
        borderColor: rgb(0.89, 0.91, 0.94),
        borderWidth: 1,
      })
      page.drawRectangle({
        x: 40,
        y: y - 22,
        width: width - 80,
        height: 22,
        color: rgb(0.94, 0.96, 0.98),
      })
      page.drawText('DESCRIPTION', { x: 50, y: y - 15, size: 7, font: helveticaBold, color: textMuted })
      page.drawText('TOTAL BILL', { x: 280, y: y - 15, size: 7, font: helveticaBold, color: textMuted })
      page.drawText('PAID TODAY', { x: 370, y: y - 15, size: 7, font: helveticaBold, color: textMuted })
      page.drawText('CURRENT DUE', { x: 460, y: y - 15, size: 7, font: helveticaBold, color: textMuted })

      page.drawText('Physiotherapy Treatment / Consultation Fee', { x: 50, y: y - 45, size: 9, font: helveticaFont, color: darkSlate })
      page.drawText(sanitizeText(`Rs. ${payment.totalBill.toLocaleString('en-IN')}`), { x: 280, y: y - 45, size: 9, font: helveticaFont, color: darkSlate })
      page.drawText(sanitizeText(`Rs. ${payment.amountPaidToday.toLocaleString('en-IN')}`), { x: 370, y: y - 45, size: 9, font: helveticaBold, color: greenText })
      page.drawText(sanitizeText(`Rs. ${payment.remainingDue.toLocaleString('en-IN')}`), { x: 460, y: y - 45, size: 9, font: helveticaBold, color: payment.remainingDue > 0 ? redText : greenText })

      y -= 85

      // Summary Box
      page.drawRectangle({
        x: 40,
        y: y - 55,
        width: width - 80,
        height: 55,
        color: rgb(0.94, 0.99, 0.95),
        borderColor: rgb(0.73, 0.97, 0.82),
        borderWidth: 1,
      })

      page.drawText(sanitizeText(`Total Bill Amount:  Rs. ${payment.totalBill.toLocaleString('en-IN')}`), { x: width - 250, y: y - 18, size: 9, font: helveticaFont, color: darkSlate })
      page.drawText(sanitizeText(`Amount Paid Today:  Rs. ${payment.amountPaidToday.toLocaleString('en-IN')}`), { x: width - 250, y: y - 34, size: 10, font: helveticaBold, color: greenText })
      page.drawText(
        sanitizeText(`Remaining Balance Due:  Rs. ${payment.remainingDue.toLocaleString('en-IN')} ${payment.remainingDue <= 0 ? '(CLEARED)' : ''}`),
        { x: width - 250, y: y - 48, size: 10, font: helveticaBold, color: payment.remainingDue > 0 ? redText : greenText }
      )

      y -= 75

      // Footer & Signature
      page.drawLine({
        start: { x: 40, y: y },
        end: { x: width - 40, y: y },
        thickness: 1,
        color: rgb(0.89, 0.91, 0.94),
      })

      page.drawText('- Thank you for visiting C-CURE Physiotherapy & Rehab Clinic.', { x: 40, y: y - 18, size: 8, font: helveticaFont, color: textMuted })
      page.drawText('- Official computer-generated payment receipt.', { x: 40, y: y - 30, size: 8, font: helveticaFont, color: textMuted })

      page.drawLine({
        start: { x: width - 180, y: y - 30 },
        end: { x: width - 40, y: y - 30 },
        thickness: 1,
        color: rgb(0.58, 0.64, 0.72),
      })
      page.drawText('Sanatan Manna', { x: width - 145, y: y - 44, size: 10, font: helveticaBold, color: darkSlate })
      page.drawText('Physiotherapist', { x: width - 140, y: y - 56, size: 8, font: helveticaFont, color: textMuted })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Receipt_${payment.invoiceNumber}_${payment.patient.name.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('PDF downloaded!', { id: 'pdf-toast' })
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error('Failed to generate PDF', { id: 'pdf-toast' })
    } finally {
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
          <div className="absolute right-0 top-8 z-50 w-52 bg-card border rounded-xl shadow-lg overflow-hidden animate-modal-pop">
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

                  {/* Mode + Actions */}
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-xs text-muted-foreground">{p.paymentMode}</span>
                    <div className="flex items-center gap-1">
                      <Link href={`/patients/${p.patient.id}/payments/${p.id}/edit`}>
                        <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all" title="Edit Invoice">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <DeletePaymentButton paymentId={p.id} invoiceNumber={p.invoiceNumber} compact />
                      <DownloadDropdown payment={p} />
                    </div>
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
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
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
                        <div className="flex items-center justify-center gap-1">
                          <DownloadDropdown payment={p} />
                          <Link href={`/patients/${p.patient.id}/payments/${p.id}/edit`}>
                            <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all" title="Edit Invoice">
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                          <DeletePaymentButton paymentId={p.id} invoiceNumber={p.invoiceNumber} compact />
                        </div>
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



