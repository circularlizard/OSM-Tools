# Multi-App Stage 3 Plan

This plan sequencesthe remaining work to align the four-application architecture with the functional review. For each application we first update the master specification, then ship the required implementation changes, and finally refresh the E2E coverage to match the new behavior.

## Phase 1: Expedition Viewer
- **Objective:** Lock the viewer into the SEEE section, ensure attendance-first UX, and guarantee read-only scope limited to events. @docs/implementation/functional-review.md#35-53 @docs/implementation/multi-app-part-2.md#52-56
- **Specification Updates:**
  - Add explicit SEEE-only constraint and remove section picker behaviors from the spec.
  - Document Patrol-card landing page, attendance-by-person drill-in, and cache rules for patrol names.
  - Clarify minimal OAuth scopes (`section:event:read`) and hydration expectations.
- **Implementation Tasks:**
  - Refactor dashboard shell to hard-lock SEEE context and hide section selector logic.
  - Build Patrol card landing page with attendance drill-down and ensure hydration reliability for members.
  - Consume Redis patrol cache for display and add force-refresh hooks once shared across apps.
- **E2E Updates:**
  - Expand Expedition Viewer scenarios to confirm SEEE lock, patrol cards, attendance drill-down, and cache indicators.
  - Add failure case coverage for insufficient permissions and hydration errors.

## Phase 2: Expedition Planner
- **Objective:** Deliver the admin planning shell focused on member/event prep, using SEEE section defaults and broader scopes. @docs/implementation/functional-review.md#54-64 @docs/implementation/multi-app-part-2.md#57-60
- **Specification Updates:**
  - Define core Planner workflows (patrol refresh, walking/tent group management, event preparation) and required scopes.
  - Add navigation/IA for planner-exclusive views.
  - Document Redis cache expectations and how planner seeds patrol cache for other apps.
- **Implementation Tasks:**
  - Build Planner layout with navigation and context-aware hydration queue.
  - Implement patrol refresh tooling and integration with flexi/badge adapters.
  - Ensure cache priming hooks run post login and on demand.
- **E2E Updates:**
  - Author scenarios covering planner login, navigation, patrol refresh success/failure, and cache priming visibility.
  - Cover resilience behaviors (rate-limit backoff indications, hydration progress bars).

## Phase 3: OSM Data Quality Viewer
- **Objective:** Move member issues/data quality tooling into its dedicated multi-section app with section selector and robust cache usage. @docs/implementation/functional-review.md#65-79 @docs/implementation/multi-app-part-2.md#57-60
- **Specification Updates:**
  - Clarify multi-section permission rules, section picker UX, and main data quality dashboards.
  - Document progress indicators, cache expectations, and resiliency requirements for long hydration sessions.
  - Add required badge/flexi adapters for readiness signals.
- **Implementation Tasks:**
  - Migrate member issues views from shared dashboard into this app with improved progress feedback.
  - Wire section selector to permission-filtered sections, ensuring cache usage across sections.
  - Harden hydration queue against 429s with UI messaging.
- **E2E Updates:**
  - Update multi-section viewer BDD scenarios to confirm section selection, progress UI, cache hits, and error handling.
  - Add data-quality specific scenarios referencing mock data issues.

## Phase 4: Platform Admin
- **Objective:** Polish the platform-operations experience, focusing on tooling visibility (audit logs, data loading toolbar) without section context. @docs/implementation/functional-review.md#65-69 @docs/implementation/multi-app-part-2.md#58-63
- **Specification Updates:**
  - Rename surface areas ("Platform Operations"), enumerate available tools (cache views, API diagnostics, audit log), and confirm no section selector.
  - Document required scopes and guard rails for hardening access.
  - Specify telemetry display for rate limiting/backoff states.
- **Implementation Tasks:**
  - Surface data loading toolbar and telemetry indicators prominently.
  - Ensure audit log feed reflects console/maintenance actions in real time.
  - Tighten routing/guards so only platform-verified admins access this app.
- **E2E Updates:**
  - Add scenarios covering platform admin login, audit log visibility, telemetry display, and guard-rail redirects for non-admins.
  - Include regression tests for cache tools (viewing, not mutating) to ensure read-only policy.
