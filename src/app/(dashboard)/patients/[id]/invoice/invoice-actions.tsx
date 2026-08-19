/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Printer, MessageCircle, Copy, Check, ArrowLeft, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { downloadPatientInvoicePDF } from '@/lib/pdf-generator'
import { toast } from 'react-hot-toast'

interface InvoiceActionsProps {
  patient: any
  profile?: any
  visitsCount?: number
}

export function InvoiceActions({ patient, profile, visitsCount = 0 }: InvoiceActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const handleDownload = async () => {
    toast.loading('Generating invoice PDF...', { id: 'inv-pdf' })
    try {
      await downloadPatientInvoicePDF(patient, profile, visitsCount)
      toast.success('Invoice PDF downloaded!', { id: 'inv-pdf' })
    } catch (err) {
      console.error(err)
      toast.error('Failed to download invoice PDF', { id: 'inv-pdf' })
    }
  }

  const handlePrint = () => window.print()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleWhatsApp = () => {
    const text = `Invoice for patient *${patient.name}*. View here: ${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-8 pb-4 sm:pb-6 border-b">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Patient
      </button>
      <div className="grid grid-cols-2 xs:flex xs:flex-wrap items-center gap-2 w-full sm:w-auto">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-muted border border-border hover:bg-muted/80 transition-all"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>
    </div>
  )
}
