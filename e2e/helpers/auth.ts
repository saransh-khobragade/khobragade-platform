import { type Page } from "@playwright/test"
import { uniqueUser, type TestUser } from "./test-data"

export type { TestUser }

export async function registerAndOpenApp(page: Page, path: string, user: TestUser = uniqueUser()) {
  await page.goto(path)
  await registerUser(page, user)
  return user
}

export async function registerUser(page: Page, user: TestUser = uniqueUser()) {
  await page.getByRole("button", { name: "Need an account? Register" }).click()
  await page.getByPlaceholder("Username").fill(user.username)
  await page.getByPlaceholder("Name (optional)").fill(user.name)
  await page.getByPlaceholder("Email").fill(user.email)
  await page.getByPlaceholder("Password").fill(user.password)
  await page.getByRole("button", { name: "Register", exact: true }).click()
  return user
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Password").fill(password)
  await page.getByRole("button", { name: "Login", exact: true }).click()
}

export async function logoutUser(page: Page) {
  await page.locator('button[data-variant="ghost"][data-slot="dropdown-menu-trigger"]').click()
  await page.getByRole("menuitem", { name: "Log out" }).click()
}
