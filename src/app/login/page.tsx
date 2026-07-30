'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await login(formData)
      
      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
      }
      // If successful, the action will redirect, no need to set loading false
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred during login.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-sm">
              <Image src="/doctor-sonatan.png" alt="Dr. Sonatan Manna" fill className="object-cover" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl font-extrabold text-primary uppercase tracking-wider mb-1">
              C-CURE Physiotherapy
            </CardTitle>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              & Rehab Clinic
            </p>
            <CardDescription className="text-sm">
              Dr. Sonatan Manna's Management Dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="admin@c-cure.com" 
                required 
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required 
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
