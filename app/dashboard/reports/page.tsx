"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

type Employee = {
  _id: string
  name: string
  employeeId: string
}

export default function EmployeeReportsPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    if (token) {
      fetchEmployees()
    }
  }, [token])

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

      // If there are employees, select the first one by default
      if (data.length > 0) {
        setSelectedEmployee(data[0]._id)
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value)
  }

  const handleViewReport = () => {
    if (selectedEmployee) {
      router.push(`/dashboard/reports/${selectedEmployee}`)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-purple-700 mb-6">Employee Payment Reports</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select Employee</CardTitle>
            <CardDescription>Choose an employee to view their detailed payment report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
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
              </div>

              <Button
                onClick={handleViewReport}
                disabled={!selectedEmployee}
                className="w-fit bg-purple-700 hover:bg-purple-800 text-white"
              >
                View Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
