# WordPress Plugin Re-Architecture (Future Plan)

This document proposes how the current SEEE expedition dashboard (currently implemented as a Next.js application with an OSM safety/proxy layer) could be re-imagined as a **WordPress plugin** that integrates tightly with the existing SEEE website.

Key goals:

- Integrate dashboard functionality into the existing WordPress site UX/navigation.
- Use the **WordPress database** for lookup/configuration data (e.g. patrol definitions, display overrides, access control allowlists).
- Provide **OSM login** via a WordPress OAuth plugin (users authenticate with their OSM credentials).
- Provide a **public / non-OSM** mode by storing a sanitized **summary** of expedition data for users without access to SEEE sections.
- (Future/optional) Extend into an **expedition planner**.

Important constraint:

- The existing codebase is explicitly **read-only** with respect to OSM.
- Any “write back to OSM” functionality (planner) should be treated as a separate phase/module with additional security controls, auditing, and least-privilege scopes.

---

## 1. Target Product Shape

The WordPress plugin becomes a “mini-application” embedded within WordPress.

### 1.1 Primary audiences

- **SEEE leaders (OSM access)**: full dashboard experience, filtered by their permissions.
- **SEEE website visitors (no OSM access)**: can see a “summary” view (sanitized) of expedition plans.
- **SEEE admins**: manage mappings/config + (future) manage expedition plans/planner configuration.

### 1.2 UX integration options

We should support at least one of these patterns (can do more later):

- **Dedicated pages**: e.g. `/expeditions`, `/expeditions/event/{id}` rendered by the plugin.
- **Shortcodes**: e.g. `[seee_expeditions_dashboard]`, `[seee_expedition_event id="123"]`.
- **Blocks (recommended)**: Gutenberg blocks wrapping the dashboard widgets.

---

## 2. Authentication & Authorization (WordPress + OSM)

### 2.1 Login via OSM OAuth

**Important:** OSM uses **OAuth 1.0a**, not OAuth 2.0/OIDC. Most WordPress OAuth plugins target OAuth 2.0 providers and will not work out of the box.

#### 2.1.1 OSM OAuth Endpoints

- Request token: `https://www.onlinescoutmanager.co.uk/oauth/request_token`
- Authorize: `https://www.onlinescoutmanager.co.uk/oauth/authorize`
- Access token: `https://www.onlinescoutmanager.co.uk/oauth/access_token`

#### 2.1.2 Implementation Options

| Option | Pros | Cons |
|--------|------|------|
| Custom OAuth 1.0a handler | Full control, no external dependency | More initial work |
| Generic OAuth 1.0a plugin | Less code | May not exist/be maintained |
| Hybrid | Use plugin for flow, custom for storage | Dependency + custom code |

**Recommendation:** Build a minimal custom OAuth 1.0a handler as a plugin module:
- OSM's flow is well-documented
- Avoids dependency on third-party plugin maintenance
- Full control over token storage and refresh logic

#### 2.1.3 Token Storage Security

Tokens MUST be encrypted before storage in `wp_usermeta`:

- Use `sodium_crypto_secretbox()` (PHP 7.2+) or `openssl_encrypt()` with AES-256-GCM
- Encryption key: derived from `wp_salt('auth')` or a dedicated key stored outside webroot
- Store encrypted blob + nonce in user meta
- On token refresh, re-encrypt and update atomically

Key rotation strategy:
- Store key version with encrypted data
- Provide admin tool to re-encrypt all tokens when rotating keys

Security rules:
- Never log tokens
- Mask tokens in diagnostics
- Clear tokens on logout

### 2.2 Roles & capabilities

Define plugin-specific roles/caps (examples):

- `seee_exped_viewer`
  - Can view SEEE dashboard pages.
- `seee_exped_admin`
  - Can manage plugin settings, mappings, patrol sync.
- `seee_exped_planner` (future)
  - Can use planning UI.
- `seee_exped_planner_admin` (future)
  - Can manage planner templates, groups, and write-back permissions.

