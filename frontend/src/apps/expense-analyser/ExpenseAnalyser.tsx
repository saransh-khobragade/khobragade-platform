import { useState, useRef, useMemo } from "react"
import { Upload, Loader2, TrendingUp, Tag, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts"
import { useExpenseAnalyser } from "./hooks/useExpenseAnalyser.js"

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
  "#87ceeb",
]

// Extract category from transaction remarks (same logic as backend)
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

// Extract tags from transaction remarks
function extractTags(remarks: string): string[] {
  const tags: string[] = []
  const remarkLower = remarks.toLowerCase()

  // Payment methods
  if (remarks.includes("UPI")) tags.push("UPI")
  if (remarks.includes("NEFT")) tags.push("NEFT")
  if (remarks.includes("IMPS")) tags.push("IMPS")
  if (remarks.includes("RTGS")) tags.push("RTGS")
  if (remarks.includes("ACH")) tags.push("ACH")

  // Extract merchant names from UPI transactions
  // Pattern: UPI/MerchantName/...
  const upiMatch = remarks.match(/UPI\/([^\/]+)/i)
  if (upiMatch && upiMatch[1]) {
    const merchant = upiMatch[1].trim()
    // Clean up common suffixes
    const cleanMerchant = merchant
      .replace(/\s+(ind|pvt|ltd|limited|inc)$/i, "")
      .trim()
    if (cleanMerchant && cleanMerchant.length > 2) {
      tags.push(cleanMerchant)
    }
  }

  // Extract bank names
  const bankNames = [
    "AXIS BANK", "HDFC BANK", "ICICI BANK", "SBI", "STATE BANK",
    "KOTAK", "PNB", "BOI", "CANARA", "UNION BANK", "RBL", "YES BANK",
    "INDUSIND", "FEDERAL BANK", "IDFC", "BANDHAN BANK"
  ]
  bankNames.forEach(bank => {
    if (remarks.toUpperCase().includes(bank)) {
      tags.push(bank)
    }
  })

  // Common merchant patterns
  if (remarkLower.includes("amazon")) tags.push("Amazon")
  if (remarkLower.includes("flipkart")) tags.push("Flipkart")
  if (remarkLower.includes("myntra")) tags.push("Myntra")
  if (remarkLower.includes("swiggy")) tags.push("Swiggy")
  if (remarkLower.includes("zomato")) tags.push("Zomato")
  if (remarkLower.includes("uber")) tags.push("Uber")
  if (remarkLower.includes("ola")) tags.push("Ola")
  if (remarkLower.includes("irctc")) tags.push("IRCTC")
  if (remarkLower.includes("bookmyshow")) tags.push("BookMyShow")
  if (remarkLower.includes("zerodha")) tags.push("Zerodha")

  return [...new Set(tags)] // Remove duplicates
}

