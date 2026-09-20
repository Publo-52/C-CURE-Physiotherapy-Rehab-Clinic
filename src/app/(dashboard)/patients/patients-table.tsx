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
import { Search, Edit, Trash2, Eye, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { deletePatient, togglePresentStatus } from '@/app/actions/patients'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface PatientItem {
  id: string
  patientId: string
  name: string
  phone: string
  disease?: string | null
  status: string
  presentStatus: boolean
  visitDoneToday: boolean
  registrationDate: Date | string
  perVisitFee?: number
  totalBilled?: number
  totalPaid?: number
  totalDue?: number
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
  const [optimisticPresent, setOptimisticPresent] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    initialPatients.forEach(p => initialState[p.id] = p.presentStatus)
    return initialState
  })
  const [optimisticDone, setOptimisticDone] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    initialPatients.forEach(p => initialState[p.id] = p.visitDoneToday)
    return initialState
  })
  const [optimisticDue, setOptimisticDue] = useState<Record<string, number>>(() => {
    const initialState: Record<string, number> = {}
    initialPatients.forEach(p => initialState[p.id] = p.totalDue ?? 0)
    return initialState
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

  // Pagination state (default 25 per page for 60fps rendering)
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const totalItems = filteredPatients.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex)

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
    const originalDone = optimisticDone[id]
    const patientFee = initialPatients.find(p => p.id === id)?.perVisitFee || 0
    const originalDue = optimisticDue[id] ?? 0
    const nextDue = nextStatus ? originalDue + patientFee : Math.max(0, originalDue - patientFee)
    
    setOptimisticPresent(prev => ({ ...prev, [id]: nextStatus }))
    setOptimisticDone(prev => ({ ...prev, [id]: false }))
    setOptimisticDue(prev => ({ ...prev, [id]: nextDue }))
    
    toast(nextStatus ? `Scheduled visit for ${name} (Fee added to bill)` : `Removed ${name} from visits (Fee removed)`, {
      icon: nextStatus ? '📅' : '🗑️',
      duration: 2000,
    })

    startTransition(async () => {
      const res = await togglePresentStatus(id, nextStatus)
      if (res.error) {
        toast.error(res.error)
        setOptimisticPresent(prev => ({ ...prev, [id]: currentStatus }))
        setOptimisticDone(prev => ({ ...prev, [id]: originalDone }))
        setOptimisticDue(prev => ({ ...prev, [id]: originalDue }))
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 dark:bg-card/40 border border-border/80 p-2.5 sm:p-3 rounded-2xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, ID, phone or condition..."
            className="pl-9 pr-4 h-9.5 rounded-xl border-border/80 bg-background/80 focus:bg-background transition-all text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        <div className="flex gap-1.5 bg-muted/60 p-1 rounded-xl self-start sm:self-auto text-xs overflow-x-auto border border-border/60">
          {['All', 'Active', 'Completed', 'Inactive'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-200 whitespace-nowrap active-press ${
                statusFilter === status 
                  ? 'bg-primary text-primary-foreground shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mobile Card View (< md) ── */}
      <div className="block md:hidden space-y-2.5">
        {filteredPatients.length === 0 ? (
          <div className="card-handmade text-center py-12 px-4 text-muted-foreground text-sm">
            {searchTerm ? 'No patients match your search criteria.' : 'No patients found.'}
          </div>
        ) : (
          paginatedPatients.map((patient) => {
            const isPresent = optimisticPresent[patient.id]
            const isDone = optimisticDone[patient.id]
            return (
              <div key={patient.id} className="card-handmade p-4 space-y-3">
                {/* Top Row: avatar + name + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9.5 w-9.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0 font-black text-xs">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-foreground truncate">{patient.name}</p>
                      <p className="text-[11px] font-mono font-semibold text-primary tabular-num">{patient.patientId}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={patient.status === 'Active' ? 'default' : patient.status === 'Completed' ? 'outline' : 'secondary'} 
                    className="flex-shrink-0 text-[10px] font-bold rounded-lg px-2"
                  >
                    {patient.status}
                  </Badge>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50">
                  <div>
                    <span className="font-bold text-foreground block text-[10.5px]">Phone</span>
                    <span className="tabular-num">{patient.phone}</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground block text-[10.5px]">Registered</span>
                    <span className="tabular-num">{formatDate(patient.registrationDate)}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-border/40">
                    <div>
                      <span className="font-bold text-foreground block text-[10.5px]">Condition</span>
                      <span className="truncate max-w-[140px] inline-block">{patient.disease || 'General'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground block text-[10.5px]">Due Balance</span>
                      {(optimisticDue[patient.id] ?? 0) > 0 ? (
                        <span className="font-black text-rose-600 dark:text-rose-400 tabular-num">₹{(optimisticDue[patient.id] ?? 0).toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹0 (Paid)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Visit toggle + Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <button
                        onClick={() => handleTogglePresent(patient.id, patient.name, true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer transition-colors active-press"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Done
                      </button>
                    ) : (
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground select-none">
                        <input
                          type="checkbox"
                          checked={isPresent}
                          disabled={isPending}
                          onChange={() => handleTogglePresent(patient.id, patient.name, isPresent)}
                          className="h-4 w-4 rounded-md border-input bg-background text-primary accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        Visit today
                      </label>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/patients/${patient.id}`}>
                      <Button variant="ghost" size="icon-sm" className="rounded-lg hover:text-primary active-press" title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/patients/${patient.id}/edit`}>
                      <Button variant="ghost" size="icon-sm" className="rounded-lg hover:text-primary active-press" title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active-press"
                      disabled={deletingId === patient.id}
                      onClick={() => handleDelete(patient.id, patient.name)}
                      title="Delete Patient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Desktop Table View (≥ md) ── */}
      <div className="hidden md:block card-handmade overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5">ID</TableHead>
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5">Patient Name</TableHead>
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5">Phone</TableHead>
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5">Condition</TableHead>
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5">Status</TableHead>
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5 text-right">Due Balance</TableHead>
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5">Registered</TableHead>
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5 text-center">Visit Today</TableHead>
              <TableHead className="font-extrabold text-xs text-foreground uppercase tracking-wider py-3.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground font-medium">
                  {searchTerm ? 'No patients matching your search criteria.' : 'No patients found.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedPatients.map((patient) => {
                const isPresent = optimisticPresent[patient.id]
                const isDone = optimisticDone[patient.id]
                return (
                  <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                    <TableCell className="font-bold font-mono text-xs text-primary tabular-num">{patient.patientId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 font-black text-xs flex-shrink-0">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground text-sm">{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold tabular-num text-muted-foreground">{patient.phone}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground text-xs font-medium">
                      {patient.disease || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={patient.status === 'Active' ? 'default' : patient.status === 'Completed' ? 'outline' : 'secondary'}
                        className="text-[10px] font-bold rounded-md px-2"
                      >
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(optimisticDue[patient.id] ?? 0) > 0 ? (
                        <span className="font-black text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-900/60 tabular-num">
                          ₹{(optimisticDue[patient.id] ?? 0).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-900/60 tabular-num">
                          ₹0
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-medium tabular-num">
                      {formatDate(patient.registrationDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {isDone ? (
                          <button
                            onClick={() => handleTogglePresent(patient.id, patient.name, true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer transition-colors active-press"
                            title="Marked Done today — click to reset"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Done
                          </button>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isPresent}
                            disabled={isPending}
                            onChange={() => handleTogglePresent(patient.id, patient.name, isPresent)}
                            className="h-4.5 w-4.5 rounded-md border-input bg-background text-primary focus:ring-ring focus:ring-2 focus:ring-offset-2 accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            title={isPresent ? "Scheduled to visit — uncheck to remove" : "Check to schedule visit today"}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="icon-sm" className="rounded-lg hover:text-primary active-press" title="View Patient Profile">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/patients/${patient.id}/edit`}>
                          <Button variant="ghost" size="icon-sm" className="rounded-lg hover:text-primary active-press" title="Edit Patient">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost" 
                          size="icon-sm" 
                          className="rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active-press"
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

      {/* ── Pagination Bar ── */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-card/70 border border-border/80 rounded-2xl shadow-xs text-xs">
          <div className="text-muted-foreground font-medium flex flex-wrap items-center gap-2">
            <span>
              Showing <strong className="text-foreground font-bold tabular-num">{totalItems === 0 ? 0 : startIndex + 1}–{endIndex}</strong> of <strong className="text-foreground font-bold tabular-num">{totalItems}</strong> patients
            </span>
            <span className="text-border">|</span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-background border border-border/80 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-xl text-xs font-semibold"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <div className="px-3 py-1 rounded-xl bg-muted/60 font-bold tabular-num text-xs border border-border/60">
              Page {safeCurrentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-xl text-xs font-semibold"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
