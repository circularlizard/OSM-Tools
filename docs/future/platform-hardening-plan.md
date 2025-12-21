# Platform Hardening Plan (Dec 2025)

Stabilize the SEEE Expedition Dashboard before investing in multi-application work. Target outcomes: predictable auth/session UX, resilient proxy/rate limiting, consistent access configuration, polished responsive UI, and CI parity.

---

## 1. Objectives
1. Enforce session timeout + callback behavior per `REQ-AUTH-11/12`.
2. Improve observability and safety of rate limiting (`REQ-ARCH-01`–`18`).
3. Defer access-configuration simplification (section picker removal) until post-hardening multi-app work.
4. Finish responsive/table polish to satisfy `REQ-NFR-01`–`03`.
5. Ensure CI + local workflows cover lint/TS/tests/mutation targets.

---

## 2. Workstreams & Tasks

### 2.1 Authentication & Session Stability
1. Implement inactivity timer + redirect on session expiry; honor `callbackUrl`.
2. Add integration tests covering timeout flow (unit + Playwright BDD scenarios).

### 2.2 Rate Limiting & Proxy Safety
1. Instrument proxy to log `X-RateLimit-*`, `Retry-After`, `X-Blocked` headers.
2. Expose metrics hooks (e.g., `useRateLimitTelemetry`) for UI warnings.
3. Ensure all fetch helpers accept `AbortSignal`; cancel on section/app switch.
4. Harden retry policy (no automatic retries on 401/429/503).
5. Extend tests (unit + integration) for soft lock, hard lock, cache corruption.

### 2.3 UI & Responsiveness Polish
1. Apply shared spacing/typography tokens (tables, cards, headers).
2. Finalize mobile vs desktop layouts for events, attendance, upcoming dashboard.
3. Add responsive regression tests (Playwright BDD scenarios for desktop/mobile viewports).
4. Audit shadcn theme + color usage; align with `REQ-NFR-01`.

### 2.4 CI & Testing Parity
1. Update CI workflows to enforce lint → `tsc --noEmit` → unit → Playwright-bdd → coverage merge.
2. Ensure nightly mutation job gates on 80% score and publishes report links.
3. Add Windsurf workflow documentation updates (test-stack, mutation-scan, etc.).
4. Track `REQ-` IDs in new tests for traceability.

---

## 3. Execution Order
1. **Auth & Session (2.1)** – prerequisite for delivering reliable UX and honoring session rules.
2. **Rate Limiting & Proxy (2.2)** – protects upstream OSM and unlocks telemetry.
3. **UI/Responsiveness (2.3)** – ensures polished experience pre multi-app work.
4. **CI & Testing (2.4)** – confirm regressions caught before expanding scope.

---

## 4. Milestones
1. **M1 – Session Stability:** timeout flow complete and verified via BDD scenarios.
2. **M2 – Proxy Safety:** telemetry, abortable fetches, retry guards, and tests in place.
3. **M3 – UI Polish:** responsive layouts signed off, regression tests green.
4. **M4 – CI Parity:** pipelines + local workflows updated; mutation gate active.

---

## 5. Exit Criteria
- All tasks in Sections 2.1–2.4 complete with passing tests.
- CI dashboards show new telemetry/mutation thresholds.
- Sign-off from product + engineering to begin multi-app foundation planning.
