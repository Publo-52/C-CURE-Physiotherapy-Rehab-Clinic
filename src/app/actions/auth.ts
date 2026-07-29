'use server'

import prisma from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
  })

  if (!admin) {
    return { error: 'Invalid credentials' }
  }

  const isValidPassword = await bcrypt.compare(password, admin.password)

  if (!isValidPassword) {
    return { error: 'Invalid credentials' }
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  })

  await createSession(admin.id)
  
  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

