import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, User, Phone, Activity, MapPin, CalendarDays, IndianRupee } from "lucide-react"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatientProfilePage({ params }: Props) {
  const { id } = await params
  
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      visits: {
        orderBy: { date: 'desc' },
        take: 5
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
        take: 5
      },
      treatmentPlans: true
    }
  })

  if (!patient) return notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{patient.patientId}</span>
              <span>•</span>
              <Badge variant={patient.status === 'Active' ? 'default' : 'secondary'}>
                {patient.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/patients/${patient.id}/visits/new`}>
            <Button variant="outline">
              <CalendarDays className="h-4 w-4 mr-2" /> Record Visit
            </Button>
          </Link>
          <Link href={`/patients/${patient.id}/payments/new`}>
            <Button variant="default">
              <IndianRupee className="h-4 w-4 mr-2" /> Record Payment
            </Button>
          </Link>
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="payments">Financials</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{patient.phone}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Condition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{patient.disease || "Not specified"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium truncate">{patient.address || "Not specified"}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5 text-primary" /> Recent Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.visits.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent visits.</p>
                  ) : (
                    <ul className="space-y-4">
                      {patient.visits.map(visit => (
                        <li key={visit.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">Visit #{visit.visitNumber}</p>
                            <p className="text-muted-foreground">{new Date(visit.date).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="outline">{visit.type}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IndianRupee className="h-5 w-5 text-primary" /> Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.payments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No payment records.</p>
                  ) : (
                    <ul className="space-y-4">
                      {patient.payments.map(payment => (
                        <li key={payment.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium">{payment.invoiceNumber}</p>
                            <p className="text-muted-foreground">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{payment.amountPaidToday}</p>
                            <Badge variant={payment.status === 'Paid' ? 'default' : 'destructive'} className="mt-1">
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
                <CardTitle>Medical History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Chief Complaint</h3>
                    <p className="mt-1">{patient.chiefComplaint || "—"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Diagnosis</h3>
                    <p className="mt-1">{patient.diagnosis || "—"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Past Medical History</h3>
                    <p className="mt-1">{patient.medicalHistory || "—"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Medication</h3>
                    <p className="mt-1">{patient.currentMedication || "—"}</p>
                  </div>
                </div>
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
                  <p className="text-muted-foreground text-sm">No active treatment plans.</p>
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

          <TabsContent value="visits" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>All Visits</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Expandable full list of visits will go here */}
                <p className="text-muted-foreground text-sm">Complete visit history module coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Financial History</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Expandable full list of payments will go here */}
                <p className="text-muted-foreground text-sm">Complete payment ledger module coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
