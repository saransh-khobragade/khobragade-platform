import { expect, test } from "@playwright/test"

test("converts text to an MD5 hash", async ({ page }) => {
  await page.goto("/#/md5-converter")
  await expect(page.getByText("MD5 Converter")).toBeVisible()

  await page.getByPlaceholder("Enter text to convert...").fill("hello")
  await page.getByRole("button", { name: "Convert" }).click()

  const hashInput = page.locator('label:has-text("MD5 Hash:") + div input')
  await expect(hashInput).toHaveValue("5d41402abc4b2a76b9719d911017c592")
})
