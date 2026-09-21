'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteVisit } from '@/app/actions/visits'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DeleteVisitButtonProps {
  visitId: string
  visitNumber: number
  compact?: boolean
}

export function DeleteVisitButton({ visitId, visitNumber, compact = false }: DeleteVisitButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete Visit #${visitNumber}? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    const res = await deleteVisit(visitId)
    setLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Visit #${visitNumber} deleted successfully!`)
      router.refresh()
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={handleDelete}
      title="Delete Visit"
      className={compact ? "h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10" : "text-destructive hover:bg-destructive/10 text-xs gap-1"}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {!compact && 'Delete'}
    </Button>
  )
}
