'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markVisitDone } from '@/app/actions/patients'
import { toast } from 'react-hot-toast'

interface QueuePatient {
  id: string
  patientId: string
  name: string
  phone: string
  disease?: string | null
}

interface VisitQueueProps {
  initialPatients: QueuePatient[]
}

export function VisitQueue({ initialPatients }: VisitQueueProps) {
  const router = useRouter()
  const [patients, setPatients] = useState(initialPatients)
  const [isPending, startTransition] = useTransition()

  // Keep state in sync with server components updates
  useEffect(() => {
    // eslint-disable-next-line
    setPatients(initialPatients)
  }, [initialPatients])

  const handleMarkDone = async (id: string, name: string) => {
    // Optimistic update: filter out the completed patient
    setPatients(prev => prev.filter(p => p.id !== id))
    toast.success(`Visit completed for ${name}!`, {
      icon: '✅',
      duration: 2500,
    })

    startTransition(async () => {
      const res = await markVisitDone(id)
      if (res.error) {
        toast.error(res.error)
        // Revert on failure
        setPatients(initialPatients)
      } else {
        router.refresh()
      }
    })
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed rounded-xl text-muted-foreground text-center bg-card">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm font-medium">No visits queued for today</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Mark patients &apos;To Visit&apos; in the Patient Directory</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
      {patients.map(patient => (
        <div key={patient.id} className="flex items-center justify-between p-3 rounded-xl border bg-card/50 hover:bg-muted/40 transition-colors">
          <div className="min-w-0 flex-1 mr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{patient.name}</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-mono flex-shrink-0">{patient.patientId}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {patient.disease || 'General Condition'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-green-500/30 hover:border-green-500 hover:bg-green-500/10 text-green-600 dark:text-green-400 gap-1.5 flex-shrink-0 shadow-xs"
            disabled={isPending}
            onClick={() => handleMarkDone(patient.id, patient.name)}
          >
            <Check className="h-4 w-4" /> Done
          </Button>
        </div>
      ))}
    </div>
  )
}
