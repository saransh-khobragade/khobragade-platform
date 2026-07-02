import { expect, type APIRequestContext } from "@playwright/test"
import type { TestUser } from "./test-data"

export const API_URL = process.env.E2E_API_URL || "http://127.0.0.1:8080"
export const APP_URL = process.env.E2E_APP_URL || "http://127.0.0.1:5173"

export interface AuthResult {
  user: {
    id: string
    email: string
    username: string
    name: string | null
    avatar: string | null
  }
  accessToken: string
  refreshToken: string
}

/**
 * Registers a user directly through the API. Used to set up test actors
 * quickly without driving the registration form for every scenario.
 */
export async function registerViaApi(
  request: APIRequestContext,
  user: TestUser
): Promise<AuthResult> {
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      email: user.email,
      username: user.username,
      password: user.password,
      name: user.name,
    },
  })
  expect(
    response.ok(),
    `Expected registration to succeed but got ${response.status()}: ${await response.text()}`
  ).toBeTruthy()
  return response.json()
}
