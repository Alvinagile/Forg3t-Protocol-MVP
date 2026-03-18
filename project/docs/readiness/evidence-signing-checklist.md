# Evidence Signing Checklist

Date: 2026-03-18
Scope: `control-plane` deployment used by project dashboards

## Preconditions

- [ ] Secret exists in manager: `FORG3T_EVIDENCE_SIGNING_PRIVATE_KEY`
- [ ] Latest secret payload is non-empty
- [ ] Runtime strict flags enabled:
  - `EVIDENCE_SIGNING_REQUIRED=true`
  - `EVIDENCE_ALLOW_UNSIGNED_EVIDENCE=false`
  - `FORG3T_ENFORCE_READINESS=true`

## Required checks

- [x] Startup readiness check exists and fails closed without signing key.
- [x] Cloud deploy config injects signing key secret.
- [x] Evidence export endpoints enforce exportability checks (job success + hash/verdict/signature posture).

## Validation commands

```bash
npm --prefix /Users/burakcevik/Desktop/dev/control-plane run check:readiness:signing
FORG3T_ENFORCE_READINESS=true npm --prefix /Users/burakcevik/Desktop/dev/control-plane run check:readiness:signing
```

## Evidence required for pilot declaration

- [ ] One staged run with signed artifacts archived
- [ ] Replay verification report for that run
- [ ] Audit linkage to job/request identifiers
