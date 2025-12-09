# Section Picker Page Plan

## Goals
- Replace fragile auto-opening modal with a dedicated section picker page.
- Support a "remember my selection" option so multi-section users can skip the page on subsequent logins.
- Ensure caches (queue + TanStack Query) are cleared when section selection changes.

## High-Level Flow
1. User logs in via NextAuth.
2. After successful login:
   - If user is single-section: auto-select section and redirect to `/dashboard`.
   - If user is multi-section and has no remembered valid selection: redirect to `/dashboard/section-picker`.
   - If user is multi-section and has a remembered valid selection: skip section picker and go directly to the intended page (default `/dashboard`).
3. Section picker page lets the user:
   - Choose one or more sections.
   - Optionally tick "Remember my selection on this device".
   - Confirm, which:
     - Updates Zustand store (`currentSection` / `selectedSections`).
     - Clears queue + query caches related to events and summaries.
     - Persists a small, stable key for the remembered selection in localStorage.
     - Redirects to the original target (from `redirect` query param) or `/dashboard`.

## Routing & Redirects
- New route: `/dashboard/section-picker` (protected by NextAuth).
- Login callback URL for multi-section users:
  - Default to `/dashboard/section-picker`.
  - Accept `callbackUrl` / `redirect` to support deep links (e.g., `/dashboard/events`).
- Guard logic (middleware or layout-level):
  - If user is authenticated but has **no valid section selection** and is navigating to a dashboard child route:
    - Redirect to `/dashboard/section-picker?redirect=<original_path>`.
  - "Valid" selection means:
    - At least one selected section.
    - All selected sections exist in `availableSections` from OAuth/Redis.

## Remember My Selection
- UI: checkbox on section picker page: `Remember my selection on this device`.
- Storage strategy:
  - Use localStorage with a namespaced key, e.g. `seee.sectionSelection.v1`.
  - Store a minimal payload: `{ userId, selectedSectionIds: string[], timestamp }`.
  - On login, after fetching OAuth sections:
    - Load remembered selection.
    - If `userId` matches current session user and all section IDs exist in `availableSections`:
      - Hydrate `currentSection` / `selectedSections` from this payload.
      - Skip picker and go to original destination.
    - If any section is invalid or userId mismatched: discard remembered payload.

## Cache & Queue Clearing
- When selection changes (either from picker page or explicit "Change sections"):
  - Clear:
    - Event list query cache: keys beginning with `['events', ...]`.
    - Event summary cache: keys beginning with `['event-summary', ...]`.
    - Per-person attendance derived state (implicitly recomputed from summaries).
    - Any queue state related to pending event summaries.
  - Rationale:
    - Ensure that events/attendance for a previous section dont appear after switching.

## UI/UX Details
- Section picker page:
  - Title: `Select sections`.
  - Show cards or a table of available sections (name, type, maybe group name).
  - Allow single or multi-select (depending on product decision; current store supports multi).
  - Use the standard dashboard header but **hide the left navigation/sidebar** so the user focuses on choosing sections before entering the overview.
  - Controls:
    - Primary button: `Continue` (disabled until at least one section is selected).
    - Checkbox: `Remember my selection on this device`.
    - Optional link: `Skip for now` (only if at least one section auto-select is allowed, otherwise disabled).
- Header integration:
  - Replace/augment current modal-based section picker trigger with a link/button:
    - `Change sections` → navigates to `/dashboard/section-picker` (preserving `redirect` back to current page).

## Migration from Modal
- Step 1: Implement section picker page and routing/remember logic.
- Step 2: Switch login callback + dashboard guard to use new page.
- Step 3: Keep existing modal only for manual change (optional).
- Step 4: Once page flow is stable and tests are updated:
  - Remove auto-opening modal behavior from `StartupInitializer`.
  - Optionally remove the modal component entirely if the page provides all needed UX.

## Testing Plan
- Unit/Integration:
  - Tests for selection validation (valid vs stale remembered sections).
  - Tests for cache clearing when selection changes.
- E2E:
  - Multi-section user, first login: sees picker, selects sections, lands on dashboard.
  - Second login with `remember` checked: goes directly to dashboard, correct section(s) used.
  - Deep link to `/dashboard/events` with no selection: redirected to picker, then back to events.
  - Changing sections from header: picker appears, new selection applied, old events/attendance data not shown.
