import * as XLSX from "xlsx"
import { logger } from "../../lib/logger.js"
import type {
  Transaction,
  ExpenseAnalysis,
  LocationAnalysis,
  TimePeriodAnalysis,
  CategoryAnalysis,
} from "./types.js"
import mapping from "./mapping.json"

function parseAmountCell(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "number") return Number.isFinite(value) ? value : 0

  const raw = String(value).trim()
  if (!raw) return 0

  const cleaned = raw.replace(/,/g, "").replace(/[^\d.\-]/g, "")
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function findFirstHeaderIndex(headers: any[], aliases: string[]): number {
  return headers.findIndex((header) => {
    const lower = String(header || "").toLowerCase()
    return aliases.some((alias) => lower.includes(alias))
  })
}

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
  for (const category of mapping.categories) {
    if (category.keywords.some((keyword) => remarkLower.includes(keyword.toLowerCase()))) {
      return category.name
    }
  }
  return mapping.defaultCategory
}

function extractTags(remarks: string): string[] {
  const tags: string[] = []
  const remarkLower = remarks.toLowerCase()

  for (const method of mapping.tags.paymentMethods) {
    if (remarks.toUpperCase().includes(method.toUpperCase())) {
      tags.push(method)
    }
  }

  const upiMatch = remarks.match(new RegExp(mapping.tags.upiMerchantRegex, "i"))
  if (upiMatch && upiMatch[1]) {
    const merchant = upiMatch[1].trim().split("@")[0]
    const suffixPattern = mapping.tags.upiMerchantCleanupSuffixes.join("|")
    const cleanMerchant = merchant.replace(new RegExp(`\\s+(${suffixPattern})$`, "i"), "").trim()
    if (cleanMerchant && cleanMerchant.length > 2) {
      tags.push(cleanMerchant)
    }
  }

  for (const bank of mapping.tags.bankNames) {
    if (remarks.toUpperCase().includes(bank.toUpperCase())) {
      tags.push(bank)
    }
  }

  for (const merchantRule of mapping.tags.merchantKeywords) {
    if (remarkLower.includes(merchantRule.keyword.toLowerCase())) {
      tags.push(merchantRule.tag)
    }
  }

  return [...new Set(tags)]
}

