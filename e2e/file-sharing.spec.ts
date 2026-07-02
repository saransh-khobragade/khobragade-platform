import path from "node:path"
import { expect, test } from "@playwright/test"
import { registerAndOpenApp } from "./helpers/auth"

const sampleFile = path.join(process.cwd(), "e2e/fixtures/sample.txt")

test("creates a file share link", async ({ page }) => {
  await registerAndOpenApp(page, "/#/file-sharing")
  await expect(page.getByRole("heading", { name: "File Sharing", exact: true, level: 1 })).toBeVisible()

  await page.locator("#file-select").setInputFiles(sampleFile)
  await expect(page.getByText("sample.txt")).toBeVisible()

  await page.getByRole("button", { name: "Create Share Link" }).click()
  await expect(page.getByText("Share Link:")).toBeVisible()

  const shareInput = page.locator('input[readonly][value*="#/file-sharing/receive/"]')
  await expect(shareInput).toBeVisible()
})
