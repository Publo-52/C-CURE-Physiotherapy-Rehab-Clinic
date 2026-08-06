'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePayment } from '@/app/actions/payments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface EditPaymentFormProps {
  patient: {
    id: string
    name: string
    patientId: string
  }
  payment: {
    id: string
    invoiceNumber: string
    consultationFee: number
    visitFee: number
    extraCharges: number
    discount: number
    amountPaidToday: number
    previousDue: number
    paymentMode: string
    paymentDate: Date
    expectedNextPayment: Date | null
    transactionId: string | null
    paymentNotes: string | null
  }
}

export function EditPaymentForm({ patient, payment }: EditPaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentMode, setPaymentMode] = useState(payment.paymentMode || 'Cash')
  
  // Real-time calculation state initialized from existing payment
  const [consultationFee, setConsultationFee] = useState(payment.consultationFee || 0)
  const [visitFee, setVisitFee] = useState(payment.visitFee || 0)
  const [extraCharges, setExtraCharges] = useState(payment.extraCharges || 0)
  const [discount, setDiscount] = useState(payment.discount || 0)
  const [amountPaidToday, setAmountPaidToday] = useState(payment.amountPaidToday || 0)
  const [previousDue, setPreviousDue] = useState(payment.previousDue || 0)

  const defaultPaymentDate = new Date(payment.paymentDate).toISOString().slice(0, 16)
  const defaultNextDate = payment.expectedNextPayment ? new Date(payment.expectedNextPayment).toISOString().slice(0, 10) : ''

  const totalBill = consultationFee + visitFee + extraCharges - discount
  const totalDue = previousDue + totalBill
  const remainingDue = totalDue - amountPaidToday

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('paymentMode', paymentMode)
    
    const result = await updatePayment(payment.id, formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (result.success) {
      toast.success(`Invoice ${payment.invoiceNumber} updated successfully!`)
      router.push(`/patients/${patient.id}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Payment Invoice</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invoice <span className="font-mono font-semibold">{payment.invoiceNumber}</span> for <span className="font-semibold">{patient.name}</span> ({patient.patientId})
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="edit-payment-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input id="paymentDate" name="paymentDate" type="datetime-local" required defaultValue={defaultPaymentDate} />
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Mode *</Label>
                  <Select value={paymentMode} onValueChange={(v) => v && setPaymentMode(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                  <Input id="consultationFee" name="consultationFee" type="number" min="0" placeholder="Enter consultation fee" value={consultationFee} onChange={(e) => setConsultationFee(Number(e.target.value))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitFee">Visit / Therapy Fee (₹)</Label>
                  <Input id="visitFee" name="visitFee" type="number" min="0" placeholder="Enter visit fee" value={visitFee} onChange={(e) => setVisitFee(Number(e.target.value))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraCharges">Extra Charges (Medicine/Equipment) (₹)</Label>
                  <Input id="extraCharges" name="extraCharges" type="number" min="0" placeholder="Enter extra charges" value={extraCharges} onChange={(e) => setExtraCharges(Number(e.target.value))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (₹)</Label>
                  <Input id="discount" name="discount" type="number" min="0" placeholder="Enter discount amount" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="previousDue">Previous Outstanding Due (₹)</Label>
                  <Input id="previousDue" name="previousDue" type="number" placeholder="Enter previous due" value={previousDue} onChange={(e) => setPreviousDue(Number(e.target.value))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountPaidToday">Amount Paid (₹) *</Label>
                  <Input id="amountPaidToday" name="amountPaidToday" type="number" min="0" required placeholder="Enter amount paid" value={amountPaidToday} onChange={(e) => setAmountPaidToday(Number(e.target.value))} className="border-primary font-bold" />
                </div>

                {remainingDue > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="expectedNextPayment">Expected Next Payment Date (For Remaining Due)</Label>
                    <Input id="expectedNextPayment" name="expectedNextPayment" type="date" defaultValue={defaultNextDate} />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="transactionId">Transaction ID / UPI Reference (Optional)</Label>
                  <Input id="transactionId" name="transactionId" defaultValue={payment.transactionId || ''} placeholder="Enter transaction ID or UPI reference number" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="paymentNotes">Payment Notes</Label>
                  <Textarea id="paymentNotes" name="paymentNotes" defaultValue={payment.paymentNotes || ''} placeholder="Enter payment notes / remarks..." />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit sticky top-20 bg-muted/30">
          <CardHeader>
            <CardTitle>Updated Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Consultation</span>
              <span>₹{consultationFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Visit Fee</span>
              <span>₹{visitFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Extra Charges</span>
              <span>₹{extraCharges}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
              <span>Current Bill</span>
              <span>₹{totalBill}</span>
            </div>
            
            <div className="flex justify-between text-sm text-destructive mt-4">
              <span>Previous Due</span>
              <span>+₹{previousDue}</span>
            </div>
            
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total Payable</span>
              <span>₹{totalDue}</span>
            </div>

            <div className="flex justify-between text-sm text-primary font-medium mt-4">
              <span>Paid Amount</span>
              <span>-₹{amountPaidToday}</span>
            </div>

            <div className={`border-t pt-4 mt-4 flex justify-between font-bold text-xl ${remainingDue > 0 ? 'text-destructive' : remainingDue < 0 ? 'text-green-600' : ''}`}>
              <span>{remainingDue < 0 ? 'Advance' : 'Remaining Due'}</span>
              <span>₹{Math.abs(remainingDue)}</span>
            </div>

            <div className="text-xs text-center text-muted-foreground mt-2 p-2 rounded bg-muted">
              Mode: <span className="font-medium text-foreground">{paymentMode}</span>
            </div>

            <Button type="submit" form="edit-payment-form" className="w-full mt-6" disabled={loading}>
              {loading ? 'Saving Changes...' : 'Update Invoice'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
