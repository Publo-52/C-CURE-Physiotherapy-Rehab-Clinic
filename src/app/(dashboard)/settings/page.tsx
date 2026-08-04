import SettingsForm from "./settings-form"
import { getClinicProfile } from "@/app/actions/profile"

export default async function SettingsPage() {
  const profile = await getClinicProfile()

  const defaultProfile = {
    practitionerName: 'Sanatan Manna',
    clinicName: 'C-CURE Physiotherapy & Rehab Clinic',
    phone: '7942688985',
    email: 'sanatan.manna28072015@gmail.com',
    address: 'Moyna Hospital, More Moyna, Tamluk, Moyna, Midnapore-721629, West Bengal',
    about: '',
    workingHours: 'Open 24 Hours — Monday to Sunday',
    defaultFee: 500,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your clinic profile, contact details, and admin password.</p>
      </div>
      <SettingsForm profile={profile ?? defaultProfile} />
    </div>
  )
}
