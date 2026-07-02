import { expect, test } from "@playwright/test"
import { registerAndOpenApp } from "./helpers/auth"
import { uniqueId } from "./helpers/test-data"

test("creates a video chat room", async ({ page }) => {
  const roomName = uniqueId("playwright room")

  await registerAndOpenApp(page, "/#/video-chat")
  await expect(page.getByRole("heading", { name: "Video Chat", exact: true, level: 1 })).toBeVisible()

  await page.getByPlaceholder("Enter room name...").fill(roomName)
  await page.getByRole("button", { name: "Create", exact: true }).click()

  await expect(page.getByRole("heading", { name: roomName, level: 2 })).toBeVisible()
  await expect(page.getByRole("button", { name: "Leave Room" })).toBeVisible()
})
