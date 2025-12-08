# SEEE Expedition Dashboard: Consolidated Plan

_Last updated: 2025-12-08_

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
- **Lint errors blocking CI:** ~40+ `no-explicit-any` errors and several hook dependency warnings must be resolved before PRs can pass.
- **Section Picker Modal bug:** Known issue where modal doesn't always display for multi-section users.
- **Dashboard homepage is debug-focused:** Currently shows session dump, not a product-ready overview.
- **Phase 3 views incomplete:** Event detail, per-person attendance, readiness summary, logistics display still to build.
- **No GitHub CI workflow existed before today:** Now added, but E2E is label-gated and not yet battle-tested.

---

## 2. Immediate Cleanup (Pre-Phase 3)

These must be resolved to unblock CI and maintain code quality.

### 2.1 Fix `no-explicit-any` Errors

| File | Approx Count | Priority |
|------|--------------|----------|
| `src/lib/auth.ts` | 15+ | High |
| `src/lib/redis.ts` | 2 | High |
| `src/lib/api.ts` | 1 | High |
| `src/hooks/useQueueProcessor.ts` | 1 | Medium |
| `src/hooks/useEventSummaryQueue.ts` | 1 | Medium |
| `src/hooks/useEventSummaryCache.ts` | 2 | Medium |
| `src/components/api-browser/*` | 5+ | Medium |
| `src/components/layout/*` | 4+ | Medium |
| `src/lib/__tests__/*` | 5+ | Low (tests) |

**Action:** Replace `any` with concrete types. For NextAuth callbacks, use `JWT`, `Session`, `User` types from `next-auth`. For OSM API responses, use existing Zod-inferred types or create new ones.

### 2.2 Fix React Hook Dependency Warnings

| File | Issue |
|------|-------|
| `src/components/layout/ClientShell.tsx` | Missing `processorState` and `currentSection?.sectionName` deps |
| `src/hooks/useEventSummaryQueue.ts` | Missing `start`, `tick` deps |
| `src/hooks/useQueueProcessor.ts` | Missing `setQueueTimerActive`, `tick` deps |

**Action:** Either add the missing deps or wrap in `useCallback`/`useMemo` with correct deps. For timer-based hooks, consider using refs to avoid re-render loops.

### 2.3 Remove Unused Code

- [ ] Delete `src/hooks/useEventSummaryQueue.ts` (superseded by `useQueueProcessor`)
- [ ] Remove unused vars in `src/lib/auth.ts` (`OSM_API_URL`, `getRoleFromCookie`, `req`, `user`, `profile`, `email`, `credentials`, `trigger`)
- [ ] Remove unused `CONFIG_VERSION_KEY` in `src/lib/config-loader.ts`
- [ ] Remove unused `query_params` in `src/mocks/handlers.ts`
- [ ] Remove unused `React` import in `src/components/ui/collapsible.tsx`
- [ ] Fix empty interface in `src/components/ui/checkbox.tsx`

### 2.4 Remove Debug Console Logs

- [ ] `src/hooks/useQueueProcessor.ts` – unconditional logs with emojis
- [ ] `src/components/layout/ClientShell.tsx` – processor state logs
- [ ] `src/components/layout/SummaryQueueBanner.tsx` – banner query logs
- [ ] Other components with dev-only logging (wrap in `if (process.env.NODE_ENV !== 'production')` if needed)

---

## 3. Bug Fixes

### 3.1 Section Picker Modal Not Displaying

**Symptom:** Modal doesn't appear for multi-section users on login.

**Investigation steps:**
- [ ] Add diagnostic logs to `SectionPickerModal` and `StartupInitializer.tsx`
- [ ] Verify `sectionPickerOpen` state sync between Zustand and modal
- [ ] Check open conditions: user has multiple sections AND no section selected
- [ ] Test with both single-section and multi-section OAuth responses

**Fix:** TBD after investigation.

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
- [ ] Create `/dashboard/people/attendance` route (protected)
- [ ] Aggregate "Yes" attendance across all events per person using hydrated summaries
- [ ] Implement toggle: Single List vs Group by Patrol
- [ ] Apply mobile-first responsive design (cards on mobile, table on desktop)
- [ ] Respect access control selectors from Phase 2.8.1
- [ ] **E2E:** View loads; toggle switches grouping; counts match summaries

