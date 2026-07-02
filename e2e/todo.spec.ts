import { expect, test } from "@playwright/test"
import { uniqueId } from "./helpers/test-data"

test("todos and their completed state persist across a reload", async ({ page }) => {
  const first = uniqueId("ship release")
  const second = uniqueId("write changelog")

  await page.goto("/#/todos")
  await expect(page.getByText("Todo App")).toBeVisible()

  const input = page.getByPlaceholder("Add a new task...")
  const addButton = page.getByRole("button", { name: "Add todo" })

  await input.fill(first)
  await addButton.click()
  await input.fill(second)
  await addButton.click()

  await expect(page.getByText(first, { exact: true })).toBeVisible()
  await expect(page.getByText(second, { exact: true })).toBeVisible()

  // Complete only the first task.
  const firstCheckbox = page.getByRole("checkbox", { name: first })
  await firstCheckbox.click()
  await expect(firstCheckbox).toBeChecked()

  // State survives a full reload (persisted in the backend).
  await page.reload()
  await expect(page.getByText("Todo App")).toBeVisible()
  await expect(page.getByRole("checkbox", { name: first })).toBeChecked()
  await expect(page.getByRole("checkbox", { name: second })).not.toBeChecked()

  // Clean up both todos and confirm the deletions stick.
  await page.getByRole("button", { name: `Delete ${first}` }).click()
  await page.getByRole("button", { name: `Delete ${second}` }).click()
  await expect(page.getByText(first, { exact: true })).toBeHidden()
  await expect(page.getByText(second, { exact: true })).toBeHidden()
})
