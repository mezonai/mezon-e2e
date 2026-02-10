# Project Context (Mezon E2E) — Playwright Test Agents

This file is the single source of truth for **Planner** and **Generator** to understand this repo’s structure, conventions, and how to work with **`data-e2e`** selectors.

Goal: the plan describes **user flows** + **assertable expectations**; the generator produces code that follows **this repo’s patterns** (data-e2e + selector classes + POM + helpers), avoiding fragile `getByText()`/random CSS.

---

## 1) Paths & repository structure (IMPORTANT)

- **Web tests**: `src/tests/web/**`
- **Seed test**: `src/tests/web/seed.spec.ts`
- **Test plans (Markdown)**: `specs/test-plans/**` (Planner should save here)
- **Page Objects**: `src/pages/**`
- **Selector classes**: `src/data/selectors/**`
- **Helpers/Utilities**: `src/utils/**`
- **E2E selector keys & ROUTES**: `src/selectors/index.ts`

### Plan file-path rules

- If a scenario declares a file path, it **MUST** be:
  - `src/tests/web/<folder>/<name>.spec.ts`
- Do **NOT** use `tests/...` (missing `src/`) because Playwright is configured around `./src/tests`.

---

## 2) Environment & Base URL (IMPORTANT)

This repo loads env via `dotenv` and reads `process.env.BASE_URL`.

- `GLOBAL_CONFIG.LOCAL_BASE_URL = process.env.BASE_URL || ''`
- If `BASE_URL` is empty, seed/auth helpers may navigate to an invalid URL.

### Minimal requirement for stable runs/generation

Set `BASE_URL` via `.env` (recommended) or shell:

```bash
BASE_URL=https://dev-mezon.nccsoft.vn
```

---

## 3) Selector strategy — prefer `data-e2e` (MANDATORY)

### 3.1 Why Planner “doesn’t know” the `data-e2e` keys

Planner typically writes behavior-level steps (“click login”, “type message”) and may not know the exact `data-e2e` keys.

Correct approach for this repo:

- Plan: steps + expected results (what, not how).
- Generator: executes steps and uses **selector classes** and **`generateE2eSelector()`** to target `data-e2e`.

### 3.2 Mandatory rules

- **Priority 1**: use **Selector classes** (`src/data/selectors/*Selector.ts`)
- **Priority 2**: use `generateE2eSelector()` with a valid `E2eKeyType`
- **Only if needed**: `page.getByText()` / `page.getByRole()` (when no `data-e2e` exists)
- **Avoid**: fragile CSS selectors based on dynamic/tailwind classes

### 3.3 `generateE2eSelector()` (repo standard)

```ts
import { generateE2eSelector } from '@/utils/generateE2eSelector';

const dmPlusBtn = page.locator(generateE2eSelector('chat.direct_message.button.button_plus'));
```

Valid keys come from:

- `src/selectors/index.ts` (`E2eKeyType`)
- `DATA_E2E_IDENTIFIER` dot-keys (same file)

---

## 4) Selector classes (PREFERRED)

Selectors are already packaged per screen/feature. Generator should prefer:

- `HomePageSelector`
- `MessageSelector`
- `FriendSelector`
- `ClanSelector`
- `ProfileSelector`
- `CategorySettingSelector`
- `ChannelSettingSelector`
- `ClanSettingSelector`

Example (Messages):

```ts
import MessageSelector from '@/data/selectors/MessageSelector';

const sel = new MessageSelector(page);
await sel.buttonCreateGroupSidebar.click();
await sel.messageInput.fill('hello');
await sel.messageInput.press('Enter');
```

---

## 5) Page Objects & Helpers (PREFERRED)

### 5.1 Page Objects (POM)

Use page objects from `src/pages/` whenever possible:

- `HomePage`
- `LoginPage`
- `MessagePage`
- `ClanPage`, etc.

Example:

```ts
import { MessagePage } from '@/pages/MessagePage';

const messagePage = new MessagePage(page);
await messagePage.sendMessageWhenInDM('Hello');
```

### 5.2 Helpers

Use helpers to standardize flows:

