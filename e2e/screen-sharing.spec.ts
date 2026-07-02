import { expect, test } from "@playwright/test"
import { registerAndOpenApp } from "./helpers/auth"

test("creates a screen sharing link", async ({ page }) => {
  await registerAndOpenApp(page, "/#/screen-sharing")
  await expect(page.getByRole("heading", { name: "Screen Sharing", exact: true, level: 1 })).toBeVisible()

  await page.getByRole("button", { name: "Start Sharing" }).click()

  await expect(page.getByText("Share URL")).toBeVisible()
  const shareInput = page.locator('input[readonly][value*="#/screen-sharing/view/"]')
  await expect(shareInput).toBeVisible()
})
