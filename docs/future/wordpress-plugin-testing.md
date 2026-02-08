# WordPress Plugin Testing Strategy (Future)

This document outlines automated testing approaches for the proposed **SEEE WordPress plugin** implementation, assuming:

- The plugin uses a **hybrid rendering approach**:
  - **Leaders area**: PHP templates + Alpine.js (no build step)
  - **Admin pages**: React bundle via @wordpress/scripts
- Testing is primarily **local-first** (run by developers on demand), with only a small “smoke” subset suitable for CI.
- We want to retain **Gherkin / BDD** workflows.

---

## 1. Testing Goals

- Validate correctness of:
  - OSM API integration safety layer (caching, backoff/circuit breaker, error handling)
  - access control (Strategy A: patrol-based, Strategy B: event-based)
  - sanitization for public/non-OSM summaries
  - lookup/mapping logic (patrol overrides, mappings)
- Maintain high confidence without relying on brittle “real OSM” tests.
- Provide a step-by-step approach so we can add coverage incrementally.

---

## 2. Test Pyramid (recommended)

### 2.1 PHP unit tests (fast)

Purpose:

- Validate pure business logic without requiring a full WordPress runtime.

Best targets:

- Access-control decision functions (Strategy A/B filtering)
- Sanitization of public summaries (PII exclusion)
- OSM response normalization and validation helpers
- Rate-limit header parsing and backoff decisions
- Cache decision logic (what to cache, when to bypass)

Tooling:

- PHPUnit
- Brain Monkey (mocking WordPress functions)
- Mockery (optional)

### 2.2 WordPress integration tests (REST + DB)

Purpose:

- Validate behavior in a WordPress runtime:
  - routes are registered
  - permission callbacks are enforced
  - DB migrations run and are idempotent
  - REST responses conform to contracts

Tooling:

- WordPress Core PHPUnit test suite (`WP_UnitTestCase`)
- Use `rest_do_request()` to exercise endpoints

Key integration tests:

- Route permissions:
  - anonymous user can call only public endpoints
  - viewer/admin roles can call appropriate endpoints
- DB migrations:
  - activation creates tables
  - upgrade runs safely multiple times
- Filtering:
  - seeded allowlists and patrols yield filtered REST responses

### 2.3 React unit/component tests (Admin UI only)

Purpose:

- Validate rendering, edge states, and view logic for admin React components.

Note: The leaders area uses PHP templates + Alpine.js, so React tests apply only to admin pages.

Tooling:

- Jest or Vitest
- React Testing Library
- MSW (preferred) to mock REST calls from the admin bundle

Key UI tests:

- Loading / error / empty states in admin screens
- Admin "sync patrols" button disables/handles errors
- Access control rule editor interactions
- Diagnostics dashboard rendering

### 2.4 PHP template tests (Leaders Area)

Purpose:

- Validate PHP template output for leaders area views.

Tooling:

- PHPUnit with output buffering to capture rendered HTML
- Assert expected elements/classes are present

Key tests:

- Event list renders correct number of rows
- Event detail shows expected fields
- Access denied template renders for unauthorized users
- Login prompt renders for unauthenticated users

### 2.5 End-to-End (E2E) tests (browser)

Purpose:

- Validate the user journey:
  - navigation
  - permissions
  - event list/detail behaviors
  - admin screens

Tooling:

- Playwright (recommended)

---

## 3. Can we still use Gherkin?

Yes.

Recommended approach:

- Keep using **Gherkin feature files**.
- Implement step definitions that drive **Playwright**.

Two common options:

- `playwright-bdd` (closest to the existing repo approach)
- Cucumber.js + Playwright (heavier)

Recommendation:

- Prefer `playwright-bdd` to keep:
  - feature files (`*.feature`)
  - tags for grouping and targeted runs
  - HTML reports and traces

---

## 4. Local-first environments

### 4.1 WordPress runtime for integration/E2E

Use one of:

- `@wordpress/env` (wp-env)
  - reproducible
  - easy to reset DB
- Docker Compose (WordPress + MariaDB)

Make plugin source available to WordPress via a mounted volume/symlink.

### 4.2 Mock OSM vs Real OSM

Maintain a **single switch** (config/constant) for:

- Mock OSM mode:
  - REST endpoints return deterministic fixtures
  - default for tests
- Real OSM mode:
  - REST endpoints call OSM via `wp_remote_get()`
  - used only for explicit local smoke runs

---

## 5. Step-by-step testing plan (how to build coverage incrementally)

### Step 1 — Build fixtures and contracts

- Create sanitized JSON fixtures for:
  - events list
  - event detail
  - patrol list
  - error cases (429, blocked, invalid payload)
- Define the REST response contracts (what the UI expects).

### Step 2 — PHP unit tests for safety-critical logic

- Add PHPUnit tests for:
  - access filtering
  - sanitization
  - backoff decisions
  - cache behavior

Goal:

- lock down the “safety layer” behavior early.

