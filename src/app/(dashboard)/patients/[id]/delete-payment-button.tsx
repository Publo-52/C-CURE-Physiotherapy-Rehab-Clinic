'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePayment } from '@/app/actions/payments'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DeletePaymentButtonProps {
  paymentId: string
  invoiceNumber: string
  compact?: boolean
}

export function DeletePaymentButton({ paymentId, invoiceNumber, compact = false }: DeletePaymentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    const res = await deletePayment(paymentId)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Invoice ${invoiceNumber} deleted successfully!`)
      router.refresh()
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={handleDelete}
      title="Delete Payment Invoice"
      className={compact ? "h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10" : "text-destructive hover:bg-destructive/10 text-xs gap-1"}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {!compact && 'Delete'}
    </Button>
  )
}
