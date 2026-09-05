'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CalendarPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { togglePresentStatus } from '@/app/actions/patients'
import { toast } from 'react-hot-toast'

interface PatientVisitToggleProps {
  patientId: string
  patientName: string
  presentStatus: boolean
  visitDoneToday: boolean
  perVisitFee: number
}

export function PatientVisitToggle({
  patientId,
  patientName,
  presentStatus: initialPresent,
  visitDoneToday,
  perVisitFee,
}: PatientVisitToggleProps) {
  const router = useRouter()
  const [isPresent, setIsPresent] = useState(initialPresent)
  const [isPending, startTransition] = useTransition()

  const handleToggle = async () => {
    const nextStatus = !isPresent
    setIsPresent(nextStatus)

    toast(
      nextStatus
        ? `Scheduled visit today for ${patientName} (${perVisitFee > 0 ? `+₹${perVisitFee} added to bill` : 'Fee: ₹0'})`
        : `Removed ${patientName} from visits (${perVisitFee > 0 ? `-₹${perVisitFee} removed from bill` : 'Fee: ₹0'})`,
      {
        icon: nextStatus ? '📅' : '🗑️',
        duration: 2500,
      }
    )

    startTransition(async () => {
      const res = await togglePresentStatus(patientId, nextStatus)
      if (res.error) {
        toast.error(res.error)
        setIsPresent(initialPresent)
      } else {
        router.refresh()
      }
    })
  }

  if (visitDoneToday) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-full sm:w-auto bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 font-semibold cursor-default"
      >
        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Visit Done Today
      </Button>
    )
  }

  return (
    <Button
      variant={isPresent ? "default" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={handleToggle}
      className={`w-full sm:w-auto font-semibold active:scale-95 transition-all ${
        isPresent 
          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" 
          : "border-primary/40 hover:border-primary text-foreground hover:bg-primary/5"
      }`}
      title={isPresent ? "Click to uncheck/remove from today's visits" : "Click to schedule visit today and add fee"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      ) : isPresent ? (
        <CheckCircle2 className="h-4 w-4 mr-1.5" />
      ) : (
        <CalendarPlus className="h-4 w-4 mr-1.5 text-primary" />
      )}
      {isPresent ? "Visit Scheduled (Fee Added)" : `Schedule Visit Today ${perVisitFee > 0 ? `(+₹${perVisitFee})` : ''}`}
    </Button>
  )
}
