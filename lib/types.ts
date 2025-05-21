export type Employee = {
  _id: string
  name: string
  employeeId: string
}

export type Collection = {
  _id: string
  employeeId: string
  date: string
  amount: number
}

export type Deposit = {
  _id: string
  employeeId: string
  date: string
  amount: number
}

export type OutstandingReport = {
  employee: Employee
  totalCollection: number
  totalDeposit: number
  outstanding: number
  mostRecentDate: string
}

export type PaymentEntry = {
  type: "collection" | "deposit"
  date: string
  amount: number
  runningOutstanding: number
}
