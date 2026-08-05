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
    <div className="print:hidden flex items-center justify-between flex-wrap gap-3 mb-8 pb-6 border-b">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Patient
      </button>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20 transition-all"
        >
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp
        </button>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-muted border border-border hover:bg-muted/80 transition-all"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Link Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>
    </div>
  )
}
