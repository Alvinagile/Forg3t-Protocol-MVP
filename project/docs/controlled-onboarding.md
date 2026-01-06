# Controlled Onboarding Implementation

This document describes the implementation of the controlled onboarding feature that creates tenant, project, API key, billing account, and quotas in a single safe transaction.

## Summary

The controlled onboarding feature enhances the demo request approval process to create all necessary resources for a new tenant in a single atomic operation:

1. Tenant creation
2. Project creation
3. API key generation
4. Billing account setup with configurable plans and quotas
5. Resource quotas configuration
6. Invitation email with secure token

The implementation ensures idempotency, security, and audit logging.

## Files Changed

### Database Migrations
- [apps/dashboard/supabase/sql/023_controlled_onboarding_enhancements.sql](file:///c%3A/dev/forg3t/apps/dashboard/supabase/sql/023_controlled_onboarding_enhancements.sql) - Enhanced demo_requests table and added billing_accounts and tenant_quotas tables

### Backend Routes
- [packages/dashboard-backend/src/routes/demo-requests.ts](file:///c%3A/dev/forg3t/packages/dashboard-backend/src/routes/demo-requests.ts) - Enhanced approve endpoint with plan, quotas, and billing account creation

### Tests
- [packages/dashboard-backend/src/__tests__/controlled-onboarding.test.ts](file:///c%3A/dev/forg3t/packages/dashboard-backend/src/__tests__/controlled-onboarding.test.ts) - Integration tests for idempotency and authorization

## Database Schema

### Enhanced demo_requests Table
The demo_requests table was enhanced with new status fields and timestamps:

- `status`: pending, approved, rejected
- `reviewed_at`: When the request was reviewed
- `approved_at`: When the request was approved
- `rejected_at`: When the request was rejected
- `reviewed_by_user_id`: User who reviewed the request

### billing_accounts Table
New table to store billing information for tenants:

- `tenant_id`: Reference to the tenant
- `plan`: Subscription plan (trial, starter, pro, enterprise)
- `status`: Account status (trialing, active, past_due, suspended, canceled)
- `external_billing_url`: Link to external billing system
- `trial_ends_at_utc`: When the trial period ends

### tenant_quotas Table
New table to store resource quotas for tenants:

- `tenant_id`: Reference to the tenant
- `max_projects`: Maximum number of projects allowed
- `max_api_keys`: Maximum number of API keys allowed
- `monthly_jobs_limit`: Maximum number of jobs per month
- `monthly_requests_limit`: Maximum number of requests per month

## Endpoint Contract

### Approve Demo Request
```
POST /api/v1/demo-requests/approve

Body:
{
  "demoRequestId": "uuid",
  "userEmail": "string",
  "plan": "trial|starter|pro|enterprise", // Optional, defaults to 'trial'
  "trialEndsAtUtc": "ISO8601 datetime", // Optional
  "externalBillingUrl": "string", // Optional
  "quotas": { // Optional
    "maxProjects": "integer",
    "maxApiKeys": "integer", 
    "monthlyJobsLimit": "integer",
    "monthlyRequestsLimit": "integer"
  }
}

Response:
{
  "message": "Demo request approved successfully",
  "tenantId": "uuid",
  "projectId": "uuid", 
  "apiKeyId": "uuid"
}
```

### Reject Demo Request
```
POST /api/v1/demo-requests/reject

Body:
{
  "demoRequestId": "uuid"
}

Response:
{
  "message": "Demo request rejected successfully"
}
```

## Security Features

1. **Admin Authorization**: Only allowlisted admins can approve demo requests
2. **Public Insert Only**: Public users can only insert demo requests, not modify them
3. **Tenant Isolation**: All operations are tenant-isolated
4. **Audit Logging**: All approval and rejection operations are logged

## Idempotency

The approval process is idempotent:
- Re-approving the same demo request returns existing resources without duplication
- Uses the tenant_id field in demo_requests to detect already processed requests
- Prevents duplicate calls to the control plane

## How to Run Tests

### Unit Tests
```bash
cd packages/dashboard-backend
npm test
```

### Integration Tests
```bash
cd packages/dashboard-backend
npm run test:onboarding
```

### Test Individual Files
```bash
cd packages/dashboard-backend
npx jest src/__tests__/controlled-onboarding.test.ts
```

## Audit Logging

All operations are logged with structured logging:
- Approval operations include tenantId, projectId, userEmail, plan, and quotas
- Rejection operations include demoRequestId and userEmail
- All logs include request IDs for traceability