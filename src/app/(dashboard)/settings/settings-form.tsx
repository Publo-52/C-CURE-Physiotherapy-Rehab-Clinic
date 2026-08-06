'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { KeyRound, User, Building2, Phone, MapPin, Clock, IndianRupee, FileText, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'react-hot-toast'
import { updateAdminPassword } from '@/app/actions/settings'
import { updateClinicProfile } from '@/app/actions/profile'
import { logout } from '@/app/actions/auth'

interface Profile {
  practitionerName: string
  clinicName: string
  phone: string
  email: string
  address: string
  about?: string | null
  workingHours: string
  defaultFee?: number
}

interface SettingsFormProps {
  profile: Profile
}

export default function SettingsForm({ profile }: SettingsFormProps) {
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  // Profile state — seeded with live DB values
  const [practitionerName, setPractitionerName] = useState(profile.practitionerName)
  const [clinicName, setClinicName] = useState(profile.clinicName)
  const [phone, setPhone] = useState(profile.phone)
  const [email, setEmail] = useState(profile.email || 'sanatan.manna28072015@gmail.com')
  const [address, setAddress] = useState(profile.address)
  const [about, setAbout] = useState(profile.about || '')
  const [workingHours, setWorkingHours] = useState(profile.workingHours)

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateClinicProfile(formData)
    setProfileLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Profile updated successfully!')
    }
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

  const handleLogout = async () => {
    setLogoutLoading(true)
    await logout()
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* === Practitioner & Clinic Profile === */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Practitioner &amp; Clinic Profile
          </CardTitle>
          <CardDescription>
            These details appear in the sidebar, invoices, and patient-facing communications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-5">

            {/* Practitioner */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Practitioner Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="practitionerName">Full Name *</Label>
                  <Input
                    id="practitionerName"
                    name="practitionerName"
                    value={practitionerName}
                    onChange={(e) => setPractitionerName(e.target.value)}
                    placeholder="Sanatan Manna"
                    required
                    className="font-semibold"
                  />
                  <p className="text-[10px] text-muted-foreground">Do not include titles like Dr. unless applicable.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Contact Phone *</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="7942688985"
                    required
                    className="font-semibold"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sanatan.manna28072015@gmail.com"
                    required
                    className="font-semibold"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Clinic Details */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Clinic Details
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name *</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="C-CURE Physiotherapy & Rehab Clinic"
                    required
                    className="font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Clinic Address</span>
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Moyna Hospital, More Moyna, Tamluk, Moyna, Midnapore-721629, West Bengal"
                    rows={2}
                    className="font-semibold resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingHours">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Working Hours</span>
                  </Label>
                  <Input
                    id="workingHours"
                    name="workingHours"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="Open 24 Hours — Monday to Sunday"
                    className="font-semibold"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* About / Bio */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> About the Clinic
              </p>
              <div className="space-y-2">
                <Label htmlFor="about">Clinic Description &amp; History</Label>
                <Textarea
                  id="about"
                  name="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Write a brief description of your clinic..."
                  rows={5}
                  className="font-semibold"
                />
              </div>
            </div>

            <Button type="submit" disabled={profileLoading} className="font-bold">
              {profileLoading ? 'Saving Profile...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* === Change Password === */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" />
            Change Admin Password
          </CardTitle>
          <CardDescription>
            Update your admin login password. Choose a strong password of at least 6 characters.
          </CardDescription>
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
            <Button type="submit" disabled={passwordLoading} className="font-bold">
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* === Logout (Mobile Only) === */}
      <Card className="shadow-sm md:hidden border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <LogOut className="h-5 w-5" />
            Logout
          </CardTitle>
          <CardDescription>
            Sign out of your account on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            type="button"
            variant="destructive" 
            onClick={handleLogout} 
            disabled={logoutLoading}
            className="w-full font-bold"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {logoutLoading ? 'Logging out...' : 'Logout Now'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
