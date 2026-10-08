import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, Home, Users } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="card-handmade max-w-md w-full p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Page Not Found</h1>
          <p className="text-xs text-muted-foreground font-medium">
            The patient profile, invoice, or page you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full font-bold gap-2 active-press shadow-md shadow-primary/20">
              <Home className="w-4 h-4" /> Go to Dashboard
            </Button>
          </Link>
          <Link href="/patients" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full font-bold gap-2 active-press">
              <Users className="w-4 h-4" /> View Patients
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
