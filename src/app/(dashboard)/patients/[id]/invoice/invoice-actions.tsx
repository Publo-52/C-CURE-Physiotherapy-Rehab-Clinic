'use client'

import { useState } from 'react'
import { Printer, MessageCircle, Copy, Check, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface InvoiceActionsProps {
  patientId: string
  patientName: string
}

export function InvoiceActions({ patientId, patientName }: InvoiceActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const handlePrint = () => window.print()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleWhatsApp = () => {
    const text = `Invoice for patient *${patientName}*. View here: ${window.location.href}`
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
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
      </div>
    </div>
  )
}
