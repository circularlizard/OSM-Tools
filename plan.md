# SEEE Expedition Dashboard: Consolidated Plan

_Last updated: 2025-12-08 (Phase 2 complete, Phase 3.2 in progress)_

This document integrates the project health assessment, immediate cleanup tasks, and the Phase 3+ roadmap into a single actionable plan.

---

## 1. Project Health Summary

### Strengths
- **Safety layer is mature:** Proxy, rate limiting, circuit breaker, Redis caching, Zod validation all in place and tested.
- **Auth & state plumbing solid:** NextAuth with token rotation, Redis-backed OAuth data, Zustand + TanStack Query wired correctly.
- **UI shell + events list implemented:** Login, dashboard layout, events list with mobile/desktop views.
- **Phase tracking is clear:** Phases 0–2 and 2.8 effectively complete; Phase 3+ is where product value now lies.
- **New safety net in CI:** PR checklist enforcement, architectural guards (no DB imports, no direct OSM calls outside proxy), lint:arch script.

### Risks / Rough Edges
- **Lint errors blocking CI:** ~~40+ `no-explicit-any` errors~~ **RESOLVED** - Zero lint errors.
- **Section Picker Modal bug:** Known issue where modal doesn't always display for multi-section users.
- **Dashboard homepage is debug-focused:** Currently shows session dump, not a product-ready overview.
- **Phase 3 views incomplete:** Event detail, per-person attendance, readiness summary, logistics display still to build.
- **No GitHub CI workflow existed before today:** Now added, but E2E is label-gated and not yet battle-tested.

---

## 2. Immediate Cleanup (Pre-Phase 3)

These must be resolved to unblock CI and maintain code quality.

### 2.1 Fix `no-explicit-any` Errors

| File | Status | Notes |
|------|--------|-------|
| `src/lib/auth.ts` | ✅ Done | Added `ExtendedUser`, `OsmOAuthProfile`, `OsmSection` types |
| `src/lib/redis.ts` | ✅ Done | Added `OAuthData` interface |
| `src/lib/api.ts` | ✅ Done | Fixed `parsePermissive` fallback type |
| `src/hooks/useQueueProcessor.ts` | ✅ Done | Fixed error message access |
| `src/hooks/useEventSummaryQueue.ts` | ✅ Deleted | Superseded by `useQueueProcessor` |
| `src/hooks/useEventSummaryCache.ts` | ✅ Done | Changed to `unknown` type |
| `src/components/layout/ClientShell.tsx` | ✅ Done | Added `Section` and `Event` imports |
| `src/components/layout/SummaryQueueBanner.tsx` | ✅ Done | Added `Event` type |
| `src/components/domain/EventsTable.tsx` | ✅ Done | Extracted `EventTableRow`, added `EventWithSection` type |
| Test files (`__tests__/*`) | ✅ Done | Added per-file `eslint-disable` |

**All any issues are now resolved:**

| File | Status | Notes |
|------|--------|-------|
| `src/app/api/auth/oauth-data/route.ts` | ✅ Done | Proper type guard for session.user.id |
| `src/app/api/config/access/route.ts` | ✅ Done | Type assertion for session.roleSelection |
| `src/app/dashboard/admin/page.tsx` | ✅ Done | Type assertion for roleSelection |
| `src/app/dashboard/debug/queue/page.tsx` | ✅ Done | Event type, fixed TanStack Query status |
| `src/app/dashboard/events/[id]/EventDetailClient.tsx` | ✅ Done | eslint-disable (handles dynamic Tier 2 data) |
| `src/app/dashboard/events/page.tsx` | ✅ Done | Removed deleted hook, proper types |
| `src/app/dashboard/page.tsx` | ✅ Done | Type guard for session.user.id |
| `src/components/StartupInitializer.tsx` | ✅ Done | Added OAuthSection type |
| `src/components/domain/EventCard.tsx` | ✅ Done | RefCallback type |

### 2.2 Fix React Hook Dependency Warnings

| File | Status |
|------|--------|
| `src/components/layout/ClientShell.tsx` | ✅ Done – Added eslint-disable with explanation |
| `src/hooks/useEventSummaryQueue.ts` | ✅ Deleted |
| `src/hooks/useQueueProcessor.ts` | ✅ Done – Wrapped `tick` in `useCallback`, added deps |

### 2.3 Remove Unused Code

- [x] Delete `src/hooks/useEventSummaryQueue.ts` (superseded by `useQueueProcessor`)
- [x] Remove unused vars in `src/lib/auth.ts` (`OSM_API_URL`, `getRoleFromCookie`, `req`, unused callback params)
- [x] Remove unused `CONFIG_VERSION_KEY` in `src/lib/config-loader.ts`
- [x] Remove unused `query_params` in `src/mocks/handlers.ts`
- [x] Remove unused `React` import in `src/components/ui/collapsible.tsx`
- [x] Fix empty interface in `src/components/ui/checkbox.tsx` (changed to type alias)

### 2.4 Remove Debug Console Logs

