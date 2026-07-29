'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deletePatient } from '@/app/actions/patients'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DeletePatientButtonProps {
  patientId: string
  patientName: string
}

export function DeletePatientButton({ patientId, patientName }: DeletePatientButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const result = await deletePatient(patientId)
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success(`Patient ${patientName} deleted successfully`)
      router.push('/patients')
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 p-2 rounded-lg text-xs">
        <span className="font-medium text-destructive">Delete {patientName}?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? 'Deleting...' : 'Confirm'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)} disabled={loading}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => setShowConfirm(true)}>
      <Trash2 className="h-4 w-4 mr-1.5" /> Delete
    </Button>
  )
}
