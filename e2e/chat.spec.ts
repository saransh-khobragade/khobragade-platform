import { expect, test } from "@playwright/test"
import { APP_URL, registerViaApi } from "./helpers/api"
import { authedContext } from "./helpers/session"
import { uniqueUser } from "./helpers/test-data"

test("two users hold a two-way direct-message conversation", async ({ browser, request }) => {
  const alice = await registerViaApi(request, uniqueUser())
  const bob = await registerViaApi(request, uniqueUser())

  const aliceContext = await authedContext(browser, alice)
  const bobContext = await authedContext(browser, bob)
  const alicePage = await aliceContext.newPage()
  const bobPage = await bobContext.newPage()

  try {
    // Bob comes online first so Alice can discover him in the online list.
    await bobPage.goto(`${APP_URL}/#/chat`)
    await expect(bobPage.getByRole("button", { name: "New Chat" })).toBeVisible()

    await alicePage.goto(`${APP_URL}/#/chat`)
    await expect(alicePage.getByRole("button", { name: "New Chat" })).toBeVisible()

    // Alice starts a conversation with the online Bob and sends a message.
    await alicePage.getByRole("button", { name: "New Chat" }).click()
    await expect(alicePage.getByText(`@${bob.user.username}`)).toBeVisible({ timeout: 15000 })
    await alicePage.getByText(`@${bob.user.username}`).click()

    const fromAlice = "Hi Bob, are you there?"
    const aliceBox = alicePage.getByPlaceholder("Type a message...")
    await aliceBox.fill(fromAlice)
    await aliceBox.press("Enter")
    await expect(alicePage.getByText(fromAlice).last()).toBeVisible()

    // Bob opens the conversation and sees the message Alice sent to him.
    await bobPage.reload()
    await bobPage.getByText(alice.user.name).first().click()
    await expect(bobPage.getByText(fromAlice).last()).toBeVisible()

    // Bob replies over the socket; his message is persisted.
    const fromBob = "Yes Alice, loud and clear!"
    const bobBox = bobPage.getByPlaceholder("Type a message...")
    await bobBox.fill(fromBob)
    await bobBox.press("Enter")
    await expect(bobPage.getByText(fromBob).last()).toBeVisible()

    // Alice returns to the conversation and sees the full, shared thread —
    // the exchange is durable and visible to both participants.
    await alicePage.reload()
    await alicePage.getByText(bob.user.name).first().click()
    await expect(alicePage.getByText(fromAlice).last()).toBeVisible()
    await expect(alicePage.getByText(fromBob).last()).toBeVisible()
  } finally {
    await aliceContext.close()
    await bobContext.close()
  }
})
