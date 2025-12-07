## PR Checklist

- [ ] Follows `/.github/copilot-instructions.md` (architecture, proxy, UI standards)
- [ ] UI matches standards:
  - [ ] Page padding `p-4 md:p-6`
  - [ ] Tables `text-sm`, framed with `border rounded-lg overflow-hidden`
  - [ ] Header `thead.bg-muted`; cells `text-left p-4 font-semibold`
  - [ ] Rows `border-b last:border-b-0 hover:bg-muted/50`
- [ ] Event Detail header:
  - [ ] Big `CardTitle`; `CardDescription` with date/time/location/cost
  - [ ] `approval_status` only (no API `status: true`)
  - [ ] Public notes via `<details><summary>Event Description</summary></details>`
- [ ] Participants table:
  - [ ] Source `meta.event.members`; status from `attending`
  - [ ] Age from `member.dob`
  - [ ] Custom fields as dynamic columns using `meta.event.config` titles
  - [ ] Patrol ID via `summary.data.members` lookup where available
- [ ] Data access through `/api/proxy`; no direct OSM writes
- [ ] Typecheck/lint/tests pass:
  - [ ] `npx tsc --noEmit`
  - [ ] `npm run lint`
  - [ ] `npm run test`
  - [ ] (optional) `npm run test:e2e`

### Summary

Describe what this PR changes and why, including any screenshots for UI changes.
