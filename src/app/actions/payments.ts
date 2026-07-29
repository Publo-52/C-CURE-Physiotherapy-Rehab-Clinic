'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPayment(patientId: string, formData: FormData) {
  const consultationFee = parseFloat(formData.get('consultationFee') as string) || 0
  const visitFee = parseFloat(formData.get('visitFee') as string) || 0
  const extraCharges = parseFloat(formData.get('extraCharges') as string) || 0
  const discount = parseFloat(formData.get('discount') as string) || 0
  
  const totalBill = consultationFee + visitFee + extraCharges - discount
  
  const amountPaidToday = parseFloat(formData.get('amountPaidToday') as string) || 0
  const previousDue = parseFloat(formData.get('previousDue') as string) || 0
  
  const totalDue = previousDue + totalBill
  const remainingDue = totalDue - amountPaidToday

  let status = 'Paid'
  if (remainingDue > 0 && amountPaidToday > 0) status = 'Partially Paid'
  else if (remainingDue > 0 && amountPaidToday === 0) status = 'Due'
  else if (remainingDue < 0) status = 'Advance Paid'

  const paymentMode = formData.get('paymentMode') as string
  const paymentDate = new Date(formData.get('paymentDate') as string)
  
  const expectedNextPaymentStr = formData.get('expectedNextPayment') as string
  const expectedNextPayment = expectedNextPaymentStr ? new Date(expectedNextPaymentStr) : null

  // Auto-generate Invoice ID
  const lastPayment = await prisma.payment.findFirst({
    orderBy: { createdAt: 'desc' },
  })
  
  let nextInvNum = 1
  if (lastPayment && lastPayment.invoiceNumber.startsWith('INV-')) {
    const lastNum = parseInt(lastPayment.invoiceNumber.replace('INV-', ''))
    if (!isNaN(lastNum)) {
      nextInvNum = lastNum + 1
    }
  }
  const invoiceNumber = `INV-${nextInvNum.toString().padStart(5, '0')}`

  try {
    const payment = await prisma.payment.create({
      data: {
        invoiceNumber,
        patientId,
        consultationFee,
        visitFee,
        extraCharges,
        discount,
        totalBill,
        amountPaidToday,
        remainingDue,
        previousDue,
        totalDue,
        status,
        paymentMode,
        paymentDate,
        expectedNextPayment,
        paymentNotes: formData.get('paymentNotes') as string,
        transactionId: formData.get('transactionId') as string,
      }
    })

    revalidatePath(`/patients/${patientId}`)
    revalidatePath(`/payments`)
    revalidatePath(`/`)
    
    return { success: true, paymentId: payment.id }
  } catch (error) {
    console.error(error)
    return { error: 'Failed to record payment.' }
  }
}