Implement capability checks via `current_user_can(...)`.

### 2.3 Access control strategies (preserve existing concepts)

Mirror the current app’s strategy split:

- **Strategy A (Patrol-based)**: viewer can see members/events associated with allowed patrols.
- **Strategy B (Event-based)**: viewer can see explicit allowlisted events.

In WP, store allowlists in plugin tables keyed by:

- WP user ID
- or WP role
- optionally “section context” (SEEE vs others)

---

## 3. Data Architecture

### 3.1 Separation of concerns

- **Authoritative data (OSM)**
  - Always treated as read-only.
  - Retrieved server-side via WP REST endpoints.
- **Local lookup/config (WordPress DB)**
  - Patrol names/overrides, patrol grouping, mappings.
  - Access control allowlists.
  - Badge/flexi mapping configuration.
- **Cached derived data**
  - Cached OSM responses to reduce API calls and rate-limit risk.
- **Public summaries (non-OSM viewers)**
  - Sanitized summary records stored in WP DB.

### 3.2 Storage choices

Use a mix of:

- **Custom tables** for:
  - Patrol lookups and overrides.
  - Access control allowlists.
  - Public expedition summaries.
  - Planner entities (future).
- **Transients / object cache** for:
  - Short-lived caching of OSM API responses.

Avoid storing long-lived PII in WP tables unless absolutely necessary; where needed, store only minimal identifiers.

---

## 4. Suggested WordPress Database Schema (custom tables)

The naming below assumes `wp_` prefix; actual prefix is WordPress-configured.

### 4.1 Patrols (lookup + overrides)

`wp_seee_patrol`:

- `id` (PK)
- `section_id` (string/int; depends on chosen representation)
- `osm_patrol_id` (int)
- `osm_name` (varchar)
- `display_name` (varchar, nullable) — local override
- `group_key` (varchar, nullable) — optional (e.g. “Senior”, “New”, “Mixed”)
- `active` (bool)
- `member_count` (int, nullable)
- `last_synced_at` (datetime)

### 4.2 Access control

`wp_seee_access_rule`:

- `id` (PK)
- `subject_type` (enum: `user`, `role`)
- `subject_id` (user_id or role slug)
- `strategy` (enum: `A`, `B`)
- `section_id` (nullable)
- `created_at`, `updated_at`

`wp_seee_access_patrol_allow`:

- `access_rule_id` (FK)
- `osm_patrol_id`

`wp_seee_access_event_allow`:

- `access_rule_id` (FK)
- `osm_event_id`

### 4.3 Mappings (badge/flexi)

`wp_seee_mapping`:

- `id` (PK)
- `mapping_type` (enum: `badge`, `flexi_column`, `other`)
- `mapping_key` (varchar)
- `mapping_value` (varchar)
- `updated_at`

### 4.4 Public expedition summaries (non-OSM viewers)

`wp_seee_public_expedition_summary`:

- `id` (PK)
- `osm_event_id` (int, nullable) — if sourced from OSM
- `title` (varchar)
- `start_date` (date/datetime)
- `end_date` (date/datetime)
- `location` (varchar, nullable)
- `summary_json` (longtext) — strictly sanitized
- `visibility` (enum: `public`, `unlisted`)
- `updated_at`

Sanitization rule of thumb:

- Exclude member names, contact details, DOB, medical info.
- Include high-level counts and logistics summaries that are safe for public viewing.

---

## 5. Server-Side Integration with OSM

### 5.1 Plugin REST API

Expose a plugin namespace:

- `GET /wp-json/seee-exped/v1/events`
- `GET /wp-json/seee-exped/v1/events/{id}`
- `GET /wp-json/seee-exped/v1/patrols`
- `POST /wp-json/seee-exped/v1/admin/sync-patrols` (admin capability)
- `GET /wp-json/seee-exped/v1/public/expeditions` (no auth, sanitized)

All endpoints:

