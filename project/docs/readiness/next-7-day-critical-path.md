# Next 7-Day Critical Path

Date: 2026-03-18
Goal: Upgrade from discovery-ready to pilot-ready.

## Day 1

- Complete secret rotation in provider consoles.
- Archive rotation/revocation evidence in readiness pack.
- Ensure `pack-metadata.json` uses shared `pack_id` and `generated_on`.

## Day 2

- Run strict signing checks in staging/prod-like context.
- Confirm fail-closed behavior without key and pass behavior with key.

## Day 3

- Execute one staged unlearning job that produces signed evidence.
- Capture `job_id`, request context, and generated artifacts.

## Day 4

- Run evidence bundle script:
  - `npm --prefix /Users/burakcevik/Desktop/dev/control-plane run pilot:evidence:bundle`
- Archive generated bundle folder and replay report.
- Update `latest_signed_bundle_report` in all repo metadata files.

## Day 5

- Validate dashboard export behavior:
  - live dashboard exports only with proof status `complete`
  - sample compliance module export remains blocked

## Day 6

- Sync readiness docs between admin/project:
  - claim file naming
  - verdict date/version
  - checklist status parity
  - `pack-metadata.json` parity (pack id, verdict, bundle report path)

## Day 7

- Final pilot gate review:
  - signed evidence archive present
  - replay verification pass
  - secret rotation evidence present
  - no overclaim regressions (`check:claims` pass)
  - enterprise verifier passes:
    - `npm --prefix /Users/burakcevik/Desktop/dev/control-plane run readiness:verify:enterprise`
