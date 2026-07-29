'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings as SettingsIcon, KeyRound, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from 'react-hot-toast'
import { updateAdminPassword } from '@/app/actions/settings'

export default function SettingsForm() {
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [practiceLoading, setPracticeLoading] = useState(false)

  // Practice state
  const [physioName, setPhysioName] = useState('Dr. Sonatan')
  const [clinicName, setClinicName] = useState('Sonatan Physiotherapy & Rehabilitation Center')
  const [phone, setPhone] = useState('+91 9876543210')
  const [defaultFee, setDefaultFee] = useState('500')

  const handleSavePractice = (e: React.FormEvent) => {
    e.preventDefault()
    setPracticeLoading(true)
    setTimeout(() => {
      setPracticeLoading(false)
      toast.success('Practice settings updated successfully!')
    }, 500)
  }

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordLoading(true)
    const formData = new FormData(e.currentTarget)

    const result = await updateAdminPassword(formData)
    setPasswordLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.success) {
      toast.success(result.message || 'Password updated successfully!')
      e.currentTarget.reset()
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Practice & Clinic Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePractice} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="physioName">Physiotherapist Name</Label>
                <Input 
                  id="physioName" 
                  value={physioName} 
                  onChange={(e) => setPhysioName(e.target.value)} 
                  placeholder="Dr. Your Name" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input 
                  id="clinicName" 
                  value={clinicName} 
                  onChange={(e) => setClinicName(e.target.value)} 
                  placeholder="Your Clinic Name" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+91 9876543210" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultFee">Default Consultation Fee (₹)</Label>
                <Input 
                  id="defaultFee" 
                  type="number" 
                  value={defaultFee} 
                  onChange={(e) => setDefaultFee(e.target.value)} 
                  placeholder="500" 
                />
              </div>
            </div>
            <Separator className="my-2" />
            <Button type="submit" disabled={practiceLoading}>
              {practiceLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Change Admin Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
