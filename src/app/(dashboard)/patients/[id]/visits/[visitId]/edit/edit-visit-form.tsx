'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateVisit } from '@/app/actions/visits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface EditVisitFormProps {
  patient: {
    id: string
    name: string
    patientId: string
  }
  visit: {
    id: string
    visitNumber: number
    date: Date
    type: string
    duration: number | null
    painBefore: number | null
    painAfter: number | null
    treatmentGiven: string | null
    exerciseGiven: string | null
    notes: string | null
  }
}

export function EditVisitForm({ patient, visit }: EditVisitFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [visitType, setVisitType] = useState(visit.type || 'Clinic Visit')

  const defaultVisitDate = new Date(visit.date).toISOString().slice(0, 16)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('type', visitType)

    const result = await updateVisit(visit.id, formData)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (result.success) {
      toast.success(`Visit #${visit.visitNumber} updated successfully!`)
      router.push(`/patients/${patient.id}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Visit #{visit.visitNumber}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Patient: <span className="font-semibold text-foreground">{patient.name}</span> ({patient.patientId})
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Visit Date & Time *</Label>
                <Input id="date" name="date" type="datetime-local" required defaultValue={defaultVisitDate} />
              </div>

              <div className="space-y-2">
                <Label>Visit Type *</Label>
                <Select value={visitType} onValueChange={(v) => v && setVisitType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clinic Visit">Clinic Visit</SelectItem>
                    <SelectItem value="Home Visit">Home Visit</SelectItem>
                    <SelectItem value="Online Consultation">Online Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" defaultValue={visit.duration ?? 30} />
              </div>

              <div className="space-y-2 flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="painBefore">Pain Scale (Before) /10</Label>
                  <Input id="painBefore" name="painBefore" type="number" min="0" max="10" defaultValue={visit.painBefore ?? ''} />
                </div>
                <div className="flex-1">
                  <Label htmlFor="painAfter">Pain Scale (After) /10</Label>
                  <Input id="painAfter" name="painAfter" type="number" min="0" max="10" defaultValue={visit.painAfter ?? ''} />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="treatmentGiven">Treatment Given</Label>
                <Textarea id="treatmentGiven" name="treatmentGiven" defaultValue={visit.treatmentGiven ?? ''} placeholder="Details of manual therapy, electrotherapy etc..." />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="exerciseGiven">Exercise Given</Label>
                <Textarea id="exerciseGiven" name="exerciseGiven" defaultValue={visit.exerciseGiven ?? ''} placeholder="Home exercise program assigned..." />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Physiotherapist Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={visit.notes ?? ''} placeholder="General observations, next steps..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
