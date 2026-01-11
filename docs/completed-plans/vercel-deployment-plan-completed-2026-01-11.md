# Vercel Deployment Guide – SEEE Expedition Dashboard

## 1. Prerequisites

1. **GitHub repo access** – ensure the repo is accessible to the Vercel account you will use.
2. **Vercel Pro or Hobby plan** – Hobby is fine, but running MSW/Redis in production requires the Hobby free tier at minimum.
3. **Redis/KV backend** – production deployments must rely on Vercel KV. Local Redis is only for development/test.
4. **OSM OAuth credentials** – create two OAuth apps in the OSM developer portal (admin + standard scopes). Keep client IDs/secrets handy.
5. **Domain** – the deployment will default to `*.vercel.app`; add a custom domain if desired once the first deploy succeeds.

## 2. High-Level Steps

1. Import the repo into Vercel.
2. Configure build & output settings.
3. Supply all required environment variables (secrets).
4. Link Vercel KV (or another compatible Redis provider) and set KV URLs/secrets.
5. Trigger initial deployment.
6. Seed platform defaults (SEEE section, allowed operators) via script or manual KV updates.
7. Verify the deployment (auth flow, event pages, planner-specific routes, telemetry banner).

## 3. Project Import & Build Settings

1. Log into [Vercel](https://vercel.com) and click **Add New → Project**.
2. Select the GitHub repo (`circularlizard/SEEE-Events`). Make sure "Include all branches" is enabled if you plan to run previews from feature branches.
3. For **Framework Preset**, leave as **Next.js**.
4. Set the following build options:
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
5. Ensure **Use Turbopack** is **disabled** (the repo is on Next.js 15 App Router and uses custom server.js for dev only; production is standard Next).
6. Keep the default Node.js version (>=20) unless Vercel auto-detects otherwise.

## 4. Environment Variables

Create the variables below in **Project Settings → Environment Variables**. Add them for **Preview** and **Production** unless otherwise noted.

| Key | Notes |
| --- | --- |
| `OSM_API_URL` | Base OSM URL (default `https://www.onlinescoutmanager.co.uk`). |
| `OSM_API_TOKEN` | API token used for proxy requests when MSW is off. |
| `OSM_OAUTH_URL` | Base OAuth URL (`https://www.onlinescoutmanager.co.uk/oauth`). |
| `OSM_CLIENT_ID` / `OSM_CLIENT_SECRET` | Admin OAuth credentials (full scopes). |
| `OSM_STANDARD_CLIENT_ID` / `OSM_STANDARD_CLIENT_SECRET` | Optional: if you maintain separate creds for the standard viewer provider. Otherwise reuse the admin pair and scope-limiting config. |
| `NEXTAUTH_URL` | `https://<your-domain>` for production; leave `https://<preview>.vercel.app` for previews (Vercel auto-populates). |
| `NEXTAUTH_SECRET` | 32-byte base64 string. Generate via `openssl rand -base64 32`. |
| `LOG_LEVEL` | `info` or `warn` for production to reduce log noise. |
| `MOCK_AUTH_ENABLED` / `NEXT_PUBLIC_MOCK_AUTH_ENABLED` | `false` in production; optionally true in preview deployments tied to QA personas. |
| `NEXT_PUBLIC_USE_MSW` | `false` in production. Can be `true` in preview for testing with mock data. |
| `MSW_MODE` | Leave unset or `admin` for previews if MSW is enabled. |
| `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN` | Provided by the Vercel KV integration (see section 5). |
| `NEXT_PUBLIC_INACTIVITY_TIMEOUT_MS`, `NEXT_PUBLIC_RATE_LIMIT_TELEMETRY_POLL_MS`, `NEXT_PUBLIC_PLATFORM_CACHE_POLL_MS` | Optional overrides; safe defaults already in code. |
| `DEBUG_API_LOGGING` | Leave `false` unless debugging (writes verbose logs). |
| `INVALIDATE_SESSIONS_ON_START` | Set `true` if you need to force logouts on redeploys. |
| `CI`, `INSTRUMENT_CODE` | Leave `false`. |

### Tips
- Use Vercel **Encrypted Environment Variables** for secrets.
- For preview environments, you can set `MOCK_AUTH_ENABLED=true` and `NEXT_PUBLIC_USE_MSW=true` so testers don’t need live OSM credentials.

## 5. Connecting Vercel KV / Redis

1. In Vercel, go to **Storage → Add → KV** and create an instance (or link an existing one).
2. Once provisioned, open the KV dashboard and copy the connection details (URL + tokens).
3. Back in Project Settings → Environment Variables, add:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
4. Remove `REDIS_URL` from production environments (only used locally); the app auto-detects KV when those vars exist.
5. After the first deploy, seed the required keys:
   ```bash
   # Via Vercel CLI
   vercel env pull .env.production.local
   # edit .env.production.local to add platform defaults if needed, then push back
   ```
   Or use the Platform Admin console once authenticated to set `platform:seeeSectionId` and `platform:allowedOperators`.

## 6. OAuth Callback Configuration

In the OSM developer portal, set both callback URLs per provider:
- Admin scopes: `https://<domain>/api/auth/callback/osm-admin`
- Standard scopes: `https://<domain>/api/auth/callback/osm-standard`
Include the Vercel preview domain if you want to test live data before production cutover.

## 7. Deployment & Verification Checklist

1. **Trigger deploy:** after env vars and KV are configured, click **Deploy** from the Vercel UI (or push to the main branch).
2. **Monitor logs:** open the deployment logs and ensure `next build` completes without errors.
3. **Post-deploy smoke tests:**
   - Visit `/` and ensure the login/app selection page renders.
   - Complete an admin login (real OAuth or mock, depending on env). Verify `/dashboard/planning` loads and the data loading banner progresses without proxy errors.
   - Visit `/dashboard/events/attendance` to confirm viewer routes work.
   - Check `/dashboard/planning/members` (admin only) and the Member Data Quality page to ensure custom data loading is functional with the new staged hydration.
   - Verify the rate-limit telemetry banner shows "Connected" rather than error (requires KV + telemetry route success).
4. **Seed platform defaults:** if they weren’t imported automatically, run `KV_URL=... node scripts/seed-platform-defaults.mjs` locally with the production KV connection string, or use the Platform Admin console to set the section ID and allowed operator emails.
5. **Configure domains:** (optional) add custom domains in Project Settings → Domains and point DNS to Vercel.
6. **Set up web analytics / monitoring:** enable Vercel Analytics or your preferred tool. Ensure no PII is logged.

## 8. Future Maintenance Tips

- **Preview consistency:** keep a dedicated preview environment with mock auth/data so QA can test features without OSM rate limits.
- **Secrets rotation:** rotate OSM OAuth secrets periodically; update Vercel env vars and redeploy.
- **KV backups:** export KV data regularly (Vercel CLI `vercel storage kv export`).
- **CI alignment:** Vercel deployments should only happen after CI – Tests succeeds (per project rules). Consider enabling GitHub branch protection requiring the CI workflow.
- **Scaling:** if you move off KV, ensure the replacement still satisfies the architecture constraints (atomic locks, <10ms propagation, per-user keying).

