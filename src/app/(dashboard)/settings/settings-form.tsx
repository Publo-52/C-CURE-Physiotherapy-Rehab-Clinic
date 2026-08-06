'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { KeyRound, User, Building2, Phone, MapPin, Clock, FileText, LogOut, ShieldCheck, ShieldAlert, Edit, Check, Lock, Smartphone, Laptop, Globe, Trash2, Monitor } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from 'react-hot-toast'
import { updateAdminPassword, updateUserAccount, updateOwnAccount, revokeActiveSession } from '@/app/actions/settings'
import { updateClinicProfile } from '@/app/actions/profile'
import { logout } from '@/app/actions/auth'
import { formatDate } from '@/lib/utils'

interface Profile {
  practitionerName: string
  clinicName: string
  phone: string
  email: string
  address: string
  about?: string | null
  workingHours: string
}

interface ActiveSessionItem {
  id: string
  token: string
  ipAddress?: string | null
  userAgent?: string | null
  deviceType?: string | null
  createdAt: Date | string
  expiresAt: Date | string
}

interface AdminAccount {
  id: string
  name: string
  email: string
  role: string
  lastLogin?: Date | string | null
  sessions?: ActiveSessionItem[]
}

interface SettingsFormProps {
  profile: Profile
  currentAdmin?: {
    id: string
    name: string
    email: string
    role: string
  } | null
  currentSessionToken?: string | null
  accounts?: AdminAccount[]
}

