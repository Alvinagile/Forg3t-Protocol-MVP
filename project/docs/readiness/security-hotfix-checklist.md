# Security Hotfix Checklist

- [x] Remove hardcoded third-party secrets from source.
- [x] Require env/KMS values for IPFS upload path.
- [x] Fail closed when credentials are missing.
- [ ] Rotate exposed Pinata credentials in provider console.
- [ ] Confirm old keys revoked and audit trail captured.
- [ ] Add secret scanning in CI (gitleaks/trufflehog).
- [ ] Add environment separation policy (dev/stage/prod).
- [ ] Add incident note documenting exposure window and remediation.
