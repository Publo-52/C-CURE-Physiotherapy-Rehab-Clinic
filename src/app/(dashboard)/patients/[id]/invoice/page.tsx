export const dynamic = 'force-dynamic'

import Image from 'next/image'

import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { InvoiceActions } from './invoice-actions'
import { getClinicProfile } from '@/app/actions/profile'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatientInvoicePage({ params }: Props) {
  const { id } = await params

  const [patient, profile] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      include: {
        payments: { orderBy: { paymentDate: 'desc' } },
        visits: { orderBy: { date: 'desc' }, take: 1 },
      },
    }),
    getClinicProfile()
  ])

  if (!patient) return notFound()

  const clinicName = profile?.clinicName || 'C-CURE Physiotherapy & Rehab Clinic'
  const practitionerName = profile?.practitionerName || 'Sanatan Manna'
  const phone = profile?.phone || '7942688985'
  const email = profile?.email || 'sanatan.manna28072015@gmail.com'
  const address = profile?.address || 'Moyna, Midnapore, West Bengal'
  const workingHours = profile?.workingHours || 'Open 24 Hours'

  // ─── Financial aggregates ─────────────────────────────────────────────────
  const totalBilled = patient.payments.reduce((s, p) => s + p.totalBill, 0)
  const totalPaid   = patient.payments.reduce((s, p) => s + p.amountPaidToday, 0)
  const totalDue    = patient.payments.length > 0
    ? patient.payments[0].remainingDue   // latest payment carries forward due
    : 0
  const lastVisit   = patient.visits[0] ?? null
  const visitCount  = await prisma.visit.count({ where: { patientId: id } })

  const invoiceNo = `INV-${patient.patientId}-${new Date().getFullYear()}`
  const invoiceDate = formatDate(new Date())

  return (
    <>
      {/* ─── Global print CSS ─────────────────────────────────────────── */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
        .invoice-page { font-family: 'Segoe UI', system-ui, sans-serif; }
      `}</style>

      <div className="invoice-page invoice-print-root max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 w-full overflow-hidden sm:overflow-visible">

        {/* ─── Action bar (hidden on print) ──────────────────────────── */}
        <InvoiceActions patient={patient} profile={profile} visitsCount={visitCount} />

        {/* ─── INVOICE DOCUMENT ─────────────────────────────────────── */}
        <div className="invoice-document bg-white dark:bg-card border rounded-xl sm:rounded-2xl shadow-lg overflow-hidden print:shadow-none print:border-0">

          {/* ── Header / Letterhead ───────────────────────────────── */}
          <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3.5 sm:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="bg-white p-1.5 sm:p-2 rounded-xl shrink-0 shadow-sm max-w-[120px] xs:max-w-[150px] sm:max-w-[200px]">
                  <Image src="/logo.jpg" alt="C-CURE Logo" width={200} height={64} className="h-10 xs:h-12 sm:h-16 w-auto object-contain max-w-full" style={{ width: 'auto', height: 'auto' }} priority />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base xs:text-lg sm:text-xl font-bold tracking-tight leading-tight truncate">{clinicName}</div>
                  <div className="text-sky-100 text-[11px] sm:text-xs mt-0.5 truncate">Advanced Physiotherapy &amp; Rehab Clinic</div>
                  <div className="mt-1 sm:mt-2 text-[11px] sm:text-xs text-sky-50 truncate">
                    <span className="font-semibold text-xs sm:text-sm text-white">{practitionerName}</span> (Physiotherapist)
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right text-[11px] sm:text-xs text-sky-100 space-y-0.5 shrink-0 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-sky-400/30 sm:border-t-0">
                <div>📞 {phone}</div>
                <div className="truncate">✉️ {email}</div>
                <div>🕐 {workingHours}</div>
                <div className="text-[10px] sm:text-xs mt-1 max-w-full sm:max-w-[240px] text-sky-200 leading-snug break-words">{address}</div>
              </div>
            </div>
          </div>

          {/* ── Invoice Meta row ─────────────────────────────────── */}
          <div className="flex flex-row justify-between items-center px-3.5 sm:px-8 py-2.5 sm:py-4 bg-muted/40 border-b gap-2">
            <div>
              <span className="text-[10px] sm:text-xs uppercase font-semibold tracking-widest text-muted-foreground">Invoice</span>
              <div className="text-sm sm:text-lg font-bold font-mono text-foreground mt-0.5">{invoiceNo}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold tracking-widest">Date Issued</div>
              <div className="text-xs sm:text-base font-semibold mt-0.5">{invoiceDate}</div>
            </div>
          </div>

          <div className="px-3.5 sm:px-8 py-4 sm:py-6 space-y-5 sm:space-y-8">

            {/* ── Patient + Health grid ─────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6">

              {/* Patient Details */}
              <div className="border rounded-xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 bg-card">
                <h2 className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-primary border-b pb-1.5 sm:pb-2">
                  Patient Details
                </h2>
                <Row label="Name"           value={patient.name} />
                <Row label="Patient ID"     value={patient.patientId} mono />
                <Row label="Age / Gender"   value={[patient.age && `${patient.age} yrs`, patient.gender].filter(Boolean).join(' / ')} />
                <Row label="Blood Group"    value={patient.bloodGroup} />
                <Row label="Phone"          value={patient.phone} />
                {patient.email     && <Row label="Email"   value={patient.email} />}
                {patient.address   && <Row label="Address" value={[patient.address, patient.city, patient.state, patient.pinCode].filter(Boolean).join(', ')} />}
                <Row label="Registered"     value={formatDate(patient.registrationDate)} />
                <Row label="Status"         value={patient.status} />
              </div>

              {/* Health Summary */}
              <div className="border rounded-xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 bg-card">
                <h2 className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-indigo-500 border-b pb-1.5 sm:pb-2">
                  Health Summary
                </h2>
                <Row label="Condition / Disease"  value={patient.disease} />
                <Row label="Chief Complaint"      value={patient.chiefComplaint} />
                <Row label="Diagnosis"            value={patient.diagnosis} />
                {patient.symptoms && <Row label="Symptoms"    value={patient.symptoms} />}
                {patient.painScale !== null && patient.painScale !== undefined &&
                  <Row label="Pain Scale (Initial)"  value={`${patient.painScale} / 10`} />}
                {patient.bloodPressure && <Row label="Blood Pressure" value={patient.bloodPressure} />}
                {(patient.height || patient.weight) &&
                  <Row label="Height / Weight"   value={[patient.height && `${patient.height} cm`, patient.weight && `${patient.weight} kg`].filter(Boolean).join(' / ')} />}
                {patient.bmi &&   <Row label="BMI"          value={String(patient.bmi)} />}
                <Row label="Total Visits"         value={String(visitCount)} />
                {lastVisit && <Row label="Last Visit"  value={formatDate(lastVisit.date)} />}
              </div>
            </div>

            {/* ── Financial Summary ──────────────────────────────── */}
            <div className="border rounded-xl overflow-hidden">
              <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-muted/50 border-b">
                <h2 className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-muted-foreground">
                  Financial Summary
                </h2>
              </div>
              <div className="grid grid-cols-3 divide-x">
                <FinStat label="Total Billed"    value={`₹${totalBilled.toLocaleString('en-IN')}`} color="text-foreground" />
                <FinStat label="Total Paid"      value={`₹${totalPaid.toLocaleString('en-IN')}`}   color="text-green-600 dark:text-green-400" />
                <FinStat label="Remaining Due"   value={`₹${totalDue.toLocaleString('en-IN')}`}    color={totalDue > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'} />
              </div>
            </div>

            {/* ── Payment History table ─────────────────────────── */}
            {patient.payments.length > 0 && (
              <div className="border rounded-xl overflow-hidden">
                <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-muted/50 border-b">
                  <h2 className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-muted-foreground">
                    Payment History (Last {Math.min(patient.payments.length, 8)} Entries)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        {['Invoice #', 'Date', 'Mode', 'Total Bill', 'Paid', 'Due', 'Status'].map(h => (
                          <th key={h} className="text-left py-2 px-2.5 sm:px-4 font-semibold text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {patient.payments.slice(0, 8).map((p, i) => (
                        <tr key={p.id} className={`border-b last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                          <td className="py-2 px-2.5 sm:px-4 font-mono text-[11px] sm:text-xs font-semibold whitespace-nowrap">{p.invoiceNumber}</td>
                          <td className="py-2 px-2.5 sm:px-4 text-muted-foreground whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                          <td className="py-2 px-2.5 sm:px-4 whitespace-nowrap">{p.paymentMode}</td>
                          <td className="py-2 px-2.5 sm:px-4 font-medium whitespace-nowrap">₹{p.totalBill}</td>
                          <td className="py-2 px-2.5 sm:px-4 font-medium text-green-600 dark:text-green-400 whitespace-nowrap">₹{p.amountPaidToday}</td>
                          <td className={`py-2 px-2.5 sm:px-4 font-medium whitespace-nowrap ${p.remainingDue > 0 ? 'text-destructive' : ''}`}>₹{p.remainingDue}</td>
                          <td className="py-2 px-2.5 sm:px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                              p.status === 'Paid' ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300' :
                              p.status === 'Partially Paid' ? 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300' :
                              'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                            }`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Doctor Signature / Footer ─────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 pt-3 sm:pt-4 border-t">
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p className="text-sm sm:text-base font-semibold text-foreground">Terms & Notes</p>
                <p>• Payments once made are non-refundable unless otherwise agreed.</p>
                <p>• This invoice is computer-generated and is valid without signature.</p>
                <p>• For queries, contact us at {phone}.</p>
              </div>
              <div className="text-left sm:text-right shrink-0 w-full sm:w-auto flex flex-col items-start sm:items-end pt-2 sm:pt-0">
                <div className="h-10 sm:h-12 w-36 sm:w-40 border-b-2 border-dashed border-muted-foreground/40 mb-1" />
                <p className="font-semibold text-xs sm:text-sm text-foreground">{practitionerName}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Physiotherapist</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">{clinicName}</p>
              </div>
            </div>

            {/* ── Thank you strip ───────────────────────────────── */}
            <div className="text-center py-3 sm:py-4 px-3 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 border">
              <p className="text-xs sm:text-sm font-medium text-foreground">🙏 Thank you for choosing {clinicName}.</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Wishing you a speedy recovery and good health always!</p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

// ─── Helper sub-components ────────────────────────────────────────────────────
function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start gap-2 text-xs sm:text-sm">
      <span className="text-muted-foreground shrink-0 font-medium">{label}</span>
      <span className={`text-right font-medium break-words min-w-0 max-w-[62%] sm:max-w-[65%] ${mono ? 'font-mono text-[11px] sm:text-xs bg-muted px-1.5 py-0.5 rounded' : ''}`}>{value}</span>
    </div>
  )
}

function FinStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 sm:p-5 text-center min-w-0 overflow-hidden" title={`${label}: ${value}`}>
      <div className="text-[9px] xs:text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-widest text-muted-foreground font-semibold mb-0.5 sm:mb-1 truncate">{label}</div>
      <div className={`text-sm xs:text-base sm:text-2xl font-bold truncate ${color}`}>{value}</div>
    </div>
  )
}
