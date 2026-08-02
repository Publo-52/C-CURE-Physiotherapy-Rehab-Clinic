'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createVisit } from '@/app/actions/visits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function NewVisitPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string
  const [loading, setLoading] = useState(false)
  const [visitType, setVisitType] = useState('Clinic Visit')
  const [defaultVisitDate] = useState(() => new Date().toISOString().slice(0, 16))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    // Manually add Select value since base-ui portals it outside the form
    formData.set('type', visitType)
    
    const result = await createVisit(patientId, formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (result.success) {
      toast.success('Visit recorded successfully!')
      router.push(`/patients/${patientId}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Record Visit</h1>
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
                <Input id="duration" name="duration" type="number" defaultValue={30} />
              </div>
              
              <div className="space-y-2 flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="painBefore">Pain Scale (Before) /10</Label>
                  <Input id="painBefore" name="painBefore" type="number" min="0" max="10" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="painAfter">Pain Scale (After) /10</Label>
                  <Input id="painAfter" name="painAfter" type="number" min="0" max="10" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="treatmentGiven">Treatment Given</Label>
                <Textarea id="treatmentGiven" name="treatmentGiven" placeholder="Details of manual therapy, electrotherapy etc..." />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="exerciseGiven">Exercise Given</Label>
                <Textarea id="exerciseGiven" name="exerciseGiven" placeholder="Home exercise program assigned..." />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Physiotherapist Notes</Label>
                <Textarea id="notes" name="notes" placeholder="General observations, next steps..." />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Visit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
