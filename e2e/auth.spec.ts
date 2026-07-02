import { expect, test } from "@playwright/test"
import { loginUser, logoutUser, registerUser } from "./helpers/auth"
import { uniqueUser } from "./helpers/test-data"

test.describe("authentication lifecycle", () => {
  test("rejects registration when the password is too short", async ({ page }) => {
    const user = uniqueUser()

    await page.goto("/#/chat")
    await page.getByRole("button", { name: "Need an account? Register" }).click()
    await page.getByPlaceholder("Username").fill(user.username)
    await page.getByPlaceholder("Email").fill(user.email)
    await page.getByPlaceholder("Password").fill("123")
    await page.getByRole("button", { name: "Register", exact: true }).click()

    await expect(page.getByText("Password must be at least 6 characters")).toBeVisible()
    // The app stays gated because registration never completed.
    await expect(page.getByText("Please login to use the Chat app")).toBeVisible()
  })

  test("prevents registering the same email twice", async ({ page }) => {
    const user = uniqueUser()

    await page.goto("/#/chat")
    await registerUser(page, user)
    await expect(page.getByText("Chat", { exact: true })).toBeVisible()

    await logoutUser(page)
    await page.goto("/#/chat")
    await page.getByRole("button", { name: "Need an account? Register" }).click()
    await page.getByPlaceholder("Username").fill(`${user.username}_alt`)
    await page.getByPlaceholder("Email").fill(user.email)
    await page.getByPlaceholder("Password").fill(user.password)
    await page.getByRole("button", { name: "Register", exact: true }).click()

    await expect(page.getByText("Email already registered")).toBeVisible()
  })

  test("rejects login with the wrong password", async ({ page }) => {
    const user = uniqueUser()

    await page.goto("/#/blog")
    await registerUser(page, user)
    await logoutUser(page)

    await page.goto("/#/blog")
    await loginUser(page, user.email, "totally-wrong-password")

    await expect(page.getByText("Invalid email or password")).toBeVisible()
    await expect(page.getByText("Please login to use the Blog app")).toBeVisible()
  })

  test("keeps the user signed in across a page reload", async ({ page }) => {
    const user = uniqueUser()

    await page.goto("/#/blog")
    await registerUser(page, user)
    await expect(page.getByRole("heading", { name: "Blog", exact: true, level: 1 })).toBeVisible()

    await page.reload()

    await expect(page.getByRole("heading", { name: "Blog", exact: true, level: 1 })).toBeVisible()
    await expect(page.getByText("Login Required")).toBeHidden()
  })

  test("logs out, clears the session, and can sign back in", async ({ page }) => {
    const user = uniqueUser()

    await page.goto("/#/blog")
    await registerUser(page, user)
    await expect(page.getByRole("heading", { name: "Blog", exact: true, level: 1 })).toBeVisible()

    await logoutUser(page)
    await expect(page.getByRole("heading", { name: "Open Platform" })).toBeVisible()

    // Revisiting a protected app now requires authentication again.
    await page.goto("/#/blog")
    await expect(page.getByText("Login Required")).toBeVisible()

    await loginUser(page, user.email, user.password)
    await expect(page.getByRole("heading", { name: "Blog", exact: true, level: 1 })).toBeVisible()
    await expect(page.getByRole("button", { name: "New Post" })).toBeVisible()
  })
})
