'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePatient } from '@/app/actions/patients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface EditPatientFormProps {
  patient: {
    id: string
    patientId: string
    name: string
    phone: string
    email?: string | null
    alternatePhone?: string | null
    age?: number | null
    gender?: string | null
    disease?: string | null
    address?: string | null
    status: string
    aadhaar?: string | null
    chiefComplaint?: string | null
    diagnosis?: string | null
    medicalHistory?: string | null
    currentMedication?: string | null
    emerContactName?: string | null
    emerContactPhone?: string | null
  }
}

export default function EditPatientForm({ patient }: EditPatientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gender, setGender] = useState(patient.gender || 'Male')
  const [status, setStatus] = useState(patient.status || 'Active')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    // Manually add Select values since base-ui portals them outside the form
    formData.set('gender', gender)
    formData.set('status', status)
    
    const result = await updatePatient(patient.id, formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (result.success) {
      toast.success('Patient updated successfully!')
      router.push(`/patients/${patient.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal & Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" required defaultValue={patient.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" name="phone" required defaultValue={patient.phone} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" defaultValue={patient.email || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternatePhone">Alternate Phone / WhatsApp</Label>
              <Input id="alternatePhone" name="alternatePhone" defaultValue={patient.alternatePhone || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" defaultValue={patient.age ?? ''} />
            </div>
            
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v) => v && setGender(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhaar">Aadhaar / ID Number</Label>
              <Input id="aadhaar" name="aadhaar" defaultValue={patient.aadhaar || ''} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={patient.address || ''} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical & Condition Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="disease">Primary Condition / Disease</Label>
              <Input id="disease" name="disease" defaultValue={patient.disease || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Chief Complaint</Label>
              <Textarea id="chiefComplaint" name="chiefComplaint" defaultValue={patient.chiefComplaint || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis Details</Label>
              <Textarea id="diagnosis" name="diagnosis" defaultValue={patient.diagnosis || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Past Medical History</Label>
              <Textarea id="medicalHistory" name="medicalHistory" defaultValue={patient.medicalHistory || ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentMedication">Current Medication</Label>
              <Textarea id="currentMedication" name="currentMedication" defaultValue={patient.currentMedication || ''} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emerContactName">Contact Person Name</Label>
              <Input id="emerContactName" name="emerContactName" defaultValue={patient.emerContactName || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emerContactPhone">Contact Person Phone</Label>
              <Input id="emerContactPhone" name="emerContactPhone" defaultValue={patient.emerContactPhone || ''} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving Changes...' : 'Update Patient'}
        </Button>
      </div>
    </form>
  )
}
