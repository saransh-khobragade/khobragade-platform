import { expect, test } from "@playwright/test"

test("loads the app shell and reaches key routes", async ({ page, request }) => {
  const health = await request.get("http://127.0.0.1:8080/health")
  expect(health.ok()).toBe(true)

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Open Platform" })).toBeVisible()
  await expect(page.getByRole("link", { name: /Todo App/ })).toBeVisible()
  await expect(page.getByRole("link", { name: /Chat Real-time messaging/ })).toBeVisible()

  await page.getByRole("link", { name: /Todo App/ }).click()
  await expect(page).toHaveURL(/#\/todos$/)
  await expect(page.getByText("Todo App")).toBeVisible()
})