### Step 3 — WordPress integration tests for REST endpoints

- Use WP test suite to:
  - register routes
  - seed DB state
  - call endpoints via `rest_do_request()`

Goal:

- ensure permissions + filtering cannot regress.

### Step 4 — React component tests

- Use MSW to mock `GET /wp-json/seee-exped/v1/*`.
- Add tests for:
  - event list view
  - event detail view
  - admin screens (sync + mappings)

Goal:

- fast confidence on UI states.

### Step 5 — E2E tests (Playwright) in mock modes

- Run WP locally
- Run Playwright against the running site
- Use:
  - mock OSM mode
  - mock auth mode (see below)

Goal:

- verify end-to-end flows and routing.

### Step 6 — BDD/Gherkin on top of E2E

- Add `*.feature` scenarios that mirror your core flows.
- Keep step definitions thin and reusable.

Goal:

- human-readable acceptance coverage.

### Step 7 — Real OSM smoke runs (manual / opt-in)

- Separate command or tag:
  - only runs when explicitly enabled
- Minimal assertions:
  - connectivity
  - auth handshake (if feasible)
  - basic event listing

Goal:

- detect upstream changes without making tests flaky.

### Step 8 — Mutation testing (targeted)

- Run Infection on:
  - access control module
  - sanitization module
  - backoff/circuit-breaker module

Goal:

- identify weak tests in safety-critical logic.

---

## 6. Auth testing strategy (OAuth vs mock)

OAuth is hard to automate locally (callback URLs, secrets, upstream availability). Use two modes:

- Mock auth mode (default for tests)
  - local-only config to impersonate a user role/capability
  - used for integration/E2E/BDD
- Real OAuth mode (optional)
  - requires tunnel (ngrok/Cloudflare Tunnel)
  - used for manual verification and occasional smoke checks

---

## 7. What to run locally (suggested routines)

These are conceptual routines (actual scripts to be added when the plugin repo exists).

- “Fast”: PHP unit tests + React component tests
- “REST”: WordPress integration tests
- “E2E”: start WP runtime + run Playwright
- “BDD”: run Playwright BDD scenarios by tag
- “Mutation”: run Infection on targeted modules

---

## 8. Initial BDD scenario set (recommended)

Create a small set of feature files early:

- Viewer can open expeditions page and see event list
- Viewer can open an event and see detail
- Admin can sync patrols and see updated timestamp
- Public user can view public expedition summaries
- Strategy A hides forbidden patrol data
- Strategy B hides non-allowlisted events

---

## 9. Definition of Done (testing)

For each new feature in the plugin:

- Add/adjust:
  - at least 1 PHP unit test for safety/logic changes
  - at least 1 WP integration test for REST permission/contract changes
  - at least 1 UI test (React component for admin, PHP template test for leaders area)
  - at least 1 E2E or BDD scenario for the user-visible flow

Mutation testing:

- Required only when changing safety-critical modules.

---

## 10. CI/CD Pipeline

### 10.1 GitHub Actions Workflow

```yaml
name: CI – Plugin Tests
on: [push, pull_request]

jobs:
  php-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: sodium
      - run: composer install
      - run: vendor/bin/phpunit --testsuite unit

  wp-integration:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: wordpress_test
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: sodium
      - run: composer install
      - run: bash bin/install-wp-tests.sh wordpress_test root root 127.0.0.1 latest
      - run: vendor/bin/phpunit --testsuite integration

  react-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

### 10.2 E2E in CI (Optional)

- Use `wp-env` in CI for E2E tests
- Run only smoke subset (tagged `@smoke`)
- Store Playwright traces as artifacts

---

## 11. Security Testing

### 11.1 Capability Bypass Tests

For each REST endpoint:

- Test with unauthenticated user → expect 401
- Test with authenticated user lacking capability → expect 403
- Test with correct capability → expect 200

### 11.2 Input Validation Tests

- SQL injection attempts in query parameters
- XSS payloads in admin form inputs
- CSRF token validation (nonce checks)

### 11.3 Token Security Tests

Verify tokens are not exposed in:

- REST responses
- JavaScript globals
- Error messages
- Logs (when WP_DEBUG is on)

---

## 12. Performance Testing

### 12.1 Large Dataset Tests

Create fixtures with:

- 100+ events
- 500+ members
- 20+ patrols

Verify:

- REST endpoints respond within acceptable time (<500ms)
- Leaders area pages render without timeout
- Pagination works correctly

### 12.2 Cache Effectiveness

- Measure response times with cold vs warm cache
- Verify cache invalidation works correctly
- Test transient expiry behavior

---

## 13. Accessibility Testing

### 13.1 Automated Checks

- Run `axe-core` via Playwright on key pages
- Fail E2E tests on critical accessibility violations

### 13.2 Manual Checklist

- Keyboard navigation works for all interactive elements
- Screen reader announces dynamic content changes (Alpine.js updates)
- Color contrast meets WCAG AA
- Focus states are visible
