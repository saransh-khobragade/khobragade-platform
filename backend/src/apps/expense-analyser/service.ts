import * as XLSX from "xlsx"
import { logger } from "../../lib/logger.js"
import type {
  Transaction,
  ExpenseAnalysis,
  LocationAnalysis,
  TimePeriodAnalysis,
  CategoryAnalysis,
} from "./types.js"

// Extract location from transaction remarks
function extractLocation(remarks: string): string {
  // Try to extract merchant/bank name from UPI transactions
  const upiMatch = remarks.match(/UPI\/([^\/]+)/)
  if (upiMatch) {
    return upiMatch[1].trim()
  }

  // Try to extract from NEFT transactions
  const neftMatch = remarks.match(/NEFT[^-]+-([^-]+)/)
  if (neftMatch) {
    return neftMatch[1].trim()
  }

  // Try to extract from ACH transactions
  const achMatch = remarks.match(/ACH\/([^\/]+)/)
  if (achMatch) {
    return achMatch[1].trim()
  }

  // Try to extract from BIL transactions
  const bilMatch = remarks.match(/BIL[^\/]+\/([^\/]+)/)
  if (bilMatch) {
    return bilMatch[1].trim()
  }

  // Try to extract from VPS/VIN transactions
  const vpsMatch = remarks.match(/(?:VPS|VIN)\/([^\/]+)/)
  if (vpsMatch) {
    return vpsMatch[1].trim()
  }

  // Default: use first part of remarks
  const parts = remarks.split("/")
  return parts[0]?.trim() || "Unknown"
}

// Extract category from transaction remarks
function extractCategory(remarks: string): string {
  const remarkLower = remarks.toLowerCase()

  // Food & Dining
  if (
    remarkLower.includes("restaurant") ||
    remarkLower.includes("food") ||
    remarkLower.includes("subway") ||
    remarkLower.includes("hotel") ||
    remarkLower.includes("cafe")
  ) {
    return "Food & Dining"
  }

  // Shopping
  if (
    remarkLower.includes("myntra") ||
    remarkLower.includes("amazon") ||
    remarkLower.includes("flipkart") ||
    remarkLower.includes("shopping")
  ) {
    return "Shopping"
  }

  // Entertainment
  if (
    remarkLower.includes("bookmyshow") ||
    remarkLower.includes("movie") ||
    remarkLower.includes("cinema") ||
    remarkLower.includes("entertainment")
  ) {
    return "Entertainment"
  }

  // Travel
  if (
    remarkLower.includes("uber") ||
    remarkLower.includes("irctc") ||
    remarkLower.includes("travel") ||
    remarkLower.includes("taxi")
  ) {
    return "Travel"
  }

  // Bills & Utilities
  if (
    remarkLower.includes("bill") ||
    remarkLower.includes("electricity") ||
    remarkLower.includes("water") ||
    remarkLower.includes("gas") ||
    remarkLower.includes("utility")
  ) {
    return "Bills & Utilities"
  }

  // Banking & Investments
  if (
    remarkLower.includes("zerodha") ||
    remarkLower.includes("investment") ||
    remarkLower.includes("trading") ||
    remarkLower.includes("broking")
  ) {
    return "Banking & Investments"
  }

  // Transfers
  if (
    remarkLower.includes("neft") ||
    remarkLower.includes("imps") ||
    remarkLower.includes("transfer") ||
    remarkLower.includes("payment from") ||
    remarkLower.includes("gift")
  ) {
    return "Transfers"
  }

  // Healthcare
  if (
    remarkLower.includes("health") ||
    remarkLower.includes("hospital") ||
    remarkLower.includes("pharmacy") ||
    remarkLower.includes("medical")
  ) {
    return "Healthcare"
  }

  // Other
  return "Other"
}