- enforce WP auth/capabilities
- apply access-control filtering server-side
- enforce caching/backoff

### 5.2 Rate limiting & caching

Implement protective measures equivalent to the current Next.js proxy:

- Soft backoff when nearing rate limits.
- Circuit breaker / “hard lock” behavior if OSM blocks the client.
- Cache OSM responses:
  - short-lived transients for event lists and details
  - longer-lived tables for patrol lookups

### 5.3 Data validation

In WP/PHP we won’t have Zod, but we should still validate:

- required identifiers
- array/object shapes
- date parsing

Invalid upstream payloads should fail fast with a meaningful error and should not be cached as “good” data.

---

## 6. Front-End Architecture in WordPress

### 6.1 Hybrid Rendering Strategy (Recommended)

Use different rendering approaches for different contexts:

| Context | Rendering | Rationale |
|---------|-----------|----------|
| **Leaders area** (public-facing) | PHP templates + Alpine.js | Fast, simple, no build step, SEO-friendly |
| **Admin pages** (wp-admin) | React bundle | Complex interactions, config UIs, familiar patterns |

### 6.2 Leaders Area — PHP Templates

Render event lists, event details, and dashboards via PHP templates:

- Use WordPress template parts for reusable components
- Add **Alpine.js** for progressive enhancement (dropdowns, modals, sorting)
- No Node.js build step required
- Faster initial page load
- Native WordPress patterns

Example structure:
```
templates/
├── leaders-area.php           # Main leaders area wrapper
├── partials/
│   ├── event-list.php         # Event list table/cards
│   ├── event-detail.php       # Single event view
│   ├── event-participants.php # Participants table
│   └── loading-skeleton.php   # Loading states
```

### 6.3 Admin Pages — React Bundle

Use React for complex admin interfaces:

- Patrol sync and mapping configuration
- Access control rule management
- Diagnostics dashboard
- Public summary editor

Toolchain:
- Use **@wordpress/scripts** for consistency with WordPress ecosystem
- Provides webpack config, React, and build tooling out of the box
- Handles asset versioning and dependency management

Asset registration:
```php
$asset = include plugin_dir_path(__FILE__) . 'build/admin.asset.php';
wp_enqueue_script(
    'seee-exped-admin',
    plugins_url('build/admin.js', __FILE__),
    $asset['dependencies'],
    $asset['version'],
    true
);
wp_localize_script('seee-exped-admin', 'seeeExpedConfig', [
    'restBase' => rest_url('seee-exped/v1/'),
    'nonce'    => wp_create_nonce('wp_rest'),
]);
```

### 6.4 Alpine.js Integration

For leaders area interactivity without a build step:

```php
wp_enqueue_script(
    'alpinejs',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
    [],
    '3.x.x',
    ['strategy' => 'defer']
);
```

Example usage in templates:
```html
<div x-data="{ open: false }">
    <button @click="open = !open">Toggle Details</button>
    <div x-show="open" x-transition>
        <!-- Event details -->
    </div>
</div>
```

---

## 7. Public / Non-OSM Mode

Goal: users without access to SEEE OSM sections can still see *some* expedition information.

Key decisions:

- Public data must be **explicitly curated/sanitized**.
- Public pages should never expose OSM-derived PII.

Implementation options:

- **Admin-authored summaries** stored in `wp_seee_public_expedition_summary`.
- Optionally auto-seed from OSM event headers (name/date/location) but require manual approval before publication.

---

## 8. Leaders Area Integration

### 8.1 Navigation Structure

The plugin registers:

- **wp-admin menu**: Plugin settings, admin tools, diagnostics
- **Front-end leaders area**: Accessible via dedicated page or shortcode

### 8.2 Page Protection

Protection is handled within the shortcode/template:

```php
function seee_render_leaders_area() {
    if (!is_user_logged_in()) {
        return seee_render_login_prompt();
    }
    if (!current_user_can('seee_exped_viewer')) {
        return seee_render_access_denied();
    }
    return seee_render_dashboard();
}
```

