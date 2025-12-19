# Phase 3 Detailed Implementation Plan

This document expands `plan.md` Section 3 (Data Visualization & Event Dashboard) into concrete implementation and testing steps, aligned with:

- `docs/ARCHITECTURE.md` (read-only, proxy-based, KV caching, split state via TanStack Query + Zustand)
- `docs/SPECIFICATION.md` (functional requirements for event dashboard & reporting)
- Security and robustness requirements (rate limiting, no persistent PII, fail-fast error handling)

---

## 0. Scope of Phase 3

Phase 3 focuses on **read-only dashboards and views** based on already-available data:

- Event detail view (3.1)
- Per-person attendance view and grouping (3.2)
- Mobile transformation for wide/tabular views (3.3)
- UI polish for detail/list views (3.4)
- Auth/login E2E catch-up (3.5)
- Dashboard overview & summary (3.6)
- Patrol reference & mapping (3.7)
- Patrol display UX (3.8)

Logistics, training readiness, and first-aid features are deferred to **Phase 7**.

Assumptions:

- All data continues to come via the **existing proxy API layer**, never directly from OSM.
- Patrol/member structure is fetched and cached per `ARCHITECTURE.md` (Two-Layer Caching Strategy, Sections 4 & 7).
- No new long-lived storage for PII is introduced beyond existing Redis caching and client-side ephemeral state.

---

## 1. 3.1 Event Detail Route & View (Spec 3.2)

### 1.1 Architecture Alignment

- **Data Source:**
  - Use existing proxy route(s) for:
    - Event index (ID, name, dates) – already used by events page.
    - Event detail (participants, invitation status) – must be read via the API proxy.
  - All responses validated via Zod schemas (Tier 1 strict validation for core fields per `ARCHITECTURE.md` 5.3).
- **State Management:**
  - Fetch via **TanStack Query** using keys like `['event-detail', eventId]`.
  - Avoid duplicating state in Zustand; event detail is server state.
- **Security & Access Control:**
  - Respect Access Control Strategies (Patrol-based vs Event-based) resolved by the backend (per `SPECIFICATION` 5.2 & `ARCHITECTURE` 5.2).
  - UI must never bypass or relax restrictions; it only renders the filtered result.

### 1.2 Implementation Tasks

- [ ] Confirm or create a dedicated hook `useEventDetail(eventId)`:
  - Zod-validated shape for event header + participant list.
  - Handles loading, error, and empty states.
- [ ] Ensure invitation status (Invited / Accepted / Declined) is rendered per `SPECIFICATION` 3.2.
- [ ] Wire Unit Filter (already implemented) to reflect filtered counts and visible participants in the detail view.

### 1.3 Testing

- **Unit / Integration (Jest + RTL):**
  - [ ] Test `useEventDetail` behavior for:
    - Valid data (happy path).
    - Tier 1 schema violations → surfaces error state without crashing.
  - [ ] Component tests for Event Detail view:
    - Header renders name, date range, and status.
    - Participant list renders correctly and responds to Unit Filter.
- **E2E (Playwright):**
  - [ ] `plan.md` 3.1 E2E: Event detail loads; header visible; participants render from summary.
  - [ ] Navigation from events list → event detail and back preserves filters where expected.

---

## 2. 3.2 Per-Person Attendance View (Spec 3.2.1)

### 2.1 Architecture Alignment

- **Data Source:**
  - Use aggregated per-person attendance computed from event summaries (already implemented by `usePerPersonAttendance`).
  - All summaries originate from the proxy layer and respect access control filters.
- **State Management:**
  - Keep underlying data in TanStack Query.
  - Attendance-by-person page remains a **pure consumer** of derived data.
- **Security & Privacy:**
  - No new persistence; derived attendance is transient client-side data.
  - Respect access control filters (Patrol-based/event-based) when they are wired in (see Phase 2.8.1 + deferred item in 3.2).

### 2.2 Grouping & Sorting Modes

Target modes:

1. Alphabetical single list by member name.
2. Alphabetical list grouped by Patrol.
3. Alphabetical list grouped by Patrol and Event.

**✅ COMPLETED Implementation:**

- [x] Add `groupMode: 'single' | 'patrol' | 'patrolEvent'` to state.
- [x] Default changed to `'patrol'` (Group by Patrol).
- [x] Introduce **stable sorting helpers**:
  - [x] `sortByName()` - Sort data by name (case-insensitive) before rendering.
  - [x] Within each group (patrol / patrol+event), use sorted inputs.
- [x] Extend `groupByPatrol`:
  - [x] Accept already-sorted data and group by `patrolId`.
  - [x] Sort patrol keys alphabetically.
- [x] Implement `groupByPatrolAndEvent`:
  - [x] Uses **Patrol → Event → People** layout (event-centric within patrol).
  - [x] Events sorted by start date (soonest first).
  - [x] People sorted alphabetically within each event.
