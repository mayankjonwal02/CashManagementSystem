"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
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
import { Loader2, Wallet, CheckCircle, Coins } from "lucide-react"
import { InsertEmployeeDataModal } from "@/components/insert-employee-data-modal"

type Employee = {
  _id: string
  name: string
  employeeId: string
}

type OutstandingReport = {
  employee: Employee
  totalCollection: number
  totalDeposit: number
  outstanding: number
  mostRecentDate: string
}

export default function OutstandingReportPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<OutstandingReport[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [summaryData, setSummaryData] = useState({
    totalCollection: 0,
    totalDeposit: 0,
    totalOutstanding: 0,
  })

  useEffect(() => {
    if (token) {
      fetchOutstandingReport()
    }
  }, [token])

  const fetchOutstandingReport = async () => {
    setLoading(true)
    try {
      const response = await fetch("https://asterisk-backend-psi.vercel.app/reports/outstanding", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch outstanding report")
      }

      const data = await response.json()
      setReports(data)

      // Calculate summary data
      const totalCollection = data.reduce((sum: number, item: OutstandingReport) => sum + item.totalCollection, 0)
      const totalDeposit = data.reduce((sum: number, item: OutstandingReport) => sum + item.totalDeposit, 0)

      setSummaryData({
        totalCollection,
        totalDeposit,
        totalOutstanding: totalCollection - totalDeposit,
      })

      // Calculate total pages
      setTotalPages(Math.ceil(data.length / Number.parseInt(rowsPerPage)))
    } catch (error) {
      console.error("Error fetching outstanding report:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(value)
    setCurrentPage(1)
    setTotalPages(Math.ceil(reports.length / Number.parseInt(value)))
  }

  const paginatedReports = reports.slice(
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-purple-700">Outstanding Report (All Locations)</h1>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span>Dashboard</span>
            <span className="mx-2">›</span>
            <span>Outstanding Report</span>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          Insert Employee Data
        </Button>
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
                    Total Collection (MM)
                    <br />
                    (All Locations)
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
                    Total Deposit Amount
                    <br />
                    (All Locations)
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
                    Difference Amount
                    <br />
                    (All Locations)
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
                  <TableHead>Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReports.map((report) => (
                  <TableRow key={report.employee._id}>
                    <TableCell>BGRoad, Karnataka</TableCell>
                    <TableCell>{report.employee.employeeId}</TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/reports/${report.employee._id}`}
                        className="text-purple-700 hover:underline"
                      >
                        {report.employee.name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatCurrency(report.totalCollection).replace("₹", "")}</TableCell>
                    <TableCell>{report.mostRecentDate ? formatDate(report.mostRecentDate) : "-"}</TableCell>
                    <TableCell className={report.outstanding < 0 ? "text-green-500" : "text-red-500"}>
                      {report.outstanding < 0
                        ? `(-)${formatCurrency(Math.abs(report.outstanding)).replace("₹", "")}`
                        : formatCurrency(report.outstanding).replace("₹", "")}
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

      <InsertEmployeeDataModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={fetchOutstandingReport} />

      <div className="mt-8 text-center text-sm text-gray-500">Powered by Aestriks</div>
    </div>
  )
}