export default function SettingsForm({ profile, currentAdmin, currentSessionToken, accounts = [] }: SettingsFormProps) {
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  
  // Super Admin editing user modal/inline state
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)

  const isSuperAdmin = currentAdmin?.role === 'Super Admin'

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

  const handleUpdateUserAccount = async (targetId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateUserAccount(targetId, formData)
    setEditLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message || 'User updated successfully!')
      setEditingUserId(null)
    }
  }

  const handleRevokeSession = async (sessionId: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to remove access for "${deviceName}"? This device will be logged out immediately.`)) {
      return
    }

    setRevokingSessionId(sessionId)
    const result = await revokeActiveSession(sessionId)
    setRevokingSessionId(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.message || 'Device session removed successfully!')
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    await logout()
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* === Current User Identity Bar === */}
      <div className="p-4 rounded-xl border bg-card/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            {isSuperAdmin ? <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /> : <User className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">{currentAdmin?.name || 'Logged User'}</span>
              <Badge variant={isSuperAdmin ? "default" : "secondary"} className={isSuperAdmin ? "bg-indigo-600 hover:bg-indigo-700" : ""}>
                {currentAdmin?.role || 'Admin'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{currentAdmin?.email}</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5" />
          {isSuperAdmin ? (
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Unlimited Device Logins Allowed</span>
          ) : (
            <span>Device Limit: <strong className="text-foreground">Max 3 Devices</strong></span>
          )}
        </div>
      </div>

      {/* === User Management (Super Admin Controls) === */}
      {isSuperAdmin && (
        <Card className="shadow-sm border-indigo-200 dark:border-indigo-900/40">
          <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-sky-50/50 dark:from-indigo-950/20 dark:to-sky-950/20 border-b">
            <CardTitle className="flex items-center gap-2 text-lg text-indigo-950 dark:text-indigo-100">
              <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              User Account Management (Super Admin Controls)
            </CardTitle>
            <CardDescription>
              As Super Admin, you can edit usernames, emails, roles, and reset passwords for both Admin and Super Admin accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {accounts.map(acc => {
              const isEditing = editingUserId === acc.id
              const accIsSuperAdmin = acc.role === 'Super Admin'
              return (
                <div key={acc.id} className="p-4 rounded-xl border bg-background space-y-3">
                  {!isEditing ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{acc.name}</span>
                          <Badge variant={accIsSuperAdmin ? "default" : "outline"} className={accIsSuperAdmin ? "bg-indigo-600" : ""}>
                            {acc.role}
                          </Badge>
                          {acc.id === currentAdmin?.id && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{acc.email}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
                          <Smartphone className="h-3 w-3" />
                          {accIsSuperAdmin ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Unlimited Devices ({acc.sessions?.length || 0} active now)</span>
                          ) : (
                            <span>Max 3 Devices ({acc.sessions?.length || 0} active now)</span>
                          )}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUserId(acc.id)}
                        className="gap-1.5 text-xs font-medium"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit Account &amp; Password
                      </Button>
                    </div>
                  ) : (
                    /* Inline User Edit Form */
                    <form onSubmit={(e) => handleUpdateUserAccount(acc.id, e)} className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Edit User Account: {acc.name}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUserId(null)}
                          className="h-7 text-xs text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor={`name-${acc.id}`} className="text-xs">Full Name / Username *</Label>
                          <Input id={`name-${acc.id}`} name="name" defaultValue={acc.name} required className="text-xs font-medium" />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`email-${acc.id}`} className="text-xs">Email Address *</Label>
                          <Input id={`email-${acc.id}`} name="email" type="email" defaultValue={acc.email} required className="text-xs font-medium" />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`role-${acc.id}`} className="text-xs">Role *</Label>
                          <select 
                            id={`role-${acc.id}`} 
                            name="role" 
                            defaultValue={acc.role}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="Admin">Admin (Max 3 Devices)</option>
                            <option value="Super Admin">Super Admin (Unlimited Devices)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor={`password-${acc.id}`} className="text-xs">New Password (Leave blank to keep current)</Label>
                          <PasswordInput id={`password-${acc.id}`} name="password" placeholder="••••••••" minLength={6} className="text-xs" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingUserId(null)} className="text-xs">
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={editLoading} className="text-xs bg-indigo-600 hover:bg-indigo-700 font-bold">
                          {editLoading ? 'Saving...' : 'Save User Updates'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* === Active Logged-In Devices & Session Management === */}
      <Card className="shadow-sm border-blue-200/60 dark:border-blue-900/40">
        <CardHeader className="bg-muted/30 border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Active Logged-In Devices &amp; IP Addresses
          </CardTitle>
          <CardDescription>
            {isSuperAdmin 
              ? 'View active device sessions, IP addresses, and revoke access for any Admin or Super Admin account.'
              : 'View all active devices logged into your Admin account (Max 3 Devices allowed). Remove any unrecognized device below.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {accounts.map(acc => {
            const sessions = acc.sessions || []
            return (
              <div key={acc.id} className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{acc.name}</span>
                    <span className="text-xs text-muted-foreground">({acc.email})</span>
                    <Badge variant={acc.role === 'Super Admin' ? "default" : "outline"} className={acc.role === 'Super Admin' ? "bg-indigo-600 text-[10px]" : "text-[10px]"}>
                      {acc.role}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {sessions.length} {sessions.length === 1 ? 'Device Active' : 'Devices Active'}
                  </span>
                </div>

                {sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">No active device sessions found.</p>
                ) : (
                  <div className="space-y-2.5">
                    {sessions.map(s => {
                      const isCurrentDevice = s.token === currentSessionToken
                      const deviceLabel = s.deviceType || 'Desktop PC'
                      const isMobile = /phone|android|mobile|ios/i.test(deviceLabel)
                      const IconComponent = isMobile ? Smartphone : Laptop

                      return (
                        <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{deviceLabel}</span>
                                {isCurrentDevice && (
                                  <Badge className="bg-emerald-600 text-[10px] gap-1 font-semibold">
                                    <Check className="h-3 w-3" /> This Device (Active Now)
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-semibold">
                                  IP: {s.ipAddress || '127.0.0.1 (Localhost)'}
                                </span>
                                <span>•</span>
                                <span>Logged in: {new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={revokingSessionId === s.id}
                            onClick={() => handleRevokeSession(s.id, `${deviceLabel} (${s.ipAddress || 'IP'})`)}
                            className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 shrink-0 self-end sm:self-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {revokingSessionId === s.id ? 'Removing...' : 'Remove Device'}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

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

      {/* === My Account Credentials & Password === */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" />
            My Account Credentials &amp; Password
          </CardTitle>
          <CardDescription>
            Update your account username ({currentAdmin?.email}) and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={async (e) => {
            e.preventDefault()
            setPasswordLoading(true)
            const formData = new FormData(e.currentTarget)
            const result = await updateOwnAccount(formData)
            setPasswordLoading(false)
            if (result.error) {
              toast.error(result.error)
            } else if (result.success) {
              toast.success(result.message || 'Account updated successfully!')
            }
          }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownName">Username / Display Name *</Label>
                <Input id="ownName" name="name" defaultValue={currentAdmin?.name || ''} required className="font-semibold" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownEmail">Email Address</Label>
                <Input id="ownEmail" value={currentAdmin?.email || ''} disabled className="bg-muted font-medium cursor-not-allowed" />
              </div>
            </div>

            <Separator className="my-2" />
            
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change Password (Optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput id="currentPassword" name="currentPassword" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput id="newPassword" name="newPassword" placeholder="••••••••" minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput id="confirmPassword" name="confirmPassword" placeholder="••••••••" minLength={6} />
              </div>
            </div>
            <Button type="submit" disabled={passwordLoading} className="font-bold">
              {passwordLoading ? 'Saving Changes...' : 'Save Account Settings'}
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
