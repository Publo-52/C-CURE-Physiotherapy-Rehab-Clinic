'use client'

import { downloadPatientInvoicePDF } from '@/lib/pdf-generator'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface PatientInvoiceButtonProps {
  patient: any
  profile?: any
  visitsCount?: number
}

export function PatientInvoiceButton({ patient, profile, visitsCount = 0 }: PatientInvoiceButtonProps) {
  const handleDownload = async () => {
    toast.loading('Generating invoice PDF...', { id: 'patient-inv-pdf' })
    try {
      await downloadPatientInvoicePDF(patient, profile, visitsCount)
      toast.success('Invoice PDF downloaded!', { id: 'patient-inv-pdf' })
    } catch (err) {
      console.error(err)
      toast.error('Failed to download invoice PDF', { id: 'patient-inv-pdf' })
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        onClick={handleDownload}
        variant="outline"
        size="sm"
        className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-semibold"
      >
        <Download className="h-4 w-4 mr-1.5" /> Download Invoice PDF
      </Button>
      <Link href={`/patients/${patient.id}/invoice`}>
        <Button variant="ghost" size="sm" title="View Full Web Invoice" className="text-xs text-muted-foreground px-2">
          <FileText className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}