export function ExpenseAnalyser() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [bankType, setBankType] = useState<string>("icici")
  const { analysis, loading, error, processFile, reset } = useExpenseAnalyser()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      reset()
    }
  }

  const handleUpload = async () => {
    if (selectedFile) {
      await processFile(selectedFile, bankType)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setSelectedCategory(null)
    setSelectedTag(null)
    reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Get transactions for selected category, sorted by withdrawal amount descending
  const getCategoryTransactions = () => {
    if (!analysis || !selectedCategory) return []
    
    return analysis.transactions
      .filter((tx) => {
        if (tx.withdrawalAmount === 0) return false
        const category = extractCategory(tx.transactionRemarks)
        return category === selectedCategory
      })
      .sort((a, b) => b.withdrawalAmount - a.withdrawalAmount)
  }

  // Extract and analyze tags from category transactions
  const categoryTags = useMemo(() => {
    if (!analysis || !selectedCategory) return []
    
    // Get category transactions directly
    const transactions = analysis.transactions
      .filter((tx) => {
        if (tx.withdrawalAmount === 0) return false
        const category = extractCategory(tx.transactionRemarks)
        return category === selectedCategory
      })
    
    const tagMap = new Map<string, { count: number; totalAmount: number }>()
    
    transactions.forEach((tx) => {
      const tags = extractTags(tx.transactionRemarks)
      tags.forEach((tag) => {
        const existing = tagMap.get(tag) || { count: 0, totalAmount: 0 }
        tagMap.set(tag, {
          count: existing.count + 1,
          totalAmount: existing.totalAmount + tx.withdrawalAmount,
        })
      })
    })
    
    return Array.from(tagMap.entries())
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        totalAmount: data.totalAmount,
      }))
      .sort((a, b) => b.count - a.count) // Sort by frequency
  }, [analysis, selectedCategory])

  // Get filtered transactions (by category and optionally by tag)
  const getFilteredTransactions = () => {
    let transactions = getCategoryTransactions()
    
    if (selectedTag) {
      transactions = transactions.filter((tx) => {
        const tags = extractTags(tx.transactionRemarks)
        return tags.includes(selectedTag)
      })
    }
    
    return transactions
  }

  // Calculate total amount for filtered transactions
  const getTotalAmount = () => {
    return getFilteredTransactions().reduce(
      (sum, tx) => sum + tx.withdrawalAmount,
      0
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            <CardTitle>Expense Analyser</CardTitle>
          </div>
          <CardDescription>
            Upload your transaction history Excel file to analyze your spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analysis && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Bank:</label>
                <select
                  value={bankType}
                  onChange={(e) => setBankType(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="icici">ICICI Bank</option>
                  <option value="hdfc">HDFC Bank</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Excel File:</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  className="w-full p-2 border rounded-md bg-background"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Process File
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {analysis && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Analysis Results</h3>
                  <p className="text-sm text-muted-foreground">
                    {analysis.transactions.length} transactions analyzed
                  </p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Upload New File
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Withdrawals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹{analysis.totalWithdrawals.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Deposits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₹{analysis.totalDeposits.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Net Amount</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        analysis.netAmount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{analysis.netAmount.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transaction Trend */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <CardTitle>Transaction Trend</CardTitle>
                  </div>
                  <CardDescription>
                    Credit and debit transactions day by day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analysis.timePeriodAnalysis}>
                      <XAxis 
                        dataKey="period" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tickFormatter={(value) => {
                          // Format YYYY-MM-DD to DD/MM
                          const parts = value.split("-")
                          if (parts.length === 3) {
                            return `${parts[2]}/${parts[1]}`
                          }
                          return value
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number | undefined) =>
                          value !== undefined
                            ? `₹${value.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}`
                            : ""
                        }
                        labelFormatter={(value) => {
                          // Format YYYY-MM-DD to DD/MM/YYYY
                          const parts = value.split("-")
                          if (parts.length === 3) {
                            return `${parts[2]}/${parts[1]}/${parts[0]}`
                          }
                          return value
                        }}
                      />
                      <Legend />
                      <Bar dataKey="credit" fill="#82ca9d" name="Credit (₹)" />
                      <Bar dataKey="debit" fill="#ff7300" name="Debit (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Analysis */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    <CardTitle>Spending by Category</CardTitle>
                  </div>
                  <CardDescription>
                    Breakdown of expenses by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={analysis.categoryAnalysis as any}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="totalAmount"
                        >
                          {analysis.categoryAnalysis.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number | undefined, _name: string | undefined, props: any) => {
                            if (value === undefined) return ["", ""]
                            const percent = ((value / analysis.categoryAnalysis.reduce((sum, item) => sum + item.totalAmount, 0)) * 100).toFixed(1)
                            return [
                              `₹${value.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })} (${percent}%)`,
                              props.payload.category
                            ]
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      <h4 className="font-semibold mb-4">Category Breakdown</h4>
                      {analysis.categoryAnalysis.map((category, index) => (
                        <div
                          key={category.category}
                          onClick={() => setSelectedCategory(category.category)}
                          className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                            selectedCategory === category.category
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            <span className="font-medium">{category.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">
                              ₹{category.totalAmount.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {category.count} transactions
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Wise Transactions Table */}
              {selectedCategory && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        <CardTitle>Category wise transactions</CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(null)
                          setSelectedTag(null)
                        }}
                      >
                        Close
                      </Button>
                    </div>
                    <CardDescription>
                      {selectedCategory}
                      {selectedTag && ` • ${selectedTag}`} - {getFilteredTransactions().length} transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Total Amount Display */}
                    <div className={`p-4 rounded-lg border ${
                      selectedTag 
                        ? "bg-primary/10 border-primary/20" 
                        : "bg-secondary/50 border-border"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          {selectedTag ? `Total Amount (${selectedTag}):` : "Total Amount:"}
                        </span>
                        <span className={`text-2xl font-bold ${
                          selectedTag ? "text-primary" : "text-foreground"
                        }`}>
                          ₹{getTotalAmount().toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Tags Section */}
                    {categoryTags.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">Tags:</span>
                          {selectedTag && (
                            <button
                              onClick={() => setSelectedTag(null)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              All ({getCategoryTransactions().length})
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          {categoryTags.map((tagInfo) => {
                            const isSelected = selectedTag === tagInfo.tag
                            return (
                              <button
                                key={tagInfo.tag}
                                onClick={() => setSelectedTag(isSelected ? null : tagInfo.tag)}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                              >
                                {tagInfo.tag} ({tagInfo.count})
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Transactions Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-semibold">Date</th>
                            <th className="text-left p-2 font-semibold">Transaction Remarks</th>
                            <th className="text-right p-2 font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredTransactions().map((tx, index) => (
                            <tr
                              key={index}
                              className="border-b hover:bg-accent/50"
                            >
                              <td className="p-2 text-sm">
                                {tx.transactionDate || tx.valueDate}
                              </td>
                              <td className="p-2 text-sm">{tx.transactionRemarks}</td>
                              <td className="p-2 text-sm text-right font-medium">
                                ₹{tx.withdrawalAmount.toLocaleString("en-IN", {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
