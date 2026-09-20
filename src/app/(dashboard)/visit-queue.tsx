'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle2, User } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-border/80 rounded-2xl text-muted-foreground text-center bg-card/40">
        <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="text-sm font-bold text-foreground">No visits queued for today</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          All active patients are marked complete or none are in queue. Toggle &apos;To Visit&apos; in the Patients directory anytime.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
      {patients.map(patient => (
        <div 
          key={patient.id} 
          className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/40 transition-all duration-200 shadow-xs hover:shadow-sm"
        >
          <div className="min-w-0 flex-1 mr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm text-foreground truncate">{patient.name}</span>
              <span className="text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-mono flex-shrink-0 tabular-num">
                {patient.patientId}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate flex items-center gap-1.5">
              <User className="h-3 w-3 text-muted-foreground/60" />
              {patient.disease || 'General Physiotherapy Treatment'}
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 flex-shrink-0 rounded-xl shadow-xs active-press"
            disabled={isPending}
            onClick={() => handleMarkDone(patient.id, patient.name)}
          >
            <Check className="h-3.5 w-3.5" /> Done
          </Button>
        </div>
      ))}
    </div>
  )
}
