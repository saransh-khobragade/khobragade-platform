import type { Browser, BrowserContext } from "@playwright/test"
import { APP_URL, type AuthResult } from "./api"

/**
 * Creates an isolated browser context that is already authenticated as the
 * given user by seeding the tokens the SPA reads from sessionStorage. This
 * mirrors a returning, logged-in user without re-driving the login form.
 */
export async function authedContext(
  browser: Browser,
  auth: AuthResult
): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: APP_URL })
  await context.addInitScript((tokens) => {
    window.sessionStorage.setItem("accessToken", tokens.accessToken)
    window.sessionStorage.setItem("refreshToken", tokens.refreshToken)
  }, { accessToken: auth.accessToken, refreshToken: auth.refreshToken })
  return context
}
