'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPatient } from '@/app/actions/patients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const patientSchema = z.object({
  name: z.string().min(2, 'Patient Name required (min 2 characters)'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Phone Number invalid (10-15 digits required)'),
  email: z.string().email('Invalid Email').or(z.literal('')),
  alternatePhone: z.string().optional(),
  age: z.string().refine(val => !val || (parseInt(val) >= 1 && parseInt(val) <= 120), 'Age must be between 1 and 120').optional(),
  gender: z.string(),
  status: z.string(),
  aadhaar: z.string().optional(),
  address: z.string().optional(),
  disease: z.string().min(2, 'Primary Condition required'),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentMedication: z.string().optional(),
  emerContactName: z.string().optional(),
  emerContactPhone: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientSchema>

const DRAFT_KEY = 'patient_form_draft'

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors }
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '', phone: '', email: '', alternatePhone: '', age: '',
      gender: 'Male', status: 'Active', aadhaar: '', address: '',
      disease: '', chiefComplaint: '', diagnosis: '',
      medicalHistory: '', currentMedication: '',
      emerContactName: '', emerContactPhone: ''
    },
    mode: 'onChange'
  })

  // Watch all values for auto-save
  const formValues = watch()

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        reset(parsed)
        toast.success('Restored auto-saved draft')
      } catch (e) {
        console.error('Failed to parse draft')
      }
    }
    setDraftRestored(true)
  }, [reset])

  // Save draft on change (debounced)
  useEffect(() => {
    if (!draftRestored) return
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues))
    }, 1000)
    return () => clearTimeout(timer)
  }, [formValues, draftRestored])

  const onSubmit = async (data: PatientFormValues) => {
    setLoading(true)
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value)
    })
    
    const result = await createPatient(formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (result.success) {
      toast.success('Patient created successfully!')
      localStorage.removeItem(DRAFT_KEY) // Clear draft on success
      router.push(`/patients/${result.patientId}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">New Patient</h1>
        <Button variant="outline" onClick={() => router.back()} type="button">Cancel</Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal & Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="Enter patient full name (e.g., Rajesh Kumar)" className={errors.name ? 'border-destructive' : ''} {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="10-digit mobile number (e.g., 9876543210)" className={errors.phone ? 'border-destructive' : ''} {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="Optional email address (e.g., rajesh@gmail.com)" className={errors.email ? 'border-destructive' : ''} {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone / WhatsApp</Label>
                <Input id="alternatePhone" placeholder="Alternate mobile or WhatsApp number" {...register('alternatePhone')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" placeholder="Age in years (e.g., 45)" className={errors.age ? 'border-destructive' : ''} {...register('age')} />
                {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Gender</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar / ID Number</Label>
                <Input id="aadhaar" placeholder="12-digit Aadhaar number" {...register('aadhaar')} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Village / Street, Post, District, Pin Code" {...register('address')} />
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
                <Input id="disease" placeholder="e.g., Frozen Shoulder, Lumbar Spondylosis, Knee Osteoarthritis" className={errors.disease ? 'border-destructive' : ''} {...register('disease')} />
                {errors.disease && <p className="text-xs text-destructive">{errors.disease.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <Textarea id="chiefComplaint" placeholder="Describe main complaints, pain area, duration..." {...register('chiefComplaint')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis Details</Label>
                <Textarea id="diagnosis" placeholder="Physician / clinical diagnosis assessment..." {...register('diagnosis')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Past Medical History</Label>
                <Textarea id="medicalHistory" placeholder="Prior surgeries, chronic illness, previous physio treatment..." {...register('medicalHistory')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentMedication">Current Medication</Label>
                <Textarea id="currentMedication" placeholder="Ongoing medicines, pain killers, supplements..." {...register('currentMedication')} />
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
                <Input id="emerContactName" placeholder="Spouse / Parent / Relative name" {...register('emerContactName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emerContactPhone">Contact Person Phone</Label>
                <Input id="emerContactPhone" placeholder="Emergency contact mobile number" {...register('emerContactPhone')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 sticky bottom-4 bg-background/80 p-4 rounded-xl border backdrop-blur-sm z-10 shadow-lg">
          <Button type="button" variant="outline" onClick={() => { localStorage.removeItem(DRAFT_KEY); router.back() }}>Discard Draft & Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Patient'}
          </Button>
        </div>
      </form>
    </div>
  )
}