- [x] Radio button labels: "Single List", "By Patrol", "By Patrol & Event".
- [x] Expand/Collapse All works for both patrol and event levels.

### 2.3 Design Decisions Made

1. **Patrol+Event grouping layout:** Option B selected - **Patrol → Event → People** (event-centric).
2. **Default grouping mode:** Changed to **Group by Patrol**.

### 2.4 Testing

- **Unit / Integration:**
  - [x] Tests for grouping helpers (`sortByName`, `groupByPatrol`, `groupByPatrolAndEvent`) to ensure:
    - Deterministic alphabetical order.
    - Correct handling of missing patrol IDs (e.g. `"Unassigned"`).
    - Correct event date sorting.
  - [x] **14 unit tests added** in `grouping-helpers.test.ts`.
  - [ ] Component tests verifying each mode's structure (e.g. correct headings and counts).
- **E2E:**
  - [ ] Verify grouping mode selection and sorting behaviour on desktop and mobile (per `plan.md` 3.2).
  - [ ] Confirm that access control filtered datasets (when wired) still produce correct groupings.

---

## 3. 3.3 Mobile Transformation

### 3.1 Architecture Alignment

- Matches `ARCHITECTURE.md` 3.6 **Table-to-Card Transformation**:
  - Tables hidden on small screens; cards shown instead.
  - Cards show key stats clearly on mobile.

### 3.2 Implementation Tasks

- [ ] Finalize responsive header layouts for key pages (events list, event detail, attendance per-person).
- [ ] Ensure Tailwind breakpoints (`md:` etc.) are consistent across views.

### 3.3 Testing

- [ ] Playwright tests validating:
  - Desktop viewport (≥1024px): table is visible, cards hidden.
  - Mobile viewport (~375px): cards visible, table hidden.
- [ ] Visual regression/smoke tests for key layouts (if practical within current test setup).

---

## 4. 3.4 UI Polishing (Detail & List Views)

### 4.1 Architecture Alignment

- Consistent with **Non-Functional UI Requirements** (Spec 6):
  - Clean, modern design, consistent typography and spacing.
  - Single theme and design tokens via Tailwind.

### 4.2 Implementation Tasks

- [ ] Align table typography (font size, weight) across event list, event detail, attendance views.
- [ ] Standardize paddings and margins (`p-4 md:p-6`) and back-link placement.
- [ ] Render custom/optional fields only when data is present.
- [ ] Add bidirectional sorting indicators in table headers where sorting is implemented.
- [ ] Implement simple header-level filtering controls (if still in scope after grouping work).

### 4.3 Testing

- [ ] Add RTL snapshot-like tests where useful to assert presence of key structural elements.
- [ ] Add a small set of E2E/UI checks for typography/spacing consistency (e.g. by checking classnames or layout markers).

---

## 5. 3.5 E2E Catch-up (Auth/Login)

### 5.1 Architecture & Spec Alignment

- Must respect `SPEC` 3.1 and `ARCHITECTURE` 3.5 & 5.2:
  - Two OAuth providers: `osm-admin`, `osm-standard`.
  - Correct scopes per role, enforced by tests.
  - Role selection and persistence in JWT/session.

### 5.2 Implementation Tasks

- [ ] Confirm role selection UI is present and wired to `signIn('osm-admin' | 'osm-standard')`.
- [ ] Ensure callback URLs and provider IDs match architecture doc.
- [ ] Persist `roleSelection` into session/JWT and Zustand store.
- [ ] Ensure access control decisions in the proxy respect the stored role.

### 5.3 Testing

- **Unit / Integration:**
  - [ ] Tests for auth config to assert scopes and providers.
- **E2E:**
  - [ ] Role selection UI presence.
  - [ ] Provider selection correctness (`osm-admin` vs `osm-standard`).
  - [ ] Session `roleSelection` persistence across refresh.
  - [ ] Scope assertions (admin: 4 scopes; standard: 1 scope) via mocked responses.

---

## 6. 3.6 Dashboard Overview & Summary

### 6.1 Architecture & Spec Alignment

- Based on `SPEC` 3.2 (Event dashboard) and 3.6 (Reporting & Export):
  - Show upcoming events for the current section(s) only.
  - Provide at-a-glance participation/attendance summary.
- Must respect **Access Control** and **No-DB**:
  - Only read from proxy APIs and cached structures.
  - Never store PII beyond existing KV + client state.

### 6.2 Implementation Tasks

**✅ COMPLETED:**

- [x] Replace current debug `/dashboard` with product-facing overview:
  - [x] Section summary (current section name or "N sections selected" for multi-section).
  - [x] Next 3 upcoming events as cards with colored primary headers.
  - [x] Each card shows: event name, date range, location, Yes/No/Invited counts.
  - [x] Cards link to event detail page.
  - [x] "View All Events" button and link when >3 events exist.
  - [x] Empty state when no upcoming events.
