export interface TestUser {
  name: string
  username: string
  email: string
  password: string
}

export const uniqueId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const uniqueUser = (): TestUser => {
  const id = uniqueId("e2e")
  return {
    name: `E2E User ${id}`,
    username: id.replaceAll("-", "_"),
    email: `${id}@example.com`,
    password: "Playwright123!",
  }
}
