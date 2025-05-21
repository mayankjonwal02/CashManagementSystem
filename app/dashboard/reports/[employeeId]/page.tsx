"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wallet, CheckCircle, Coins, ArrowLeft } from "lucide-react"

type Employee = {
  _id: string
  name: string
  employeeId: string
}

type PaymentEntry = {
  type: "collection" | "deposit"
  date: string
  amount: number
  runningOutstanding: number
}

export default function EmployeePaymentReportPage() {
  const { token } = useAuth()
  const params = useParams()
  const router = useRouter()
  const employeeId = params.employeeId as string

  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [rowsPerPage, setRowsPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summaryData, setSummaryData] = useState({
    totalCollection: 0,
    totalDeposit: 0,
    totalOutstanding: 0,
  })

  useEffect(() => {
    if (token && employeeId) {
      fetchEmployeeDetails()
      fetchPaymentReport()
    }
  }, [token, employeeId])

  const fetchEmployeeDetails = async () => {
    try {
      const response = await fetch(`https://asterisk-backend-psi.vercel.app/employees/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch employee details")
      }

      const data = await response.json()
      setEmployee(data)
    } catch (error) {
      console.error("Error fetching employee details:", error)
    }
  }

  const fetchPaymentReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://asterisk-backend-psi.vercel.app/reports/payments/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch payment report")
      }

      const data = await response.json()
      setPayments(data)

      // Calculate summary data
      const totalCollection = data
        .filter((entry: PaymentEntry) => entry.type === "collection")
        .reduce((sum: number, entry: PaymentEntry) => sum + entry.amount, 0)

      const totalDeposit = data
        .filter((entry: PaymentEntry) => entry.type === "deposit")
        .reduce((sum: number, entry: PaymentEntry) => sum + entry.amount, 0)

      setSummaryData({
        totalCollection,
        totalDeposit,
        totalOutstanding: totalCollection - totalDeposit,
      })

      // Calculate total pages
      setTotalPages(Math.ceil(data.length / Number.parseInt(rowsPerPage)))
    } catch (error) {
      console.error("Error fetching payment report:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(value)
    setCurrentPage(1)
    setTotalPages(Math.ceil(payments.length / Number.parseInt(value)))
  }

  const paginatedPayments = payments.slice(
    (currentPage - 1) * Number.parseInt(rowsPerPage),
    currentPage * Number.parseInt(rowsPerPage),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-purple-700">
            Employee Payment Report
            {employee && <span className="font-normal text-gray-500 ml-2">- {employee.name}</span>}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                  <Wallet className="h-6 w-6 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Total Collection
                    <br />
                    (MM) Amount
                  </p>
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(summaryData.totalCollection)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Total Deposit
                    <br />
                    Amount
                  </p>
                  <p className="text-2xl font-semibold mt-1 text-green-500">
                    {formatCurrency(summaryData.totalDeposit)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <Coins className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Difference
                    <br />
                    Amount
                  </p>
                  <p className="text-2xl font-semibold mt-1 text-red-500">
                    {formatCurrency(summaryData.totalOutstanding)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Emp. ID</TableHead>
                  <TableHead>Emp. Name</TableHead>
                  <TableHead>Collections (MM)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cash Deposit</TableHead>
                  <TableHead>Deposit Date</TableHead>
                  <TableHead>Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>BGRoad, Karnataka</TableCell>
                    <TableCell>{employee?.employeeId || "1"}</TableCell>
                    <TableCell>{employee?.name || "Mayank"}</TableCell>
                    <TableCell>
                      {payment.type === "collection" ? formatCurrency(payment.amount).replace("₹", "") : ""}
                    </TableCell>
                    <TableCell>{payment.type === "collection" ? formatDate(payment.date) : ""}</TableCell>
                    <TableCell>
                      {payment.type === "deposit" ? formatCurrency(payment.amount).replace("₹", "") : ""}
                    </TableCell>
                    <TableCell>{payment.type === "deposit" ? formatDate(payment.date) : ""}</TableCell>
                    <TableCell>
                      {payment.runningOutstanding === 0
                        ? "-"
                        : formatCurrency(payment.runningOutstanding).replace("₹", "")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Show</span>
                <Select value={rowsPerPage} onValueChange={handleRowsPerPageChange}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">Rows</span>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={currentPage === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  {totalPages > 5 && (
                    <>
                      <PaginationItem>
                        <span className="px-2">...</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          isActive={currentPage === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </>
      )}

      <div className="mt-8 text-center text-sm text-gray-500">Powered by Aestriks</div>
    </div>
  )
}
