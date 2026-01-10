export interface Transaction {
  valueDate: string
  transactionDate: string
  chequeNumber: string | null
  transactionRemarks: string
  withdrawalAmount: number
  depositAmount: number
  balance: number
}

export interface ExpenseAnalysis {
  transactions: Transaction[]
  locationAnalysis: LocationAnalysis[]
  timePeriodAnalysis: TimePeriodAnalysis[]
  categoryAnalysis: CategoryAnalysis[]
  totalWithdrawals: number
  totalDeposits: number
  netAmount: number
}

export interface LocationAnalysis {
  location: string
  count: number
  totalAmount: number
}

export interface TimePeriodAnalysis {
  period: string // e.g., "2025-06-15", "2025-06-16" (YYYY-MM-DD format)
  count: number
  totalAmount: number
  credit: number // Total deposits (credit) for this period
  debit: number // Total withdrawals (debit) for this period
}

export interface CategoryAnalysis {
  category: string
  count: number
  totalAmount: number
}
