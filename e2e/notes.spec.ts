import { expect, test } from "@playwright/test"
import { uniqueId } from "./helpers/test-data"

test("a shared note is readable in another session and reflects edits", async ({ browser }) => {
  const title = uniqueId("meeting notes")
  const body = uniqueId("initial agenda")
  const updatedBody = uniqueId("revised agenda")

  const authorContext = await browser.newContext()
  const visitorContext = await browser.newContext()
  const authorPage = await authorContext.newPage()
  const visitorPage = await visitorContext.newPage()

  try {
    // Author creates a note and is redirected to its shareable URL.
    await authorPage.goto("/#/notes")
    await authorPage.getByPlaceholder("Note title...").fill(title)
    await authorPage.getByPlaceholder("Write your note here...").fill(body)
    await authorPage.getByRole("button", { name: "Create Note" }).click()
    await expect(authorPage).toHaveURL(/#\/notes\/.+/)

    const shareUrl = await authorPage
      .locator('input[readonly][class*="font-mono"]')
      .inputValue()
    expect(shareUrl).toMatch(/#\/notes\/.+/)

    // A separate visitor with no session can open the shared note.
    await visitorPage.goto(shareUrl)
    await expect(visitorPage.getByPlaceholder("Note title...")).toHaveValue(title)
    await expect(visitorPage.getByPlaceholder("Write your note here...")).toHaveValue(body)

    // Author edits the note; the visitor sees the update after reloading.
    await authorPage.getByPlaceholder("Write your note here...").fill(updatedBody)
    await authorPage.getByRole("button", { name: "Save Changes" }).click()
    await expect(authorPage.getByPlaceholder("Write your note here...")).toHaveValue(updatedBody)

    await visitorPage.reload()
    await expect(visitorPage.getByPlaceholder("Write your note here...")).toHaveValue(updatedBody)
  } finally {
    await authorContext.close()
    await visitorContext.close()
  }
})

test("opening an unknown share link surfaces a not-found message", async ({ page }) => {
  await page.goto("/#/notes/does-not-exist-share-id")
  await expect(page.getByText("Note not found")).toBeVisible()
})