### 8.3 Front-end Menu Integration

Provide a nav menu filter or widget that:

- Shows "Leaders Area" link only to users with `seee_exped_viewer` capability
- Shows login link for unauthenticated users

### 8.4 SPA-like Navigation

Within the leaders area, use URL parameters or hash routing for sub-views:

- `/leaders-area/` — Event list
- `/leaders-area/?event=123` — Event detail
- `/leaders-area/?view=calendar` — Calendar view (future)

PHP handles routing based on query parameters; no client-side router needed.

---

## 9. Error Handling & User Feedback

### 9.1 Error Categories

| Category | User Message | Admin Visibility |
|----------|--------------|------------------|
| Rate limited (soft) | "Data may be delayed. Please wait." | Diagnostics panel shows backoff state |
| Rate limited (hard) | "Service temporarily unavailable." | Admin notification + diagnostics |
| Auth expired | "Please log in again." | User meta shows token expiry |
| OSM unreachable | "Unable to connect to OSM." | Error logged + diagnostics |
| Invalid response | "Data format error." | Full payload logged (sanitized) |

### 9.2 UI Error States

All views must handle:

- **Loading** — Spinner or skeleton
- **Error** — User-friendly message + retry option
- **Empty** — "No events found" messaging
- **Stale** — Show cached data with "last updated" timestamp

### 9.3 Admin Diagnostics Page

Provide a diagnostics screen in wp-admin showing:

- Current plugin version
- Current mode (mock/real OSM)
- Cache status (hit/miss rates, size)
- Last OSM error and backoff state
- Token status per user (encrypted, expired, etc.)

---

## 10. Expedition Planner (Future Extension)

### 10.1 Planner scope (proposed)

- Define “Expeditions” and “Expedition Groups” (e.g. patrol groupings or mixed teams).
- Assign “Training Days” to groups.
- Define logistics fields (kit lists, walking groups, tent groups).

### 10.2 Write-back to OSM (high risk)

Writing back to OSM is a material shift from the current security posture.

If we proceed, we should:

- Isolate write operations behind dedicated capabilities:
  - `seee_exped_planner_write_osm`
- Keep a full audit log of changes:
  - who, when, what changed, upstream response
- Require explicit confirmation flows in UI.
- Use least-privilege scopes and separate client credentials if OSM supports them.

### 10.3 Storage for planner

Add tables:

- `wp_seee_expedition` (core expedition entity)
- `wp_seee_expedition_group` (group/team definitions)
- `wp_seee_training_day` (training sessions)
- join tables mapping groups to members/patrols (avoid PII; store OSM IDs where possible)

---

## 11. Phased Implementation Plan

### Phase 0 — Discovery / Validation (Complete)

Decisions made:

- **OAuth**: Build custom OAuth 1.0a handler (OSM does not use OIDC).
- **Rendering**: Hybrid approach — PHP templates + Alpine.js for leaders area; React for admin pages.
- **Token storage**: Encrypted at rest using sodium/openssl.

Remaining:

- Confirm OSM API endpoints required for parity (events, event detail, patrols).
- Set up local dev environment with wp-env.

### Phase 1 — Plugin Skeleton + Read-Only Dashboard (OSM users)

- Create plugin scaffolding.
- Implement REST endpoints for events/event detail.
- Implement caching + basic rate-limit backoff.
- Implement embedded UI (shortcode or block) for Events list and Event detail.

Deliverables:

- Authenticated dashboard working end-to-end inside WP.

### Phase 2 — Lookup Data in WP DB (Patrols + mappings)

- Create tables for patrol lookups.
- Admin UI to sync patrols and manage display overrides.
- Apply patrol mapping to all relevant views.

Deliverables:

- Patrol names and local overrides are first-class in WP.

### Phase 3 — Access Control Configuration in WP

- Implement access strategy A/B in WP tables.
- Admin UI for allowlists.
- Server-side enforcement in REST endpoints.