### 3.3 First Aid Readiness Summary (Spec 3.3)
- [ ] Compute and display "X/Y Participants are First Aid Qualified" with badge/percentage
- [ ] Decide data source: Flexi-Record vs Badge-Record (adapter pattern hooks into Phase 4)
- [ ] Implement Tier 2 handling: missing/invalid fields degrade gracefully
- [ ] **E2E:** Readiness summary renders and updates with filters

### 3.4 Logistics & Metadata Display
- [ ] Display event logistics section (tents, transport, equipment)
- [ ] Implement Tier 2 Validation: corrupted logistics data shows empty cells, not crashes
- [ ] Support Flexi-Record logistics columns
- [ ] **E2E:** Logistics render; corrupted fields show empty, not crash

### 3.5 Mobile Transformation
- [x] Implement `hidden md:table` logic for desktop participant table
- [x] Build Participant Cards grid for mobile
- [ ] Responsive event header layout for mobile
- [ ] **E2E:** Table visible on Desktop (1024px), Cards visible on Mobile (375px)

### 3.6 Flexi-Column Mapping Dialog
- [ ] Build Dialog to resolve ambiguous columns from `getFlexiRecordStructure`
- [ ] Allow users to map columns (e.g., "Tent Group" vs "Tents" disambiguation)
- [ ] Persist mapping preferences to Zustand
- [ ] **E2E:** Dialog opens; mapping persists; columns toggle accordingly

### 3.7 Derived State & Memoization
- [ ] Implement memoized selectors for "First Aid Readiness" stats
- [ ] Cache computed participant lists by Patrol/Status grouping
- [ ] Optimize requery behavior for large events

### 3.8 UI Polishing (Detail & List Views)
- [ ] Align table typography and spacing across list/detail
- [ ] Match page padding (`p-4 md:p-6`) and back-link placement
- [ ] Render custom fields as dynamic columns (only when populated)
- [ ] Add bidirectional sorting indicators in headers
- [ ] Implement column header filtering controls

### 3.9 E2E Catch-up (Auth/Login)
- [ ] Role selection UI presence
- [ ] Provider selection correctness (`osm-admin` vs `osm-standard`)
- [ ] Session `roleSelection` persistence
- [ ] Scope assertions (admin: 4 scopes; standard: 1 scope)

---

## 5. Phase 4: Configuration & Admin

- [ ] **4.1 Adapter Pattern:** Create `FlexiAdapter` and `BadgeAdapter`
- [ ] **4.2 Admin UI:** User management table, Configuration Editor, Factory Reset button
- [ ] **4.3 E2E:** Standard user gets 403 on admin routes; Factory Reset updates KV; Config Editor reflects changes

---

## 6. Phase 5: Hardening & Export

- [x] **5.1 API Browser:** Completed early
- [ ] **5.2 PDF Export:** React-PDF generation for Patrol sheets
- [ ] **5.3 Excel Export:** SheetJS export for offline editing
- [ ] **5.4 Circuit Breaker UI:** "System Cooling Down" overlay for Soft Locks
- [ ] **5.5 Final E2E Sweep:** Full walkthrough: Login → Select Section → Filter → Export PDF

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
- [ ] **7.4 E2E Verification**

---

## 9. Suggested Execution Order

1. **Immediate (unblock CI):**
   - Fix `no-explicit-any` in `lib/auth.ts`, `lib/redis.ts`, `lib/api.ts`
   - Fix hook dependency warnings
   - Remove unused code and debug logs
   - Delete `useEventSummaryQueue.ts`

2. **Short-term (stabilize foundation):**
   - Fix Section Picker Modal bug
   - Clean up remaining lint errors in hooks and components
   - Add missing E2E tests for event detail

3. **Phase 3 delivery:**
   - Per-Person Attendance View (3.2)
   - First Aid Readiness Summary (3.3)
   - Logistics Display (3.4)
   - Flexi-Column Mapping Dialog (3.6)
   - UI Polishing (3.8)
   - E2E roll-up (3.9)

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
