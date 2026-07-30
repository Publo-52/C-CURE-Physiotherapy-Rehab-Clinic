'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, User, Edit, Trash2, Eye, CheckCircle2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { deletePatient, togglePresentStatus } from '@/app/actions/patients'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface PatientItem {
  id: string
  patientId: string
  name: string
  phone: string
  disease?: string | null
  status: string
  presentStatus: boolean
  registrationDate: Date | string
}

interface PatientsTableProps {
  initialPatients: PatientItem[]
}

export function PatientsTable({ initialPatients }: PatientsTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [optimisticPresent, setOptimisticPresent] = useState<Record<string, boolean>>({})

  // Initialize optimistic state from props if not set
  initialPatients.forEach(p => {
    if (optimisticPresent[p.id] === undefined) {
      optimisticPresent[p.id] = p.presentStatus
    }
  })

  const filteredPatients = initialPatients.filter((patient) => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      (patient.disease && patient.disease.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'All' || patient.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete patient "${name}"? This action cannot be undone.`)) return
    
    setDeletingId(id)
    const res = await deletePatient(id)
    setDeletingId(null)
    
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Patient deleted successfully')
      router.refresh()
    }
  }

  const handleTogglePresent = async (id: string, name: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    
    // Optimistic update
    setOptimisticPresent(prev => ({ ...prev, [id]: nextStatus }))
    
    toast(nextStatus ? `✅ Dr. Sonatan marked Present for ${name}` : `❌ Marked Absent for ${name}`, {
      icon: nextStatus ? '🟢' : '🔴',
      duration: 2000,
    })

    startTransition(async () => {
      const res = await togglePresentStatus(id, nextStatus)
      if (res.error) {
        toast.error(res.error)
        // Revert optimistic update
        setOptimisticPresent(prev => ({ ...prev, [id]: currentStatus }))
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, ID, phone or condition..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-1 bg-muted p-1 rounded-lg self-start sm:self-auto text-xs">
          {['All', 'Active', 'Completed', 'Inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                statusFilter === status 
                  ? 'bg-background text-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-center">
                <span className="flex items-center gap-1 justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Present
                </span>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  {searchTerm ? 'No patients matching your search criteria.' : 'No patients found.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => {
                const isPresent = optimisticPresent[patient.id]
                return (
                  <TableRow key={patient.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium font-mono text-xs">{patient.patientId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground text-xs">
                      {patient.disease || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === 'Active' ? 'default' : patient.status === 'Completed' ? 'outline' : 'secondary'}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(patient.registrationDate).toLocaleDateString()}
                    </TableCell>
                    {/* Present Toggle Column */}
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleTogglePresent(patient.id, patient.name, isPresent)}
                        title={isPresent ? 'Doctor Present — click to mark Absent' : 'Mark Doctor as Present'}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                          isPresent
                            ? 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20'
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                        }`}
                      >
                        {isPresent
                          ? <><CheckCircle2 className="h-3.5 w-3.5" /> Present</>
                          : <><XCircle className="h-3.5 w-3.5" /> Absent</>
                        }
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="icon-sm" title="View Patient Profile">
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </Link>
                        <Link href={`/patients/${patient.id}/edit`}>
                          <Button variant="ghost" size="icon-sm" title="Edit Patient">
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" 
                          size="icon-sm" 
                          className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          title="Delete Patient"
                          disabled={deletingId === patient.id}
                          onClick={() => handleDelete(patient.id, patient.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