Deliverables:

- Access control managed in WP, consistent with site roles.

### Phase 4 — Public Summaries

- Add public summary table + admin UI.
- Public endpoints/pages render sanitized summaries.

Deliverables:

- Non-OSM users can see curated expedition summary data.

### Phase 5 — Planner (No write-back yet)

- Create planner entities and UI.
- Allow authorized users to define expeditions/groups/training days in WP.

Deliverables:

- Planner works as an internal tool without touching OSM.

### Phase 6 — Planner write-back to OSM (optional)

- Introduce write-capable integration.
- Add auditing, confirmation, least-privilege scopes.
- Add negative tests and security review.

Deliverables:

- Controlled write-back flows (if approved).

---

## 12. Local Development Setup (Guide)

This section describes a practical local development setup for the proposed WordPress plugin.

### 12.1 Prerequisites

- WordPress local environment (choose one):
  - WP-ENV (`@wordpress/env`) (recommended for repeatable dev)
  - Docker Compose (if you prefer explicit containers)
  - Local by Flywheel / MAMP (fine for quick manual testing)
- Node.js (only required if we ship a React UI bundle / Gutenberg blocks).
- A database UI (optional but helpful): TablePlus / DBeaver / Adminer.

### 12.2 Recommended directory layout

Keep this repo as the “plugin workspace”, and mount/symlink the plugin into the WP install:

- Plugin source: this repository (e.g. `wp-content/plugins/seee-exped/`)
- WordPress site: separate folder managed by wp-env/docker

This allows normal git workflows on the plugin while WordPress runs elsewhere.

### 12.3 Running WordPress locally

Recommended approach (wp-env):

- Create a minimal wp-env configuration that mounts the plugin into `wp-content/plugins/`.
- Start WordPress.
- Activate the plugin in wp-admin.

Alternative (Docker Compose):

- Use a `wordpress` + `mariadb` compose stack.
- Mount the plugin folder as a volume into the container.

### 12.4 Development workflow

- PHP changes:
  - Edit plugin PHP files.
  - Reload the page / REST request (no build step).
- DB schema changes:
  - Implement using a versioned migration strategy inside the plugin.
  - On plugin activation/upgrade, apply migrations idempotently.
- React UI (if used):
  - Run a dev build/watch for the UI bundle.
  - Plugin enqueues the built assets.

### 12.5 OAuth / OSM login testing strategy

OAuth is the trickiest piece locally. Use a layered strategy:

- **Mode A (Mock auth)**
  - Provide a plugin setting/constant to bypass OAuth and impersonate a test user role.
  - Use this for day-to-day UI and REST endpoint development.
- **Mode B (Real OAuth)**
  - Configure the OAuth plugin against the OSM provider.
  - Ensure the callback URL is reachable from OSM:
    - Use a tunnel (ngrok/Cloudflare Tunnel) if required.
  - Validate:
    - login flow
    - token refresh behavior
    - role/capability mapping

Avoid committing secrets. Prefer environment variables or local-only config files.

### 12.6 OSM API integration: mock vs real

Provide a single configuration switch for the plugin:

- **Mock OSM mode**
  - REST endpoints return data from static fixtures (sanitized JSON) stored in the plugin.
  - Enables deterministic UI and access-control tests.
- **Real OSM mode**
  - REST endpoints call OSM via `wp_remote_get()`.
  - Enable caching/backoff and add visible diagnostics in wp-admin (last call time, cache hit/miss, last error).

### 12.7 Local debugging tips

- Enable `WP_DEBUG` and log to file.
- Add an admin “Diagnostics” screen showing:
  - current plugin version
  - current mode (mock/real)
  - cache status
  - last OSM error and backoff state
- Use the WordPress REST API browser (or curl/Postman) to exercise endpoints directly.

---

## 13. Risks / Open Questions