// Parse ICICI Bank Excel file and extract transactions
function parseICICIExcelFile(buffer: Buffer): Transaction[] {
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
      const hasDescription = rowStr.includes("remark") || rowStr.includes("description") || rowStr.includes("particulars")

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
    const withdrawalIndex = findFirstHeaderIndex(headers, ["withdrawal", "debit", "dr"])
    const depositIndex = findFirstHeaderIndex(headers, ["deposit", "credit", "cr"])
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
        withdrawalIndex >= 0 ? Math.max(0, parseAmountCell(row[withdrawalIndex])) : 0
      const depositAmount =
        depositIndex >= 0 ? Math.max(0, parseAmountCell(row[depositIndex])) : 0
      const balance = balanceIndex >= 0 ? parseAmountCell(row[balanceIndex]) : 0

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
    logger.error({ error }, "Failed to parse ICICI Excel file")
    throw new Error(`Failed to parse ICICI Excel file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Parse HDFC Bank Excel file and extract transactions
function parseHDFCExcelFile(buffer: Buffer): Transaction[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    logger.info({ rowCount: data.length }, "Excel sheet converted to JSON")

    // Find header row - HDFC uses "Narration" column
    // HDFC files have metadata rows at the top, so we need to search more rows
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(50, data.length); i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // Check if this row contains the header columns
      const rowLower = row.map((c) => String(c || "").toLowerCase())
      const rowStr = rowLower.join(" ")

      // Header must contain Date AND Narration AND (Withdrawal OR Deposit)
      const hasDate = rowLower.some((c) => c.includes("date") && !c.includes("value"))
      const hasValueDate = rowLower.some((c) => c.includes("value"))
      const hasNarration = rowLower.some((c) => c.includes("narration"))
      const hasWithdrawal = rowLower.some((c) => c.includes("withdrawal"))
      const hasDeposit = rowLower.some((c) => c.includes("deposit"))
      const hasBalance = rowLower.some((c) => c.includes("balance") || c.includes("closing"))

      // More specific check: header should have Date, Narration, and at least one amount column
      if (hasDate && hasNarration && (hasWithdrawal || hasDeposit || hasBalance)) {
        // Verify this looks like a proper header row (should have multiple columns)
        const nonEmptyColumns = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== "").length
        if (nonEmptyColumns >= 5) {
          headerRowIndex = i
          logger.info({ headerRowIndex, rowPreview: row.slice(0, 7) }, "Found potential header row")
          break
        }
      }
    }

    if (headerRowIndex === -1) {
      logger.error({ firstRows: data.slice(0, 30) }, "Could not find header row. Dumping first 30 rows.")
      throw new Error("Could not find header row in HDFC Excel file")
    }

    logger.info({ headerRowIndex, headers: data[headerRowIndex] }, "Found header row")

    const headers = data[headerRowIndex]
    const transactions: Transaction[] = []

    // Find column indices for HDFC format
    // Date, Narration, Chq./Ref.No., Value Dt, Withdrawal Amt., Deposit Amt., Closing Balance
    const transactionDateIndex = headers.findIndex((h) => {
      const hLower = String(h || "").toLowerCase()
      return hLower.includes("date") && !hLower.includes("value")
    })
    const valueDateIndex = headers.findIndex((h) => {
      const hLower = String(h || "").toLowerCase()
      return hLower.includes("value")
    })
    const narrationIndex = headers.findIndex((h) => {
      const hLower = String(h || "").toLowerCase()
      return hLower.includes("narration")
    })
    const chequeNumberIndex = headers.findIndex((h) => {
      const hLower = String(h || "").toLowerCase()
      return hLower.includes("chq") || hLower.includes("ref") || hLower.includes("cheque")
    })
    const withdrawalIndex = findFirstHeaderIndex(headers, ["withdrawal", "debit", "dr"])
    const depositIndex = findFirstHeaderIndex(headers, ["deposit", "credit", "cr"])
    const balanceIndex = headers.findIndex((h) => {
      const hLower = String(h || "").toLowerCase()
      return hLower.includes("closing") || (hLower.includes("balance") && !hLower.includes("opening"))
    })

    logger.info(
      {
        indices: {
          valueDateIndex,
          transactionDateIndex,
          chequeNumberIndex,
          narrationIndex,
          withdrawalIndex,
          depositIndex,
          balanceIndex,
        },
        headers: headers,
      },
      "HDFC column indices found"
    )

    // Validate that we found critical columns
    if (narrationIndex === -1) {
      throw new Error("Could not find 'Narration' column in HDFC Excel file")
    }
    if (transactionDateIndex === -1 && valueDateIndex === -1) {
      throw new Error("Could not find 'Date' column in HDFC Excel file")
    }
    if (withdrawalIndex === -1 && depositIndex === -1) {
      throw new Error("Could not find 'Withdrawal' or 'Deposit' column in HDFC Excel file")
    }

    // Parse data rows
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i]
      if (!row || row.length === 0) continue

      // HDFC statement summary is a footer section, not transactional data.
      // Once it starts, stop parsing further rows.
      const rowText = row.map((cell) => String(cell || "").toLowerCase()).join(" ")
      if (rowText.includes("statement summary")) {
        break
      }

      const valueDate = row[valueDateIndex]
      const transactionDate = row[transactionDateIndex]
      const narration = row[narrationIndex]

      // Skip empty rows
      if (!valueDate && !transactionDate && !narration) continue

      // Skip summary rows (HDFC statements often have summary rows at the end)
      if (String(narration || "").toLowerCase().includes("statement summary") ||
          String(narration || "").toLowerCase().includes("opening balance") ||
          String(narration || "").toLowerCase().includes("closing balance") ||
          String(narration || "").toLowerCase().includes("total")) {
        continue
      }

      const withdrawalAmount =
        withdrawalIndex >= 0 ? Math.max(0, parseAmountCell(row[withdrawalIndex])) : 0
      const depositAmount =
        depositIndex >= 0 ? Math.max(0, parseAmountCell(row[depositIndex])) : 0
      const balance = balanceIndex >= 0 ? parseAmountCell(row[balanceIndex]) : 0

      // Only include rows with actual transactions (withdrawal or deposit)
      if (withdrawalAmount === 0 && depositAmount === 0) continue

      transactions.push({
        valueDate: valueDate ? String(valueDate) : "",
        transactionDate: transactionDate ? String(transactionDate) : "",
        chequeNumber:
          chequeNumberIndex >= 0 && row[chequeNumberIndex]
            ? String(row[chequeNumberIndex])
            : null,
        transactionRemarks: narration ? String(narration) : "",
        withdrawalAmount,
        depositAmount,
        balance,
      })
    }

    logger.info({ parsedCount: transactions.length }, "Finished parsing HDFC rows")
    return transactions
  } catch (error) {
    logger.error({ error }, "Failed to parse HDFC Excel file")
    throw new Error(`Failed to parse HDFC Excel file: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Analyze transactions
function analyzeTransactions(transactions: Transaction[]): ExpenseAnalysis {
  const getTransactionType = (
    tx: Transaction
  ): "debit" | "credit" | "unknown" => {
    if (tx.withdrawalAmount > 0) return "debit"
    if (tx.depositAmount > 0) return "credit"
    return "unknown"
  }

  const enrichedTransactions = transactions.map((tx) => ({
    ...tx,
    category: extractCategory(tx.transactionRemarks),
    tags: extractTags(tx.transactionRemarks),
    transactionType: getTransactionType(tx),
  }))

  // Location analysis
  const locationMap = new Map<string, { count: number; totalAmount: number }>()
  enrichedTransactions.forEach((tx) => {
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
  enrichedTransactions.forEach((tx) => {
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
  enrichedTransactions.forEach((tx) => {
    if (tx.withdrawalAmount > 0) {
      const category = tx.category || mapping.defaultCategory
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
  const totalWithdrawals = enrichedTransactions.reduce(
    (sum, tx) => sum + tx.withdrawalAmount,
    0
  )
  const totalDeposits = enrichedTransactions.reduce(
    (sum, tx) => sum + tx.depositAmount,
    0
  )
  const netAmount = totalDeposits - totalWithdrawals

  return {
    transactions: enrichedTransactions,
    locationAnalysis,
    timePeriodAnalysis,
    categoryAnalysis,
    totalWithdrawals,
    totalDeposits,
    netAmount,
  }
}

export const expenseAnalyserService = {
  processFile: async (fileBuffer: Buffer, bankType: string = "icici"): Promise<ExpenseAnalysis> => {
    try {
      logger.info({ bankType }, "Processing expense file")
      
      let transactions: Transaction[]
      if (bankType === "hdfc") {
        transactions = parseHDFCExcelFile(fileBuffer)
      } else {
        transactions = parseICICIExcelFile(fileBuffer)
      }
      
      logger.info({ transactionCount: transactions.length, bankType }, "Parsed transactions")

      if (transactions.length === 0) {
        throw new Error("No transactions found in the file")
      }

      const analysis = analyzeTransactions(transactions)
      logger.info("Expense analysis completed")
      return analysis
    } catch (error) {
      logger.error({ err: error, bankType }, "Failed to process expense file")
      throw error
    }
  },
}
