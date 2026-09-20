export const dynamic = 'force-dynamic'

import SettingsForm from "./settings-form"
import { getClinicProfile } from "@/app/actions/profile"
import { getAdminAccounts } from "@/app/actions/settings"
import { Settings as SettingsIcon } from "lucide-react"

export default async function SettingsPage() {
  const [profile, adminData] = await Promise.all([
    getClinicProfile(),
    getAdminAccounts(),
  ])

  const defaultProfile = {
    practitionerName: 'Sanatan Manna',
    clinicName: 'C-CURE Physiotherapy & Rehab Clinic',
    phone: '7942688985',
    email: 'sanatan.manna28072015@gmail.com',
    address: 'Moyna Hospital, More Moyna, Tamluk, Moyna, Midnapore-721629, West Bengal',
    about: '',
    workingHours: 'Open 24 Hours — Monday to Sunday',
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div className="pb-1">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight gradient-text">
          Clinic Settings
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
          <SettingsIcon className="h-3.5 w-3.5 text-primary" />
          Manage clinic practice profile, administrator accounts, security credentials, and active sessions.
        </p>
      </div>
      <SettingsForm 
        profile={profile ?? defaultProfile} 
        currentAdmin={adminData.currentAdmin}
        currentSessionToken={adminData.currentSessionToken}
        accounts={adminData.accounts}
      />
    </div>
  )
}
