import path from "node:path"
import { expect, test } from "@playwright/test"

const sampleStatement = path.join(process.cwd(), "e2e/fixtures/icici-sample.xlsx")

test("processes an ICICI statement and shows analysis results", async ({ page }) => {
  await page.goto("/#/expense-analyser")
  await expect(page.getByText("Expense Analyser")).toBeVisible()

  await page.locator('select').selectOption("icici")
  await page.locator('input[type="file"]').setInputFiles(sampleStatement)
  await page.getByRole("button", { name: "Process File" }).click()

  await expect(page.getByText("Analysis Results")).toBeVisible()
  await expect(page.getByText("2 transactions analyzed")).toBeVisible()
  await expect(page.getByText("Total Withdrawals")).toBeVisible()
  await expect(page.getByText("Spending by Category")).toBeVisible()
})
