'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPatient } from '@/app/actions/patients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gender, setGender] = useState('Male')
  const [status, setStatus] = useState('Active')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {}
    const name = (formData.get('name') as string)?.trim()
    const phone = (formData.get('phone') as string)?.trim()
    const age = formData.get('age') as string
    const email = (formData.get('email') as string)?.trim()
    const disease = (formData.get('disease') as string)?.trim()

    if (!name || name.length < 2) newErrors.name = 'Full name is required (min 2 characters).'
    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid phone number (10–15 digits).'
    }
    if (age && (parseInt(age) < 1 || parseInt(age) > 120)) {
      newErrors.age = 'Age must be between 1 and 120.'
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.'
    }
    if (!disease || disease.length < 2) {
      newErrors.disease = 'Primary condition/disease is required.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('gender', gender)
    formData.set('status', status)

    if (!validate(formData)) return

    setLoading(true)
    const result = await createPatient(formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (result.success) {
      toast.success('Patient created successfully!')
      router.push(`/patients/${result.patientId}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Patient</h1>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal & Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" required placeholder="John Doe" className={errors.name ? 'border-destructive' : ''} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" required placeholder="+91 9876543210" className={errors.phone ? 'border-destructive' : ''} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="patient@example.com" className={errors.email ? 'border-destructive' : ''} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone / WhatsApp</Label>
                <Input id="alternatePhone" name="alternatePhone" placeholder="+91 9876543211" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" type="number" placeholder="45" className={errors.age ? 'border-destructive' : ''} />
                {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
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
                <Input id="aadhaar" name="aadhaar" placeholder="1234 5678 9012" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="123 Main St, City" />
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
                <Label htmlFor="disease">Primary Condition / Disease *</Label>
                <Input id="disease" name="disease" required placeholder="e.g., Frozen Shoulder, Lumbar Spondylosis" className={errors.disease ? 'border-destructive' : ''} />
                {errors.disease && <p className="text-xs text-destructive">{errors.disease}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <Textarea id="chiefComplaint" name="chiefComplaint" placeholder="Describe symptoms and primary issues..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis Details</Label>
                <Textarea id="diagnosis" name="diagnosis" placeholder="Medical diagnosis from physician or assessment..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Past Medical History</Label>
                <Textarea id="medicalHistory" name="medicalHistory" placeholder="Surgeries, chronic conditions, prior physio..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentMedication">Current Medication</Label>
                <Textarea id="currentMedication" name="currentMedication" placeholder="Prescriptions, pain killers, supplements..." />
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
                <Input id="emerContactName" name="emerContactName" placeholder="Spouse / Relative Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emerContactPhone">Contact Person Phone</Label>
                <Input id="emerContactPhone" name="emerContactPhone" placeholder="+91 9876543210" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Patient'}
          </Button>
        </div>
      </form>
    </div>
  )
}
