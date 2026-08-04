'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await login(formData)
      
      if (result?.error) {
        toast.error(result.error)
        setLoading(false)
      } else if (result?.success) {
        // Session cookie is set — navigate to dashboard
        router.push('/')
        router.refresh()
      }
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
            <div className="bg-card border border-border/40 rounded-2xl p-2.5 shadow-sm">
              <Image
                src="/logo.jpg"
                alt="C-CURE Logo"
                width={224}
                height={112}
                className="h-28 w-auto object-contain"
                priority
              />
            </div>
          </div>
          <div>
            <CardDescription className="text-sm">
              Management Dashboard Login
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
