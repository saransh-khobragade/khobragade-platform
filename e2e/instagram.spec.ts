import path from "node:path"
import { expect, test } from "@playwright/test"
import { registerAndOpenApp } from "./helpers/auth"
import { uniqueId } from "./helpers/test-data"

const testImage = path.join(process.cwd(), "e2e/fixtures/test-image.png")

test("creates an instagram post with a photo and caption", async ({ page }) => {
  const caption = uniqueId("instagram caption")

  await registerAndOpenApp(page, "/#/instagram")
  await expect(page.getByRole("heading", { name: "Instagram", exact: true, level: 1 })).toBeVisible()

  await page.getByRole("button", { name: /New Post|Create First Post/ }).click()
  await expect(page.getByText("Create New Post")).toBeVisible()

  await page.locator("#image-upload").setInputFiles(testImage)
  await expect(page.locator('img[alt="Post preview"]')).toBeVisible()

  await page.getByPlaceholder("Write a caption...").fill(caption)
  await page.getByRole("button", { name: "Share" }).click()

  await expect(page.getByText(caption)).toBeVisible()
})
