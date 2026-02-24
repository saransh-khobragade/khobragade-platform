export interface Transaction {
  valueDate: string
  transactionDate: string
  chequeNumber: string | null
  transactionRemarks: string
  withdrawalAmount: number
  depositAmount: number
  balance: number
  category?: string
  tags?: string[]
  transactionType?: "debit" | "credit" | "unknown"
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
  period: string
  count: number
  totalAmount: number
  credit: number
  debit: number
}

export interface CategoryAnalysis {
  category: string
  count: number
  totalAmount: number
}