- [x] Filter events by end date (only show future/active events).
- [x] Sort events by start date (soonest first).
- [x] Uses existing hooks (`useStore`, `useEvents`).

### 6.3 Testing

- **Unit / Integration:**
  - [ ] Tests for dashboard summary component using mocked hooks.
- **E2E/Integration:**
  - [ ] Dashboard loads correctly for:
    - Single-section user.
    - Multi-section user with remembered selection.
  - [ ] Summary counts match underlying data from events and attendance views.

---

## 7. 3.7 Patrol Reference & Mapping (Admin + API Support)

### 7.1 Architecture & Spec Alignment

- Based on `SPEC` 4.1 & 4.2 (Data Management Strategy) and `ARCHITECTURE` 4 & 7:
  - Patrol & Member structure fetched by **Admins** via the proxy.
  - Cached in **Vercel KV** for ~90 days (Section 7 TTL table).
  - Standard viewers read patrol names from cached structure; they never fetch member lists directly from OSM.

### 7.2 Implementation Tasks

**✅ COMPLETED:**

- [x] Server-side:
  - [x] API route `/api/admin/patrols` for admins to trigger patrol/member structure refresh (POST).
  - [x] API route `/api/admin/patrols` for all authenticated users to read cached data (GET).
  - [x] Redis cache with 90-day TTL per ARCHITECTURE.md.
  - [x] Cache metadata (last updated, updated by, section count, patrol count).
- [x] Client-side Admin UI (`PatrolManagement.tsx`):
  - [x] "Refresh Patrol Data" button.
  - [x] Last updated timestamp display.
  - [x] Patrol table showing ID, Name, Section.
  - [x] Error display for partial failures.
  - [x] Empty state when no cached data.
- [x] Client-side mapping hooks:
  - [x] `usePatrolMap()` - reads cached patrols, provides `getPatrolName(patrolId)` function.
  - [x] `usePatrolRefresh()` - admin-only mutation to refresh patrol data.
- [x] Admin link in sidebar visible only to administrators.
- [x] Updated logger to support patrol cache events.

### 7.3 Testing

- **Unit / Integration:**
  - [ ] Tests for server route to ensure only admins can refresh.
  - [ ] Tests that KV keys/TTL are set as expected (where practical).
  - [ ] Tests for patrol mapping hook to handle missing IDs.

---

## 8. 3.8 Patrol Display UX

### 8.1 Architecture & Spec Alignment

- Uses mapping from 3.7 to show patrol names consistently.
- Must still respect access control: patrol names shown only for members included in filtered sets.

### 8.2 Implementation Tasks

**✅ COMPLETED (Attendance views):**

- [x] Update attendance page to use patrol names via `usePatrolMap` hook.
- [x] Provide fallback to raw patrol ID when mapping is missing.
- [x] Patrol names shown in:
  - [x] Single List table (Patrol column).
  - [x] Group by Patrol headers.
  - [x] Group by Patrol & Event headers.
  - [x] Mobile card views.
- [x] Grouping keys remain as IDs internally; labels use resolved names.

**Remaining:**

- [ ] Wire patrol names into event detail view.

### 8.3 Testing

- **Unit / Integration:**
  - [ ] Tests that components render names when available and IDs otherwise.
- **E2E:**
  - [ ] Event and attendance views render patrol names for cached data.
  - [ ] Fallback behaviour is correct when cache is missing entries.

---

## 9. Security & Robustness Checklist for Phase 3

Across all 3.x work, we must:

- [ ] Continue to route **all** OSM data access through the proxy (no direct fetches from the browser).
- [ ] Validate all external data with Zod using Tier 1 (strict) vs Tier 2 (permissive) schemas as defined in `ARCHITECTURE.md`.
- [ ] Ensure new API routes are **GET-only** for data, with POST only for admin config/refresh operations.
- [ ] Respect rate limit and circuit-breaker behaviour (no tight polling or unthrottled requests).
- [ ] Avoid introducing any new long-lived PII storage outside Redis KV (no databases, no writing PII to logs).
- [ ] Add tests to simulate error conditions (invalid data, 429, blocked) where feasible.

---

## 10. Clarifications Resolved

The following design decisions were made during implementation:

1. **Per-Person Patrol+Event layout (3.2):** ✅ **Option B selected** - Patrol → Event → People (event-centric within patrol).

2. **Default grouping mode (3.2):** ✅ Changed to **Group by Patrol**.

3. **Dashboard summary metrics (3.6):** ✅ Implemented as **event cards showing Yes/No/Invited counts** per event (next 3 upcoming events).

4. **Admin patrol refresh UX (3.7):** ✅ **Fuller table** implemented - shows Refresh button, last-updated timestamp, and patrol table (ID, Name, Section).