- **Auth**: `AuthHelper` (`src/utils/authHelper.ts`)
- **Messages**: `MessageTestHelpers` (`src/utils/messageHelpers.ts`)
- **Direct message**: `DirectMessageHelper` (`src/utils/directMessageHelper.ts`)

Example:

```ts
import { MessageTestHelpers } from '@/utils/messageHelpers';

const helper = new MessageTestHelpers(page);
await helper.sendTextMessage(`Test message ${Date.now()}`);
```

---

## 6) Test setup pattern (MANDATORY for auth-required tests)

Repo convention:

- `AuthHelper.setupAuthWithEmailPassword(...)`
- `AuthHelper.prepareBeforeTest(page, url, credentials)`
- navigation via `joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.XXX)`

Standard skeleton:

```ts
import { test, expect } from '@playwright/test';
import { AuthHelper } from '@/utils/authHelper';
import { AccountCredentials, GLOBAL_CONFIG } from '@/config/environment';
import { ROUTES } from '@/selectors';
import joinUrlPaths from '@/utils/joinUrlPaths';

test.describe('...', () => {
  test.beforeEach(async ({ page }) => {
    const credentials = await AuthHelper.setupAuthWithEmailPassword(
      page,
      AccountCredentials.account2
    );

    await AuthHelper.prepareBeforeTest(
      page,
      joinUrlPaths(GLOBAL_CONFIG.LOCAL_BASE_URL, ROUTES.DIRECT_FRIENDS),
      credentials
    );
  });

  test('...', async ({ page }) => {
    // ...
  });
});
```

---

## 7) Seed test conventions (Planner & Generator)

- Planner should always reference the seed: **`src/tests/web/seed.spec.ts`**
- Generator should follow the seed setup pattern (auth + navigation + waits) when applicable
- For no-auth flows (e.g., homepage), baseURL must still be valid; auth can be skipped.

---

## 8) Naming conventions

- Files: `kebab-case.spec.ts`
- Group by feature folder, e.g.:
  - `src/tests/web/DirectMessage/send-simple-message.spec.ts`
  - `src/tests/web/homepage/homepage-loads.spec.ts`

---

## 9) Plan format guidelines (to keep Generator aligned)

Each scenario should include:

- **Seed:** `src/tests/web/seed.spec.ts`
- **File:** `src/tests/web/.../<scenario>.spec.ts`
- **Steps:** numbered (1..n)
- **Expected Results:** clear bullets that can be asserted
- **Implementation hints (optional but recommended):**
  - which Page Object / Selector class / Helper to use
  - known `data-e2e` keys (optional)

Example plan snippet:

```md
### 1. Direct Message - Send Simple Message

**Seed:** `src/tests/web/seed.spec.ts`
**File:** `src/tests/web/DirectMessage/send-simple-message.spec.ts`

**Implementation hints (Project Context):**

- Use `MessagePage` + `MessageTestHelpers`
- Prefer `MessageSelector` / `generateE2eSelector()` for locators

**Steps:**

1. Authenticate using seed pattern.
2. Navigate to Direct Friends page.
3. Create/open a DM conversation.
4. Send a unique text message.
5. Verify the message is visible in the message list.
```

---

## 10) Generator rules (copy/paste into prompt)

- MUST use selector classes when available
- MUST prefer `generateE2eSelector()` over `getByText/getByRole`
- MUST follow auth/navigation setup pattern (or explicitly document “no-auth”)
- MUST save tests under `src/tests/web/`
- MUST keep **one test per file**

---

## 11) Healer rules (repo-friendly)

When healing failures:

- Prefer switching to **data-e2e** locators or selector classes
- Reduce flakiness by waiting for locator states (visible/attached) instead of long sleeps
- Avoid unnecessary `networkidle` waits
- If feature is truly broken, use `test.fixme()` with a clear comment

---

## 12) Quick checklist

- [ ] `BASE_URL` is set (env/.env)
- [ ] Plans are saved under `specs/test-plans/`
- [ ] Plan `File:` paths start with `src/tests/web/...`
- [ ] Generator uses `data-e2e` (selector class / `generateE2eSelector`)
- [ ] Tests follow the seed setup pattern (when auth is required)