- [x] `src/hooks/useQueueProcessor.ts` – wrapped in production checks, removed emojis
- [x] `src/components/layout/ClientShell.tsx` – wrapped in production checks
- [x] `src/components/layout/SummaryQueueBanner.tsx` – wrapped in production checks

### 2.5 Build & Runtime Error Fixes

- [x] Fix `unknown` type in JSX conditional (`debug/oauth/page.tsx`)
- [x] Fix `colSpan` on div element (`people/attendance/page.tsx`)
- [x] Fix `EventsResponse` merged type missing `identifier` field
- [x] Fix `usePerPersonAttendance` hook invalid store selector
- [x] Fix Zustand store type inference
- [x] Fix `useSearchParams` Suspense boundary (Next.js 15 requirement)
- [x] Fix setState-during-render in `EventsPage` (moved `enqueueItems` to `useEffect`)

### 2.6 Testing Infrastructure

- [x] Add `npm run validate` script (tscheck + lint + build)
- [x] Add E2E console error detection tests (`tests/e2e/console-errors.spec.ts`)
- [x] Configure Playwright with mock auth env vars
- [x] All 10 console error tests pass (chromium + mobile)

---

## 3. Bug Fixes

### 3.1 Section Picker Modal Not Displaying

**Status:** ⚠️ PARTIALLY FIXED - Still not displaying on login

**Root cause:** Race condition + early return
- Modal returned `null` when `sections.length <= 1`, preventing re-render when sections loaded
- `StartupInitializer` used `> 0` instead of `> 1` for multi-section check

**Fixes applied:**
- [x] Remove early return, control visibility via Dialog `open` prop
- [x] Change condition to `storeSections.length > 1` (multi-section only)
- [x] Guard against undefined sections in all array operations
- [x] Validate persisted section against available sections
- [x] E2E tests updated and passing (6 tests)

**Completed (section picker page implementation):**
- [x] Replaced auto-opening modal with dedicated `/dashboard/section-picker` page
- [x] Page shows only for multi-section users with no valid remembered selection
- [x] "Remember my selection on this device" option backed by localStorage with userId validation
- [x] Redirect back to originally requested dashboard route via `redirect` query param
- [x] "Change sections" button in header links to section picker page
- [x] "Skip for now" link when valid existing selection exists
- [x] Clear TanStack Query cache and event queue when section selection changes
- [x] Removed old SectionPickerModal component and related store state
- [x] Added 15 unit tests for section picker functionality
- [x] See `docs/section-picker-page-plan.md` for detailed design

---

## 4. Phase 3: Data Visualization & Event Dashboard

### 3.1 Event Detail Route & View (Spec 3.2)
- [x] Create `/dashboard/events/[id]` route with auth protection
- [x] Implement `useEventDetail` fetching `details` + `summary`
- [x] Display event header: name, dates, location, status
- [x] Display participant list table
- [x] Implement Unit Filter for participants
- [ ] **E2E:** Event detail loads; header visible; participants render from summary

### 3.2 Per-Person Attendance View (Spec 3.2.1)
- [x] Create `/dashboard/people/attendance` route (protected)
- [x] Aggregate "Yes" attendance across all events per person using hydrated summaries
- [x] Implement toggle: Single List vs Group by Patrol
- [x] Apply mobile-first responsive design (cards on mobile, table on desktop)
- [x] Fix field mappings to match OSM API (eventid, scoutid, firstname/lastname)
- [x] Fix patrol lookup from data.members (not meta.event.members)
- [x] Add reactivity via useSyncExternalStore for cache updates
- [x] Make patrol groups collapsible with Expand/Collapse All
- [ ] Respect access control selectors from Phase 2.8.1 (deferred - needs type alignment)
- [x] **E2E:** View loads; toggle switches grouping (8 tests passing)

**Upcoming refinements (before 3.3):**
- [ ] Extend grouping/sorting modes to support:
  - [ ] Alphabetical single list by member name
  - [ ] Alphabetical list grouped by Patrol
  - [ ] Alphabetical list grouped by Patrol and Event
- [ ] **E2E:** Verify grouping mode selection and sorting behaviour on desktop and mobile

### 3.3 Mobile Transformation
- [x] Implement `hidden md:table` logic for desktop participant table
- [x] Build Participant Cards grid for mobile
- [ ] Responsive event header layout for mobile
- [ ] **E2E:** Table visible on Desktop (1024px), Cards visible on Mobile (375px)

### 3.4 UI Polishing (Detail & List Views)
- [ ] Align table typography and spacing across list/detail
- [ ] Match page padding (`p-4 md:p-6`) and back-link placement
- [ ] Render custom fields as dynamic columns (only when populated)
- [ ] Add bidirectional sorting indicators in headers
- [ ] Implement column header filtering controls
- [ ] **E2E/Visual:** Smoke test key tables/cards for consistent typography and spacing

### 3.5 E2E Catch-up (Auth/Login)
- [ ] Role selection UI presence
- [ ] Provider selection correctness (`osm-admin` vs `osm-standard`)
- [ ] Session `roleSelection` persistence
- [ ] Scope assertions (admin: 4 scopes; standard: 1 scope)

