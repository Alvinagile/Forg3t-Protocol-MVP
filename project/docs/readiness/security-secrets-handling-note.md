# Security and Secrets Handling Note

- Secrets must be injected via environment/KMS only.
- No plaintext keys in git, frontend bundles, or logs.
- Missing secrets must block operations (fail closed).
- Rotation events must be auditable.
