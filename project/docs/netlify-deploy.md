# Netlify Deployments

This document provides instructions for deploying the Forg3t Protocol applications to Netlify with production-safe configurations.

## Overview

Three applications are deployed to Netlify:
1. **forg3t.io** - Landing page
2. **dashboard.forg3t.io** - User dashboard
3. **admin.forg3t.io** - Admin panel

## Required Netlify Environment Variables

### forg3t.io (Landing)
| Variable | Description | Required | Example Value |
|----------|-------------|----------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://ufdkjdsnbyoxrvperkyt.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase public key | Yes | `sb_publishable_key_here` |
| `VITE_API_BASE_URL` | Control plane API URL | Yes | `https://api.forg3t.io` |
| `VITE_ANALYTICS_ID` | Analytics tracking ID | No | `GA-XXXXXXXXX` |

### dashboard.forg3t.io (Dashboard)
| Variable | Description | Required | Example Value |
|----------|-------------|----------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://ufdkjdsnbyoxrvperkyt.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase public key | Yes | `sb_publishable_key_here` |
| `VITE_API_BASE_URL` | Control plane API URL | Yes | `https://api.forg3t.io` |
| `VITE_DASHBOARD_BACKEND_URL` | Dashboard backend proxy URL | Yes | `https://dashboard-api.forg3t.io` |
| `VITE_ANALYTICS_ID` | Analytics tracking ID | No | `GA-XXXXXXXXX` |

### admin.forg3t.io (Admin)
| Variable | Description | Required | Example Value |
|----------|-------------|----------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://ufdkjdsnbyoxrvperkyt.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase public key | Yes | `sb_publishable_key_here` |
| `VITE_API_BASE_URL` | Control plane API URL | Yes | `https://api.forg3t.io` |
| `VITE_DASHBOARD_BACKEND_URL` | Dashboard backend proxy URL | Yes | `https://dashboard-api.forg3t.io` |
| `VITE_ANALYTICS_ID` | Analytics tracking ID | No | `GA-XXXXXXXXX` |

## Supabase Redirect URLs

Configure these redirect URLs in your Supabase Authentication settings:

### Site URLs
- `https://forg3t.io`
- `https://dashboard.forg3t.io`
- `https://admin.forg3t.io`

### Additional Redirect URLs
- `https://forg3t.io/auth/callback`
- `https://dashboard.forg3t.io/auth/callback`
- `https://admin.forg3t.io/auth/callback`

## Authentication Verification Checklist

### Dashboard Authentication
- [ ] User can sign up at `https://dashboard.forg3t.io/signup`
- [ ] User receives email verification
- [ ] User can sign in at `https://dashboard.forg3t.io/signin`
- [ ] After sign in, user is redirected to `https://dashboard.forg3t.io/dash`
- [ ] User session persists across page refreshes
- [ ] User can sign out and is redirected to sign-in page

### Admin Authentication
- [ ] Only allowlisted users can access admin pages
- [ ] Non-allowlisted users are redirected to `/unauthorized`
- [ ] Allowlisted users can sign in at `https://admin.forg3t.io/signin`
- [ ] After sign in, admin users are redirected to admin dashboard
- [ ] Admin session persists across page refreshes
- [ ] Admin users can sign out and are redirected to sign-in page

## Security Considerations

### Client-Side Security
- All environment variables prefixed with `VITE_` are exposed to the client
- Only public/publishable keys should be used in client-side code
- No server secrets (API keys, service role keys, bootstrap keys) are exposed to frontend

### Content Security Policy (CSP)
Each application includes a strict CSP that:
- Allows only necessary script sources
- Permits connections to required APIs (Supabase, control plane)
- Blocks inline scripts except where absolutely necessary
- Prevents framing by other sites

### HTTP Security Headers
All applications include these security headers:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `X-Content-Type-Options: nosniff` - Prevents MIME-type sniffing
- `Strict-Transport-Security` - Enforces HTTPS
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

## Deployment Process

1. Ensure all required environment variables are set in Netlify
2. Verify Supabase redirect URLs are configured
3. Deploy each application using Netlify's continuous deployment
4. Run the authentication verification checklist
5. Monitor for any CSP violations in browser console

## Troubleshooting

### Authentication Issues
- Verify Supabase site URLs and redirect URLs match deployed domains
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Ensure email templates in Supabase use the correct callback URLs

### CSP Violations
- Check browser console for CSP violation reports
- Update CSP headers in `netlify.toml` if new legitimate sources are needed
- Never use `'unsafe-inline'` or `'unsafe-eval'` unless absolutely necessary

### Build Failures
- Verify Node.js version (should be v20)
- Check that all required environment variables are available during build
- Ensure `npm run build` completes successfully locally before deploying

## Monitoring

- Monitor Netlify deploy logs for build errors
- Check browser consoles for JavaScript errors or CSP violations
- Verify all authentication flows work as expected after deployment