---

### 3.6 Dashboard Overview & Summary

- [ ] Replace debug-focused `/dashboard` page with a product-facing overview
- [ ] Show selected section(s) summary (name, type, multi-section context)
- [ ] Show upcoming events snapshot for the selected section(s)
- [ ] Show high-level attendance snapshot (e.g. count of members with ≥1 "Yes")
- [ ] **E2E/Integration:** Dashboard loads with correct summary for a single-section and multi-section user

### 3.7 Patrol Reference & Mapping (Admin + API Support)

- [ ] Implement Admin patrol reference tools to refresh cached Patrol/Member structure in Redis
- [ ] Expose patrol name mapping API and client hooks: `{ patrolId -> patrolName }`
- [ ] Wire patrol name mapping into event and attendance views
- [ ] **Unit/Integration:** Tests for patrol mapping utility and API shape

---

### 3.8 Patrol Display UX

- [ ] Display patrol **names** instead of raw patrol IDs in event and attendance views (using 3.7 mapping)
- [ ] Fall back to patrol ID only when no name is available in the patrol reference cache
- [ ] **E2E:** Event and attendance views render patrol names when available and IDs as fallback

---

## 5. Phase 4: Reporting & Export

- [ ] **4.1 PDF Export:** React-PDF generation for patrol sheets and event attendance summaries
- [ ] **4.2 Excel/CSV Export:** SheetJS (or CSV) export for event and per-person/patrol attendance data
- [ ] **4.3 Filter-Aware Export:** Ensure exports respect current filters (section selection, patrol filters, event filters)
- [ ] **4.4 E2E:** Export flows – Login → Select Section → Filter → Export PDF/XLS

---

## 6. Phase 5: Configuration & Admin

- [ ] **5.1 Adapter Pattern:** Create `FlexiAdapter` and `BadgeAdapter`
- [ ] **5.2 Admin UI:** User management table, Configuration Editor, Factory Reset button
- [ ] **5.3 E2E:** Standard user gets 403 on admin routes; Factory Reset updates KV; Config Editor reflects changes

---

## 7. Phase 6: Deployment & Handover

- [ ] **6.1 Vercel Setup:** Environment variables, Preview deployment, DNS/SSL
- [ ] **6.2 Documentation:** API docs, User guide, Admin guide
- [ ] **6.3 Handover:** Knowledge transfer, Support channel setup

---

## 8. Phase 7: Training & Readiness Data (Future)

_Deferred pending decision on training data source (Flexi-Record vs Badge-Record)._ 

- [ ] **7.1 Training Data Source Resolution**
- [ ] **7.2 Readiness & Training View (Spec 3.4)**
- [ ] **7.3 Readiness-Based Filtering**
- [ ] **7.4 First Aid Readiness Summary (Spec 3.3)**
- [ ] **7.5 Logistics & Metadata Display**
- [ ] **7.6 Flexi-Column Mapping Dialog**
- [ ] **7.7 Derived Readiness State & Memoization**
- [ ] **7.8 E2E Verification for Training & Readiness**

---

## 9. Suggested Execution Order

1. **Immediate (unblock CI):** ✅ DONE
   - ~~Fix `no-explicit-any` in `lib/auth.ts`, `lib/redis.ts`, `lib/api.ts`~~
   - ~~Fix hook dependency warnings~~
   - ~~Remove unused code and debug logs~~
   - ~~Delete `useEventSummaryQueue.ts`~~

2. **Short-term (stabilize foundation):** ✅ DONE
   - ~~Clean up remaining lint errors in hooks and components~~
   - ~~Add E2E console error detection tests~~
   - ~~Fix build errors and runtime React errors~~
   - Section Picker Modal bug (deferred to Phase 3)

3. **Phase 3 delivery:** ← CURRENT
   - Section Picker flow & section picker page (3.1 bug fixes + completed page work)
   - Per-Person Attendance View (3.2) - implemented, with additional grouping refinements planned
   - Mobile transformation (3.3)
   - UI polishing for detail/list views (3.4)
   - Auth/login E2E catch-up (3.5)
   - Dashboard overview & summary (3.6)
   - Patrol reference & mapping (3.7)
   - Patrol display UX using patrol names (3.8)

4. **Phase 4–6:**
   - Admin UI and adapters
   - Export features
   - Deployment and handover

---

## 10. Commands Reference

```bash
# Local development
npm run dev          # HTTPS dev server
npm run dev:http     # HTTP dev server

# Validation (run before committing)
npm run tscheck      # TypeScript check
npm run lint         # Standard lint
npm run lint:arch    # Architecture lint (same as lint, reserved for future)
npm run test         # Jest unit/integration tests

# E2E
npm run test:e2e     # Playwright tests
npm run test:e2e:ui  # Playwright UI mode

# Safety validation
npm run validate:safety  # Full safety layer validation
```

---

_For detailed phase history, see `docs/COMPLETED_PHASES.md`._
_For architecture reference, see `docs/ARCHITECTURE.md`._
_For implementation details, see `IMPLEMENTATION_PLAN.md`._
