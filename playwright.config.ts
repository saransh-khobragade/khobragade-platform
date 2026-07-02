import { defineConfig, devices } from "@playwright/test"

const backendUrl = "http://127.0.0.1:8080"
const frontendUrl = "http://127.0.0.1:5173"
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/render_db?schema=public"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "bun prisma:generate && bun prisma:migrate && bun dev",
      cwd: "./backend",
      url: `${backendUrl}/health`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: "8080",
        DATABASE_URL: databaseUrl,
        JWT_SECRET: "playwright-test-secret",
        JWT_REFRESH_SECRET: "playwright-test-refresh-secret",
        FRONTEND_URL: frontendUrl,
        API_URL: backendUrl,
        NODE_ENV: "test",
      },
    },
    {
      command: "bun dev --host 127.0.0.1",
      cwd: "./frontend",
      url: frontendUrl,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: backendUrl,
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        permissions: ["camera", "microphone"],
        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--use-fake-device-for-media-stream",
          ],
        },
      },
    },
  ],
})