### 13.1 Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OSM OAuth 1.0a requires custom implementation | High | Medium | Build custom handler (documented above) |
| Token storage compromised | Low | Critical | Encrypt at rest, key rotation, audit access |
| Rate limiting from shared hosting IP | High | High | Aggressive caching, configurable backoff, diagnostics |
| WordPress plugin conflicts | Medium | Medium | Namespace all functions/classes, test with popular plugins |
| OSM API changes | Low | High | Version-pin API calls, monitor for deprecations |
| Public summary PII leakage | Low | Critical | Strict sanitization, admin review before publish |

### 13.2 Open Questions

- **Public summaries**: Define exactly what fields are safe to publish (propose: title, dates, location, high-level counts only).
- **Write-back scope** (Phase 6): Confirm OSM endpoints and permissions model; design audit trail and rollback strategy.
- **Hosting environment**: Confirm PHP version (8.1+ recommended), memory limits, and cron availability.

---

## 14. Plugin File Structure

```
seee-exped/
├── seee-exped.php              # Main plugin file
├── includes/
│   ├── class-plugin.php        # Core plugin class
│   ├── class-rest-api.php      # REST endpoint registration
│   ├── class-osm-client.php    # OSM API client (OAuth 1.0a)
│   ├── class-osm-oauth.php     # OAuth 1.0a handler
│   ├── class-access-control.php
│   ├── class-cache.php
│   ├── class-token-storage.php # Encrypted token handling
│   └── admin/
│       ├── class-admin.php     # Admin pages
│       └── class-settings.php  # Settings API
├── templates/
│   ├── leaders-area.php        # Main leaders area wrapper
│   └── partials/
│       ├── event-list.php
│       ├── event-detail.php
│       ├── event-participants.php
│       └── loading-skeleton.php
├── src/                        # React source (admin only)
│   ├── admin/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── hooks/
│   └── index.js
├── build/                      # Compiled React assets (admin)
├── assets/
│   ├── css/
│   │   └── leaders-area.css
│   └── js/
│       └── leaders-area.js     # Minimal vanilla JS if needed
├── tests/
│   ├── php/
│   │   ├── unit/
│   │   └── integration/
│   ├── js/
│   └── e2e/
│       └── features/           # Gherkin files
├── composer.json
├── package.json                # For admin React build only
└── README.md
```

---

## 15. Schema Versioning & Migrations

### 15.1 Version Tracking

Store schema version in `wp_options`:
- Option key: `seee_exped_db_version`
- Compare installed version to plugin version on activation/upgrade

### 15.2 Migration Strategy

```php
function seee_run_migrations() {
    $installed = get_option('seee_exped_db_version', '0.0.0');
    $migrations = [
        '1.0.0' => 'seee_migration_1_0_0',
        '1.1.0' => 'seee_migration_1_1_0',
    ];
    foreach ($migrations as $version => $callback) {
        if (version_compare($installed, $version, '<')) {
            call_user_func($callback);
            update_option('seee_exped_db_version', $version);
        }
    }
}
```

Each migration is idempotent (safe to re-run).

### 15.3 Rollback

- Provide WP-CLI command: `wp seee-exped db:rollback --to=X`
- Migrations should be reversible where possible

---

## 16. Uninstall Behavior

### 16.1 Deactivation

- Flush rewrite rules
- Optionally clear transients

### 16.2 Uninstall (uninstall.php)

Behavior controlled by plugin setting `seee_exped_keep_data_on_uninstall`:

- If **false** (default): Drop custom tables, delete options, delete user meta (tokens)
- If **true**: Preserve all data for potential reinstall

---

## 17. Suggested Next Actions

1. **Build OAuth 1.0a handler** — Implement custom OSM OAuth module with encrypted token storage.
2. **Set up hybrid rendering** — Create PHP template structure for leaders area; configure @wordpress/scripts for admin React.
3. **Agree public summary contract** — Define exactly which fields are safe to publish.
4. **Prototype Phase 1** — Single Events list in leaders area using PHP templates.
5. **Set up local dev environment** — wp-env configuration with mock OSM mode.
