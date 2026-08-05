export const dynamic = 'force-dynamic'

import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, User, Phone, Activity, MapPin, CalendarDays, IndianRupee, Mail, AlertCircle, FileText } from "lucide-react"
import { PatientInvoiceButton } from "./patient-invoice-button"
import { getClinicProfile } from "@/app/actions/profile"
import { DeletePatientButton } from "./delete-button"
import { formatDate } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatientProfilePage({ params }: Props) {
  const { id } = await params
  
  const [patient, profile] = await Promise.all([
    prisma.patient.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { date: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        treatmentPlans: true
      }
    }),
    getClinicProfile()
  ])

  if (!patient) return notFound()

  const recentVisits = patient.visits.slice(0, 5)
  const recentPayments = patient.payments.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header - Mobile friendly wrap */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 sm:p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{patient.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-1 text-xs sm:text-sm">
              <span className="font-mono bg-muted px-2 py-0.5 rounded">{patient.patientId}</span>
              <span>•</span>
              <Badge variant={patient.status === 'Active' ? 'default' : patient.status === 'Completed' ? 'outline' : 'secondary'}>
                {patient.status}
              </Badge>
              {patient.age && <span>• {patient.age} Yrs ({patient.gender || 'N/A'})</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          <Link href={`/patients/${patient.id}/visits/new`} className="flex-1 sm:flex-initial">
            <Button variant="outline" size="sm" className="w-full">
              <CalendarDays className="h-4 w-4 mr-1.5" /> Record Visit
            </Button>
          </Link>
          <Link href={`/patients/${patient.id}/payments/new`} className="flex-1 sm:flex-initial">
            <Button variant="default" size="sm" className="w-full">
              <IndianRupee className="h-4 w-4 mr-1.5" /> Record Payment
            </Button>
          </Link>
          <PatientInvoiceButton patient={patient} profile={profile} visitsCount={patient.visits.length} />
          <Link href={`/patients/${patient.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          </Link>
          <DeletePatientButton patientId={patient.id} patientName={patient.name} />
        </div>
      </div>

      {/* Tabs - Mobile friendly horizontal scroll navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-5 sm:max-w-3xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="medical">Medical History</TabsTrigger>
            <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
            <TabsTrigger value="visits">Visits ({patient.visits.length})</TabsTrigger>
            <TabsTrigger value="payments">Financials ({patient.payments.length})</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6 m-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="font-medium">{patient.phone}</p>
                  {patient.email && <p className="text-muted-foreground text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> {patient.email}</p>}
                  {patient.alternatePhone && <p className="text-muted-foreground text-xs">Alt: {patient.alternatePhone}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Primary Condition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{patient.disease || "Not specified"}</p>
                  {patient.aadhaar && <p className="text-xs text-muted-foreground mt-1">Aadhaar: {patient.aadhaar}</p>}
                </CardContent>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-sm">{patient.address || "Not specified"}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5 text-primary" /> Recent Visits
                  </CardTitle>
                  <Link href={`/patients/${patient.id}/visits/new`}>
                    <Button variant="ghost" size="sm" className="text-xs">+ Add</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentVisits.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recorded visits yet.</p>
                  ) : (
                    <ul className="space-y-4">
                      {recentVisits.map(visit => (
                        <li key={visit.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">Visit #{visit.visitNumber}</p>
                            <p className="text-muted-foreground text-xs">{formatDate(visit.date)}</p>
                            {visit.treatmentGiven && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{visit.treatmentGiven}</p>}
                          </div>
                          <Badge variant="outline">{visit.type}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IndianRupee className="h-5 w-5 text-primary" /> Recent Payments
                  </CardTitle>
                  <Link href={`/patients/${patient.id}/payments/new`}>
                    <Button variant="ghost" size="sm" className="text-xs">+ Add</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentPayments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No payment records.</p>
                  ) : (
                    <ul className="space-y-4">
                      {recentPayments.map(payment => (
                        <li key={payment.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium font-mono text-xs">{payment.invoiceNumber}</p>
                            <p className="text-muted-foreground text-xs">{formatDate(payment.paymentDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">₹{payment.amountPaidToday}</p>
                            <Badge variant={payment.status === 'Paid' ? 'default' : 'destructive'} className="mt-1 text-[10px]">
                              {payment.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="medical" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Medical & Clinical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h3 className="text-sm font-semibold text-primary">Chief Complaint</h3>
                    <p className="mt-1 text-sm">{patient.chiefComplaint || "No chief complaint recorded."}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h3 className="text-sm font-semibold text-primary">Diagnosis</h3>
                    <p className="mt-1 text-sm">{patient.diagnosis || "No specific diagnosis recorded."}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h3 className="text-sm font-semibold text-primary">Past Medical History</h3>
                    <p className="mt-1 text-sm">{patient.medicalHistory || "None recorded."}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <h3 className="text-sm font-semibold text-primary">Current Medication</h3>
                    <p className="mt-1 text-sm">{patient.currentMedication || "None recorded."}</p>
                  </div>
                </div>

                {(patient.emerContactName || patient.emerContactPhone) && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Emergency Contact</h3>
                    <p className="text-sm font-medium">{patient.emerContactName || 'N/A'} - {patient.emerContactPhone || 'N/A'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="treatment" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Treatment Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {patient.treatmentPlans.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No active treatment plans recorded yet.</p>
                ) : (
                  patient.treatmentPlans.map(plan => (
                    <div key={plan.id} className="border rounded-md p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">Current Protocol</h3>
                        <Badge>{plan.recoveryPercentage}% Recovered</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">Goals:</span>
                          {plan.goals || "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Frequency:</span>
                          {plan.frequency || "—"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visits" className="m-0 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-semibold">Visit History</h2>
              <Link href={`/patients/${patient.id}/visits/new`}>
                <Button size="sm"><CalendarDays className="h-4 w-4 mr-1.5" /> Record Visit</Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-0">
                {patient.visits.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No visit history found.</p>
                ) : (
                  <>
                    {/* Mobile card view */}
                    <div className="block md:hidden space-y-3 p-3 bg-muted/20">
                      {patient.visits.map((visit) => (
                        <div key={visit.id} className="p-4 space-y-2 bg-background border border-border/70 rounded-2xl shadow-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">Visit #{visit.visitNumber}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(visit.date)}</p>
                            </div>
                            <Badge variant="outline">{visit.type}</Badge>
                          </div>
                          {visit.treatmentGiven && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{visit.treatmentGiven}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Pain: {visit.painBefore ?? 'N/A'} → {visit.painAfter ?? 'N/A'}</span>
                          </div>
                          {visit.notes && <p className="text-xs text-muted-foreground line-clamp-1">{visit.notes}</p>}
                        </div>
                      ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Visit #</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Pain Scale</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Treatment</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.visits.map((visit) => (
                            <tr key={visit.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="py-3 px-4 font-medium">Visit #{visit.visitNumber}</td>
                              <td className="py-3 px-4">{formatDate(visit.date)}</td>
                              <td className="py-3 px-4"><Badge variant="outline">{visit.type}</Badge></td>
                              <td className="py-3 px-4">{visit.painBefore ?? 'N/A'} &rarr; {visit.painAfter ?? 'N/A'}</td>
                              <td className="py-3 px-4 max-w-xs truncate">{visit.treatmentGiven || '—'}</td>
                              <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">{visit.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="m-0 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-semibold">Financial & Ledger History</h2>
              <Link href={`/patients/${patient.id}/payments/new`}>
                <Button size="sm"><IndianRupee className="h-4 w-4 mr-1.5" /> Record Payment</Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-0">
                {patient.payments.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No payment records found.</p>
                ) : (
                  <>
                    {/* Mobile card view */}
                    <div className="block md:hidden space-y-3 p-3 bg-muted/20">
                      {patient.payments.map((p) => (
                        <div key={p.id} className="p-4 space-y-2 bg-background border border-border/70 rounded-2xl shadow-xs">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-mono text-xs font-semibold text-primary">{p.invoiceNumber}</p>
                            <Badge variant={p.status === 'Paid' ? 'default' : 'destructive'} className="text-[10px]">{p.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-muted/40 rounded-lg p-1.5">
                              <p className="text-[10px] text-muted-foreground">Bill</p>
                              <p className="text-xs font-semibold">₹{p.totalBill}</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-1.5">
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Paid</p>
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">₹{p.amountPaidToday}</p>
                            </div>
                            <div className={`rounded-lg p-1.5 ${p.remainingDue > 0 ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-muted/40'}`}>
                              <p className={`text-[10px] ${p.remainingDue > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>Due</p>
                              <p className={`text-xs font-semibold ${p.remainingDue > 0 ? 'text-destructive' : ''}`}>₹{p.remainingDue}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Invoice</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Bill</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Paid</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Due</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mode</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patient.payments.map((p) => (
                            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="py-3 px-4 font-mono font-medium">{p.invoiceNumber}</td>
                              <td className="py-3 px-4">{formatDate(p.paymentDate)}</td>
                              <td className="py-3 px-4 text-right font-medium">₹{p.totalBill}</td>
                              <td className="py-3 px-4 text-right text-green-600 font-medium">₹{p.amountPaidToday}</td>
                              <td className={`py-3 px-4 text-right font-medium ${p.remainingDue > 0 ? 'text-destructive' : ''}`}>₹{p.remainingDue}</td>
                              <td className="py-3 px-4">{p.paymentMode}</td>
                              <td className="py-3 px-4">
                                <Badge variant={p.status === 'Paid' ? 'default' : 'destructive'} className="mt-1 text-[10px]">
                                  {p.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
