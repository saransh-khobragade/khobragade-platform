import { expect, test, type Page } from "@playwright/test"
import { APP_URL, registerViaApi } from "./helpers/api"
import { authedContext } from "./helpers/session"
import { uniqueId, uniqueUser } from "./helpers/test-data"

function postCard(page: Page, title: string) {
  return page.locator('[data-slot="card"]', {
    has: page.getByRole("heading", { name: title, level: 3 }),
  })
}

test("author publishes a post that another user likes and comments on", async ({
  browser,
  request,
}) => {
  const author = await registerViaApi(request, uniqueUser())
  const reader = await registerViaApi(request, uniqueUser())

  const postTitle = uniqueId("release notes")
  const postBody = uniqueId("what shipped this week")
  const comment = uniqueId("congrats on the launch")

  const authorContext = await authedContext(browser, author)
  const readerContext = await authedContext(browser, reader)
  const authorPage = await authorContext.newPage()
  const readerPage = await readerContext.newPage()

  try {
    // Author writes and publishes a post.
    await authorPage.goto(`${APP_URL}/#/blog`)
    await authorPage.getByRole("button", { name: /New Post|Create First Post/ }).click()
    await authorPage.getByPlaceholder("Post title...").fill(postTitle)
    await authorPage.getByPlaceholder("Write your post content...").fill(postBody)
    await authorPage.getByRole("button", { name: "Create Post" }).click()
    await expect(authorPage.getByRole("heading", { name: postTitle, level: 3 })).toBeVisible()

    // Reader opens the blog, finds the post, likes it, and comments.
    await readerPage.goto(`${APP_URL}/#/blog`)
    const readerCard = postCard(readerPage, postTitle)
    await expect(readerCard).toBeVisible()
    await expect(readerCard.getByText(postBody)).toBeVisible()

    await readerCard.locator("button:has(svg.lucide-heart)").click()
    await expect(readerCard.locator("button:has(svg.lucide-heart)")).toContainText("1")

    await readerCard.locator("button:has(svg.lucide-message-circle)").click()
    await readerCard.getByPlaceholder("Write a comment...").fill(comment)
    await readerCard.locator("button:has(svg.lucide-send)").click()
    await expect(readerCard.getByText(comment)).toBeVisible()

    // Author refreshes and the feed reflects the reader's like and comment.
    await authorPage.reload()
    const authorCard = postCard(authorPage, postTitle)
    await expect(authorCard.locator("button:has(svg.lucide-heart)")).toContainText("1")
    await expect(authorCard.locator("button:has(svg.lucide-message-circle)")).toContainText("1")
  } finally {
    await authorContext.close()
    await readerContext.close()
  }
})
