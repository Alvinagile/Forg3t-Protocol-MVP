# Production Readiness Gate

This document explains how to run the production readiness gate that validates the entire Forg3t Protocol system before deployment.

## Overview

The release check runs the following validations in a deterministic order:

1. Install dependencies
2. Typecheck all TypeScript code
3. Lint all code
4. Run unit tests
5. CI DB safety check
6. Controlled onboarding DB smoke test
7. Build all apps

## Running Locally

To run the release check locally:

```bash
npm run release:check
```

This will run all checks with standard behavior, allowing for graceful handling of some conditions.

## Running in CI Mode

To run the release check with strict CI behavior:

```bash
npm run release:check:ci
```

This sets the following environment variables:
- `CI=true`
- `DB_SAFETY_STRICT=true`

In CI mode:
- Database unavailability will cause immediate failure
- All checks must pass for the script to succeed
- Non-zero exit codes are returned for any failure

## Required Environment Variables

The following environment variables are required for full functionality:

### Database Related
- `DATABASE_URL` - PostgreSQL connection string for database safety checks

### Service URLs
- `CONTROL_PLANE_URL` - URL for the control plane service (default: http://localhost:3000)
- `DASHBOARD_BACKEND_URL` - URL for the dashboard backend service (default: http://localhost:4000)

### Security Credentials
- `ADMIN_BOOTSTRAP_KEY` - Admin bootstrap key for privileged operations
- `SUPABASE_URL` - Supabase project URL (for Supabase integrations)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for Supabase integrations)

## GitHub Actions Integration

The release check is automatically run in GitHub Actions:

- On pull requests to `main` branch
- On pushes to `main` branch

The workflow:
1. Sets up PostgreSQL service
2. Caches node modules for faster builds
3. Installs dependencies
4. Runs the release check in CI mode

## Security Considerations

All sensitive credentials and bootstrap keys are handled server-side only and are never exposed to frontend code:

- `ADMIN_BOOTSTRAP_KEY` is only used in backend services
- Database credentials are only used in backend services
- Frontend applications use backend proxy services for privileged operations

## Troubleshooting

### Database Connection Issues
If you encounter database connection issues:
1. Ensure PostgreSQL is running
2. Verify `DATABASE_URL` is correctly set
3. Check that the database user has proper permissions

### Dependency Installation Failures
If dependency installation fails:
1. Ensure you're using the correct Node.js version (20)
2. Try clearing npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json` and reinstall

### Windows-Specific Issues
On Windows, you may encounter EPERM unlink errors, particularly with Prisma engine files:

**EPERM/EBUSY Errors:**
1. Kill all Node.js processes: `taskkill /f /im node.exe`
2. Delete `node_modules` and clear npm cache
3. Run PowerShell as Administrator
4. Add Windows Defender exclusion for the repo path

**Node Version Management:**
For reliable Windows development, use NVM for Windows:
1. Set NVM_HOME to `%LOCALAPPDATA%\nvm`
2. Set NVM_SYMLINK to `C:\Program Files\nodejs`
3. Uninstall global Node.js before using NVM
4. Install and use Node 20.11.1

### Build Failures
If builds fail:
1. Check that all TypeScript code passes type checking
2. Ensure all lint rules are satisfied
3. Verify all required environment variables are set

### Running in CI Mode on Windows
To run the release check with strict CI behavior on Windows, use cross-env for environment variable compatibility:

```bash
npx cross-env CI=true DB_SAFETY_STRICT=true npm run release:check
```

## Customization

You can customize the release check behavior by modifying `scripts/release-check.ts`:

- Add or remove steps
- Modify the order of checks
- Adjust environment variables
- Change failure behavior

The script is designed to be modular and easy to extend.