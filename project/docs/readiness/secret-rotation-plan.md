# Secret Rotation Plan

1. Revoke old Pinata API key/secret immediately.
2. Create new scoped key pair for environment-specific usage.
3. Store new values in secret manager and deploy via env:
   - PINATA_API_KEY
   - PINATA_API_SECRET_API_KEY
4. Validate upload-to-ipfs returns blocked without env and success with env.
5. Record rotation timestamp, operator, and ticket ID in security log.
6. Re-run repository secret scan and attach results.
