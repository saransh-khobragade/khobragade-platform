import { expect, test } from "@playwright/test"

test("formats valid JSON", async ({ page }) => {
  await page.goto("/#/json-formatter")
  await expect(page.getByText("JSON Formatter")).toBeVisible()

  await page.getByPlaceholder('{"key": "value"}').fill('{"name":"Khobragade","count":1}')
  await page.getByRole("button", { name: "Format JSON" }).click()

  const output = page.locator("textarea[readonly]")
  await expect(output).toHaveValue(/"name": "Khobragade"/)
  await expect(output).toHaveValue(/"count": 1/)
})

test("shows an error for invalid JSON", async ({ page }) => {
  await page.goto("/#/json-formatter")

  await page.getByPlaceholder('{"key": "value"}').fill("{invalid json")
  await page.getByRole("button", { name: "Format JSON" }).click()

  await expect(page.getByText("Error:")).toBeVisible()
})

test("compares identical and different JSON objects", async ({ page }) => {
  await page.goto("/#/json-compare")
  await expect(page.getByText("JSON Compare")).toBeVisible()

  const leftInput = page.locator("textarea").nth(0)
  const rightInput = page.locator("textarea").nth(1)

  await leftInput.fill('{"status":"ok"}')
  await rightInput.fill('{"status":"ok"}')
  await page.getByRole("button", { name: "Compare JSON" }).click()
  await expect(page.getByText("JSON objects are identical")).toBeVisible()

  await rightInput.fill('{"status":"fail"}')
  await page.getByRole("button", { name: "Compare JSON" }).click()
  await expect(page.getByText("Found 1 difference")).toBeVisible()
})
