"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

type Employee = {
  _id: string
  name: string
  employeeId: string
}

type EmployeeEntry = {
  employeeId: string
  collectionAmount: string
  collectionDate: string
  depositAmount: string
  depositDate: string
}

type InsertEmployeeDataModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InsertEmployeeDataModal({ open, onOpenChange, onSuccess }: InsertEmployeeDataModalProps) {
  const { token } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [entries, setEntries] = useState<EmployeeEntry[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open && token) {
      fetchEmployees()
    }
  }, [open, token])

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setEntries([])
      setError("")
      setSuccess(false)
    }
  }, [open])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const response = await fetch("https://asterisk-backend-psi.vercel.app/employees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch employees")
      }

      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error("Error fetching employees:", error)
      setError("Failed to load employees. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        employeeId: "",
        collectionAmount: "",
        collectionDate: new Date().toISOString().split("T")[0],
        depositAmount: "",
        depositDate: new Date().toISOString().split("T")[0],
      },
    ])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: keyof EmployeeEntry, value: string) => {
    const newEntries = [...entries]
    newEntries[index] = {
      ...newEntries[index],
      [field]: value,
    }
    setEntries(newEntries)
  }

  const handleSubmit = async () => {
    setError("")
    setSuccess(false)

    // Validate entries
    const invalidEntries = entries.filter(
      (entry) => !entry.employeeId || (!entry.collectionAmount && !entry.depositAmount),
    )

    if (invalidEntries.length > 0) {
      setError("Please select an employee and enter at least one amount for each entry.")
      return
    }

    setSubmitting(true)

    try {
      // Prepare collections data
      const collections = entries
        .filter((entry) => entry.employeeId && entry.collectionAmount && Number.parseFloat(entry.collectionAmount) > 0)
        .map((entry) => ({
          employeeId: entry.employeeId,
          date: entry.collectionDate,
          amount: Number.parseFloat(entry.collectionAmount),
        }))

      // Prepare deposits data
      const deposits = entries
        .filter((entry) => entry.employeeId && entry.depositAmount && Number.parseFloat(entry.depositAmount) > 0)
        .map((entry) => ({
          employeeId: entry.employeeId,
          date: entry.depositDate,
          amount: Number.parseFloat(entry.depositAmount),
        }))

      // Submit collections if any
      if (collections.length > 0) {
        const collectionsResponse = await fetch("https://asterisk-backend-psi.vercel.app/collections/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ collections }),
        })

        if (!collectionsResponse.ok) {
          const errorData = await collectionsResponse.json()
          throw new Error(errorData.message || "Failed to submit collections")
        }
      }

      // Submit deposits if any
      if (deposits.length > 0) {
        const depositsResponse = await fetch("https://asterisk-backend-psi.vercel.app/deposits/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deposits }),
        })

        if (!depositsResponse.ok) {
          const errorData = await depositsResponse.json()
          throw new Error(errorData.message || "Failed to submit deposits")
        }
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        onSuccess()
      }, 1500)
    } catch (error: any) {
      console.error("Error submitting data:", error)
      setError(error.message || "Failed to submit data. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getEmployeeName = (id: string) => {
    const employee = employees.find((emp) => emp._id === id)
    return employee ? employee.name : ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Insert Employee Data</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">Data submitted successfully!</AlertDescription>
              </Alert>
            )}

            <div className="mb-4">
              <Button onClick={addEntry} className="flex items-center gap-1" disabled={submitting}>
                <Plus className="h-4 w-4" />
                Add Employee Entry
              </Button>
            </div>

            {entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Collection Amount</TableHead>
                    <TableHead>Collection Date</TableHead>
                    <TableHead>Deposit Amount</TableHead>
                    <TableHead>Deposit Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={entry.employeeId}
                          onValueChange={(value) => updateEntry(index, "employeeId", value)}
                          disabled={submitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee._id} value={employee._id}>
                                {employee.name} ({employee.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={entry.collectionAmount}
                          onChange={(e) => updateEntry(index, "collectionAmount", e.target.value)}
                          disabled={submitting}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={entry.collectionDate}
                          onChange={(e) => updateEntry(index, "collectionDate", e.target.value)}
                          disabled={submitting}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={entry.depositAmount}
                          onChange={(e) => updateEntry(index, "depositAmount", e.target.value)}
                          disabled={submitting}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={entry.depositDate}
                          onChange={(e) => updateEntry(index, "depositDate", e.target.value)}
                          disabled={submitting}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeEntry(index)} disabled={submitting}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No entries added. Click "Add Employee Entry" to begin.
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={entries.length === 0 || submitting || loading}
            className="bg-purple-700 hover:bg-purple-800 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
