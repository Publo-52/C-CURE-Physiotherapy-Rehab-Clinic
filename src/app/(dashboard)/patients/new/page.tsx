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
  perVisitFee: z.string().optional(),
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
      emerContactName: '', emerContactPhone: '',
      perVisitFee: '500',
    },
    mode: 'onChange'
  })

  // Watch all values for auto-save
  // eslint-disable-next-line react-hooks/incompatible-library
  const formValues = watch()

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        reset(parsed)
        toast.success('Restored auto-saved draft')
      } catch {
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
                <Input id="name" placeholder="Enter patient full name" className={errors.name ? 'border-destructive' : ''} {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="Enter 10-digit mobile number" className={errors.phone ? 'border-destructive' : ''} {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="Enter email address" className={errors.email ? 'border-destructive' : ''} {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone / WhatsApp</Label>
                <Input id="alternatePhone" placeholder="Enter alternate phone / WhatsApp number" {...register('alternatePhone')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" placeholder="Enter age in years" className={errors.age ? 'border-destructive' : ''} {...register('age')} />
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
                <Input id="aadhaar" placeholder="Enter 12-digit Aadhaar number" {...register('aadhaar')} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Enter full address (village / street, post, district, pin code)" {...register('address')} />
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
                <Input id="disease" placeholder="Enter primary condition / disease" className={errors.disease ? 'border-destructive' : ''} {...register('disease')} />
                {errors.disease && <p className="text-xs text-destructive">{errors.disease.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <Textarea id="chiefComplaint" placeholder="Enter chief complaints, pain area, duration..." {...register('chiefComplaint')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis Details</Label>
                <Textarea id="diagnosis" placeholder="Enter diagnosis details..." {...register('diagnosis')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Past Medical History</Label>
                <Textarea id="medicalHistory" placeholder="Enter past medical history, prior surgeries, chronic illness..." {...register('medicalHistory')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentMedication">Current Medication</Label>
                <Textarea id="currentMedication" placeholder="Enter ongoing medicines, painkillers, supplements..." {...register('currentMedication')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fees & Billing Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="perVisitFee">Per Visit Fee (₹)</Label>
              <Input
                id="perVisitFee"
                type="number"
                min="0"
                placeholder="e.g. 500"
                {...register('perVisitFee')}
              />
              <p className="text-xs text-muted-foreground">
                Whenever you tick this patient in the visit schedule, this fee will automatically be added to their bill. If unticked, it will be removed.
              </p>
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
                <Input id="emerContactName" placeholder="Enter emergency contact person name" {...register('emerContactName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emerContactPhone">Contact Person Phone</Label>
                <Input id="emerContactPhone" placeholder="Enter emergency contact phone number" {...register('emerContactPhone')} />
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