// Parse Excel file and extract transactions
function parseExcelFile(buffer: Buffer): Transaction[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    logger.info({ rowCount: data.length }, "Excel sheet converted to JSON")

    // Find header row
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i]
      if (!row) continue

      const rowStr = row.map((c) => String(c || "").toLowerCase()).join(" ")

      // Header must contain Date AND (Balance OR Withdrawal OR Deposit OR Description/Remarks)
      const hasDate = rowStr.includes("date")
      const hasAmount = rowStr.includes("balance") || rowStr.includes("withdrawal") || rowStr.includes("deposit") || rowStr.includes("debit") || rowStr.includes("credit")
      const hasDescription = rowStr.includes("remark") || rowStr.includes("description") || rowStr.includes("particulars") || rowStr.includes("narration")

      // Special case for our file which might use different headers
      // We found the problematic row was "Transaction Date from ... to ..."
      // So we want to avoid that.
      // Real header usually has multiple columns.
      if (hasDate && (hasAmount || hasDescription)) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) {
      logger.error({ firstRows: data.slice(0, 10) }, "Could not find header row. Dumping first 10 rows.")
      throw new Error("Could not find header row in Excel file")
    }

    logger.info({ headerRowIndex, headers: data[headerRowIndex] }, "Found header row")

    const headers = data[headerRowIndex]
    const transactions: Transaction[] = []

    // Find column indices
    const valueDateIndex = headers.findIndex((h) =>
      String(h || "").toLowerCase().includes("value date")
    )
    const transactionDateIndex = headers.findIndex((h) =>
      String(h || "").toLowerCase().includes("transaction date")
    )
    const chequeNumberIndex = headers.findIndex((h) =>
      String(h || "").toLowerCase().includes("cheque")
    )
    const remarksIndex = headers.findIndex((h) =>
      String(h || "").toLowerCase().includes("remark")
    )
    const withdrawalIndex = headers.findIndex((h) =>
      String(h || "").toLowerCase().includes("withdrawal")
    )
    const depositIndex = headers.findIndex((h) =>
      String(h || "").toLowerCase().includes("deposit")
    )
    const balanceIndex = headers.findIndex((h) =>
      String(h || "").toLowerCase().includes("balance")
    )

    logger.info(
      {
        indices: {
          valueDateIndex,
          transactionDateIndex,
          chequeNumberIndex,
          remarksIndex,
          withdrawalIndex,
          depositIndex,
          balanceIndex,
        },
      },
      "Column indices found"
    )

    // Parse data rows
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      const valueDate = row[valueDateIndex]
      const transactionDate = row[transactionDateIndex]
      const remarks = row[remarksIndex]

      // Skip empty rows
      if (!valueDate && !transactionDate && !remarks) continue

      const withdrawalAmount =
        parseFloat(String(row[withdrawalIndex] || 0)) || 0
      const depositAmount = parseFloat(String(row[depositIndex] || 0)) || 0
      const balance = parseFloat(String(row[balanceIndex] || 0)) || 0

      // Only include rows with actual transactions (withdrawal or deposit)
      if (withdrawalAmount === 0 && depositAmount === 0) continue

      transactions.push({
        valueDate: valueDate ? String(valueDate) : "",
        transactionDate: transactionDate ? String(transactionDate) : "",
        chequeNumber:
          chequeNumberIndex >= 0 && row[chequeNumberIndex]
            ? String(row[chequeNumberIndex])
            : null,
        transactionRemarks: remarks ? String(remarks) : "",
        withdrawalAmount,
        depositAmount,
        balance,
      })
    }

    logger.info({ parsedCount: transactions.length }, "Finished parsing rows")
    return transactions
  } catch (error) {
    logger.error({ error }, "Failed to parse Excel file")
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Analyze transactions
function analyzeTransactions(transactions: Transaction[]): ExpenseAnalysis {
  // Location analysis
  const locationMap = new Map<string, { count: number; totalAmount: number }>()
  transactions.forEach((tx) => {
    if (tx.withdrawalAmount > 0) {
      const location = extractLocation(tx.transactionRemarks)
      const existing = locationMap.get(location) || { count: 0, totalAmount: 0 }
      locationMap.set(location, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + tx.withdrawalAmount,
      })
    }
  })

  const locationAnalysis: LocationAnalysis[] = Array.from(
    locationMap.entries()
  )
    .map(([location, data]) => ({
      location,
      count: data.count,
      totalAmount: data.totalAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 20) // Top 20 locations

  // Helper function to extract day-wise period from date (YYYY-MM-DD format)
  function extractDayPeriod(dateValue: any): string | null {
    if (!dateValue) return null

    const dateStr = String(dateValue)

    // Try DD/MM/YYYY format
    let dateMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }

    // Try YYYY-MM-DD format
    dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      const [, year, month, day] = dateMatch
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    }

    // Try Excel serial date number
    const serialDate = parseFloat(dateStr)
    if (!isNaN(serialDate) && serialDate > 0 && serialDate < 100000) {
      // Excel serial date (days since 1900-01-01)
      const excelEpoch = new Date(1899, 11, 30) // Excel epoch is Dec 30, 1899
      const date = new Date(excelEpoch.getTime() + serialDate * 86400000)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    // Try to parse as Date object
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    return null
  }

  // Time period analysis (day-wise) - tracks both credit and debit
  const timePeriodMap = new Map<
    string,
    { count: number; totalAmount: number; credit: number; debit: number }
  >()
  transactions.forEach((tx) => {
    if (tx.transactionDate) {
      const period = extractDayPeriod(tx.transactionDate)
      if (period) {
        const existing = timePeriodMap.get(period) || {
          count: 0,
          totalAmount: 0,
          credit: 0,
          debit: 0,
        }
        const credit = tx.depositAmount || 0
        const debit = tx.withdrawalAmount || 0
        timePeriodMap.set(period, {
          count: existing.count + 1,
          totalAmount: existing.totalAmount + debit,
          credit: existing.credit + credit,
          debit: existing.debit + debit,
        })
      }
    }
  })

  const timePeriodAnalysis: TimePeriodAnalysis[] = Array.from(
    timePeriodMap.entries()
  )
    .map(([period, data]) => ({
      period,
      count: data.count,
      totalAmount: data.totalAmount,
      credit: data.credit,
      debit: data.debit,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))

  // Category analysis
  const categoryMap = new Map<string, { count: number; totalAmount: number }>()
  transactions.forEach((tx) => {
    if (tx.withdrawalAmount > 0) {
      const category = extractCategory(tx.transactionRemarks)
      const existing = categoryMap.get(category) || {
        count: 0,
        totalAmount: 0,
      }
      categoryMap.set(category, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + tx.withdrawalAmount,
      })
    }
  })

  const categoryAnalysis: CategoryAnalysis[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      totalAmount: data.totalAmount,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)

  // Calculate totals
  const totalWithdrawals = transactions.reduce(
    (sum, tx) => sum + tx.withdrawalAmount,
    0
  )
  const totalDeposits = transactions.reduce(
    (sum, tx) => sum + tx.depositAmount,
    0
  )
  const netAmount = totalDeposits - totalWithdrawals

  return {
    transactions,
    locationAnalysis,
    timePeriodAnalysis,
    categoryAnalysis,
    totalWithdrawals,
    totalDeposits,
    netAmount,
  }
}

export const expenseAnalyserService = {
  processFile: async (fileBuffer: Buffer): Promise<ExpenseAnalysis> => {
    try {
      logger.info("Processing expense file")
      const transactions = parseExcelFile(fileBuffer)
      logger.info({ transactionCount: transactions.length }, "Parsed transactions")

      if (transactions.length === 0) {
        throw new Error("No transactions found in the file")
      }

      const analysis = analyzeTransactions(transactions)
      logger.info("Expense analysis completed")
      return analysis
    } catch (error) {
      logger.error({ err: error }, "Failed to process expense file")
      throw error
    }
  },
}
