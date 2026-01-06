# Windows Development Setup Guide

This guide explains how to set up a reliable Node.js development environment on Windows using NVM for Windows and troubleshoot common Windows-specific issues.

## Node Version Setup with NVM for Windows

### Prerequisites
- Administrator access to your Windows machine
- Uninstall any globally installed Node.js before starting this process

### Step 1: Uninstall Global Node.js (if present)
Before using NVM for Windows, you must uninstall any globally installed Node.js to avoid symlink conflicts:

1. Open "Add or Remove Programs" from Windows Settings
2. Look for "Node.js" in the list of installed programs
3. Uninstall it completely
4. Delete the installation directory (typically `C:\Program Files\nodejs`)

### Step 2: Install NVM for Windows
1. Download NVM for Windows from the official repository: https://github.com/coreybutler/nvm-windows
2. Run the installer as Administrator
3. During installation, set:
   - NVM home: `%LOCALAPPDATA%\nvm` (typically `C:\Users\{username}\AppData\Local\nvm`)
   - NVM symlink: `C:\Program Files\nodejs`

### Step 3: Configure NVM Settings
1. Navigate to your NVM installation directory (e.g., `C:\Users\{username}\AppData\Local\nvm`)
2. Open `settings.txt` in a text editor
3. Ensure it contains the following configuration:
   ```
   root: C:\Users\{username}\AppData\Local\nvm
   path: C:\Program Files\nodejs
   arch: 64
   proxy: none
   ```
   Replace `{username}` with your actual Windows username.

### Step 4: Install and Use Node 20.19.0
1. Open PowerShell as Administrator
2. Run the following commands:
   ```powershell
   nvm install 20.19.0
   nvm use 20.19.0
   ```
3. Verify the installation:
   ```powershell
   node -v  # Should show v20.19.0
   npm -v   # Should show npm version compatible with Node 20
   ```

### Step 5: Set Node 20.19.0 as Default
To ensure Node 20.19.0 is used automatically in new terminals:
```powershell
nvm alias default 20.19.0
```

## Troubleshooting EPERM/EBUSY Errors on Windows

When running `npm ci` on Windows, you may encounter EPERM unlink errors, particularly with Prisma engine files like `query_engine-windows.dll.node`. Here are the solutions:

### Solution 1: Kill Node Processes
Before running npm commands, kill any running Node processes:
```powershell
# Kill all node processes
taskkill /f /im node.exe
taskkill /f /im npm.exe
```

### Solution 2: Clear node_modules and Caches
```powershell
# Delete node_modules
rm -r node_modules

# Clear npm cache
npm cache clean --force

# Delete package-lock.json
rm package-lock.json

# Reinstall dependencies
npm ci
```

### Solution 3: Run PowerShell as Administrator
Some operations require elevated privileges. Always run PowerShell as Administrator when installing dependencies or building the project.

### Solution 4: Add Defender Exclusions
Add Windows Defender exclusions for your development directory to prevent real-time scanning from interfering with file operations:
1. Open Windows Security
2. Go to "Virus & threat protection"
3. Click "Add or remove exclusions"
4. Add your project directory (e.g., `C:\dev\forg3t`)
5. Add the Node.js installation directory: `C:\Program Files\nodejs`

## Running Release Checks on Windows

To run the release check with CI-like behavior on Windows, use the cross-env package to set environment variables:

```powershell
# Using cross-env for Windows compatibility
npx cross-env CI=true DB_SAFETY_STRICT=true npm run release:check
```

This ensures environment variables are properly set across different platforms.

## Common Windows-Specific Issues and Solutions

### Issue: "operation not permitted" during npm install
**Solution:** Close all file explorers and text editors that might be accessing the project directory, then run the command in an elevated PowerShell.

### Issue: "EPERM operation not allowed" with Prisma
**Solution:** This is often related to antivirus software. Add the project directory to your antivirus exclusions and try again.

### Issue: Long path names causing failures
**Solution:** Enable long path support in Windows:
1. Open Local Group Policy Editor (gpedit.msc)
2. Navigate to Computer Configuration → Administrative Templates → System → Filesystem
3. Enable "Enable Win32 long paths"

### Issue: Git line ending problems
**Solution:** Configure Git to handle line endings properly:
```powershell
git config --global core.autocrlf true
```

## Development Workflow on Windows

### Starting Services
```powershell
# Start all services
docker-compose up --build
```

### Running Tests
```powershell
# Run all tests
npm test --workspaces
```

### Building the Project
```powershell
# Build all workspaces
npm run build --workspaces
```

### Running Release Check
```powershell
# Standard release check
npm run release:check

# CI mode release check (Windows compatible)
npx cross-env CI=true DB_SAFETY_STRICT=true npm run release:check
```

## Environment Variables on Windows

When setting environment variables in PowerShell, use the following syntax:
```powershell
$env:DATABASE_URL="postgresql://localhost:5432/mydb"
$env:ADMIN_BOOTSTRAP_KEY="your-bootstrap-key"
```

Or use cross-env for command execution:
```powershell
npx cross-env DATABASE_URL=postgresql://localhost:5432/mydb ADMIN_BOOTSTRAP_KEY=your-key npm run dev
```

## Security Considerations

All security practices from the main documentation apply to Windows development as well:

- Never commit plain text API keys to version control
- Use environment variables for API key configuration
- Bootstrap mode should only be enabled in development environments
- Never enable bootstrap mode in production

## Additional Resources

- [NVM for Windows GitHub Repository](https://github.com/coreybutler/nvm-windows)
- [Node.js Version Management on Windows](https://nodejs.dev/en/learn/how-to-install-nodejs/)
- [Windows Development Best Practices](https://docs.microsoft.com/en-us/windows/dev-environment/)

**Note:** All sensitive credentials and bootstrap keys are handled server-side only and are never exposed to frontend code. Secrets are configured in Fly and Netlify, not in documentation.