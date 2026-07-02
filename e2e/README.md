# End-to-End Tests

Full-stack [Playwright](https://playwright.dev/) tests that run against the **real** frontend, backend, and a local PostgreSQL database. Every scenario exercises the app the way a user (or two) would — through the UI, over real HTTP/WebSocket calls, with data persisted to Postgres.

## Prerequisites

- [Bun](https://bun.sh/) and [Docker](https://www.docker.com/) installed.
- Local Postgres running: `docker compose up -d` (from the repo root).

Playwright starts the backend and frontend automatically (see `webServer` in `../playwright.config.ts`), so you only need the database up.

## Running

Run these from the **repository root**:

```bash
docker compose up -d          # start Postgres

bun run test:e2e              # run everything (headless)
bun run test:e2e:ui           # interactive UI mode
bun run test:e2e:headed       # watch the browser
bun run test:e2e:report       # open the last HTML report

# a single file
bun run test:e2e -- auth.spec.ts
```

## Layout

```
e2e/
├── *.spec.ts            # test scenarios
├── fixtures/            # sample upload files (xlsx, txt, png)
└── helpers/             # shared utilities
    ├── api.ts           # register test users directly via the API
    ├── auth.ts          # UI register / login / logout flows
    ├── session.ts       # build pre-authenticated browser contexts
    └── test-data.ts     # unique IDs and users for test isolation
```

### Helpers

- **`test-data.ts`** — `uniqueId()` / `uniqueUser()` generate collision-free data so tests stay isolated and repeatable even against a shared database.
- **`auth.ts`** — drives the real login form (`registerUser`, `loginUser`, `logoutUser`, `registerAndOpenApp`).
- **`api.ts`** — `registerViaApi()` creates a user through the backend API and returns their tokens; used to set up actors quickly without re-driving the form.
- **`session.ts`** — `authedContext()` opens an isolated browser context that is already logged in (by seeding the tokens the SPA reads from `sessionStorage`). This is how multi-user scenarios run two authenticated people side by side.

## Test scenarios

### Cross-cutting

| File | Scenario |
| --- | --- |
| `smoke.spec.ts` | Backend `/health` is up, the app shell renders, and a key route (Todo) is reachable. |
| `navigation.spec.ts` | Every public app opens from the home page; every protected app shows its "Login Required" prompt when signed out. |

### Authentication

| File | Scenarios |
| --- | --- |
| `auth.spec.ts` | Rejects a too-short password; blocks a duplicate email; rejects a wrong password on login; keeps the session across a page reload; logs out (clearing the session) and signs back in. Asserts the real backend error messages. |

### Multi-user & collaboration

| File | Scenario |
| --- | --- |
| `chat.spec.ts` | Two authenticated users hold a two-way direct-message conversation. Alice finds the online Bob, starts a chat, and each message is sent over the socket, persisted, and verified visible to the other participant in both directions. |
| `blog.spec.ts` | An author publishes a post; a **second** user finds it, likes it, and comments; the author then sees the propagated like and comment counts. Selectors are scoped to the specific post card so the shared global feed doesn't cause flakiness. |
| `notes.spec.ts` | An author creates a note; a separate anonymous session opens the share link and reads it; an edit propagates to that session after reload. A second test confirms an unknown share link surfaces "Note not found". |

### Persistence & core apps

| File | Scenario |
| --- | --- |
| `todo.spec.ts` | Creates two todos, completes one, and verifies both the text and completed state survive a full reload (real backend persistence); then confirms deletions stick. |
| `instagram.spec.ts` | Registers, uploads a photo, writes a caption, shares the post, and sees it appear in the feed. |
| `file-sharing.spec.ts` | Registers, uploads a file, and creates a share link (`#/file-sharing/receive/...`). |
| `video-chat.spec.ts` | Registers and creates a named video chat room, landing in the room with a "Leave Room" control. |
| `screen-sharing.spec.ts` | Registers, starts sharing, and gets a viewer share URL (`#/screen-sharing/view/...`). |

### Utility apps (no auth)

| File | Scenario |
| --- | --- |
| `md5.spec.ts` | Converts `hello` and asserts the exact MD5 hash. |
| `json-tools.spec.ts` | Formats valid JSON, shows an error for invalid JSON, and compares identical vs. differing JSON objects. |
| `expense-analyser.spec.ts` | Uploads an ICICI statement fixture and verifies the analysis (transaction count, totals, spending-by-category). |

## Fixtures

`fixtures/` holds sample upload files used by the tests:

- `icici-sample.xlsx` — sample bank statement for the expense analyser.
- `test-image.png` — image for Instagram posts.
- `sample.txt` — file for the file-sharing flow.

## Notes on app behavior surfaced by these tests

- **Chat live push is racy.** The chat app recreates its WebSocket on every conversation switch, so live delivery races with the socket re-join under automation. The chat test therefore verifies the durable, deterministic guarantee (bidirectional, cross-user, persisted messaging) rather than a flaky live push.
- **Blog feed omits comment bodies.** The feed endpoint returns only aggregate counts (`_count`), not full comment text (that loads on a single-post fetch). The author-side assertion checks the propagated count, matching the app's actual behavior.
- **WebRTC apps** (video chat, screen sharing, file sharing) run with a fake camera/microphone configured in `../playwright.config.ts`.
