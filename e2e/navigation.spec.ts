import { expect, test } from "@playwright/test"

const publicApps = [
  { link: /Todo App/, expected: "Todo App" },
  { link: /MD5 Converter/, expected: "MD5 Converter" },
  { link: /JSON Formatter/, expected: "JSON Formatter" },
  { link: /JSON Compare/, expected: "JSON Compare" },
  { link: /Notes Share/, expected: "Notes Share" },
  { link: /Expense Analyser/, expected: "Expense Analyser" },
]

const protectedApps = [
  { link: /Chat Real-time messaging/, message: "Please login to use the Chat app" },
  { link: /Blog/, message: "Please login to use the Blog app" },
  { link: /Instagram/, message: "Please login to use Instagram" },
  { link: /File Sharing/, message: "Please login to share files" },
  { link: /Video Chat Connect with/, message: "Please login to use video chat" },
  { link: /Screen Sharing/, message: "Please login to share your screen" },
]

test("opens all public apps from the home page", async ({ page }) => {
  await page.goto("/")

  for (const app of publicApps) {
    await page.goto("/")
    await page.getByRole("link", { name: app.link }).click()
    await expect(page.getByText(app.expected)).toBeVisible()
  }
})

test("shows login prompts for protected apps", async ({ page }) => {
  await page.goto("/")

  for (const app of protectedApps) {
    await page.goto("/")
    await page.getByRole("link", { name: app.link }).click()
    await expect(page.getByText("Login Required")).toBeVisible()
    await expect(page.getByText(app.message)).toBeVisible()
  }
})
