import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { MobileSwipeNavigation } from "@/components/mobile-swipe-navigation"
import { PageTransition } from "@/components/page-transition"
import { getClinicProfile } from "@/app/actions/profile"
import { verifySession, deleteSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()

  // If session is expired or user token is invalid/revoked, clear cookie & force login
  if (!session || !session.user) {
    await deleteSession()
    redirect('/login')
  }

  const profile = await getClinicProfile()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} currentUser={session.user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header profile={profile} currentUser={session.user} />
        <MobileSwipeNavigation>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-muted/30 pb-20 md:pb-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </MobileSwipeNavigation>
      </div>
      <MobileBottomNav />
    </div>
  )
}
