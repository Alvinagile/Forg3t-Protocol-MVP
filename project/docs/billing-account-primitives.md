# Billing Account Primitives

## Overview

This document describes the new billing account primitives introduced to the Forg3t Protocol. These primitives provide a foundation for future Stripe integration while maintaining backward compatibility with existing billing profiles.

## Motivation

The previous billing system was tied directly to individual projects, which made it difficult to:
1. Consolidate billing across multiple projects under a single entity
2. Map to Stripe's customer model cleanly
3. Support enterprise customers with complex billing arrangements

The new billing account system addresses these limitations by introducing a layer that can own multiple projects, preparing the groundwork for Stripe integration.

## Database Schema

### billing_accounts

This table represents a billing entity that can own multiple projects.

```sql
CREATE TABLE "billing_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "billing_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "trial_ends_at_utc" TIMESTAMPTZ,
    "external_customer_ref" TEXT,  -- Future Stripe customer id
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);
```

**Fields:**
- `id`: Unique identifier for the billing account
- `tenant_id`: Foreign key to the tenant that owns this billing account
- `name`: Human-readable name for the billing account
- `billing_email`: Email address for billing communications
- `status`: Current billing status (trialing | active | past_due | suspended | canceled)
- `trial_ends_at_utc`: When the trial period ends (if applicable)
- `external_customer_ref`: Reference to external billing system (Stripe customer ID in the future)
- `created_at`: Timestamp when the billing account was created
- `updated_at`: Timestamp when the billing account was last updated

### project_billing_account_links

This table creates associations between projects and billing accounts over time.

```sql
CREATE TABLE "project_billing_account_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "billing_account_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "effective_from_utc" TIMESTAMPTZ NOT NULL,
    "effective_to_utc" TIMESTAMPTZ,
    CONSTRAINT "project_billing_account_links_pkey" PRIMARY KEY ("id")
);
```

**Fields:**
- `id`: Unique identifier for the link
- `project_id`: Foreign key to the project
- `billing_account_id`: Foreign key to the billing account
- `tenant_id`: Foreign key to the tenant (denormalized for performance)
- `effective_from_utc`: When this link becomes active
- `effective_to_utc`: When this link expires (null means indefinite)

**Constraints:**
- Unique constraint on `(project_id, effective_from_utc)` to prevent overlapping schedules
- Indexes on all foreign keys for efficient lookups

## Resolution Logic

At any given time T, the effective billing account for a project is determined by:

1. Find the latest link where `effective_from_utc <= T`
2. That link must either have `effective_to_utc IS NULL` OR `T < effective_to_utc`

If no such link exists, the system falls back to the existing project billing profile.

This resolution logic ensures:
- Deterministic billing account assignment at any point in time
- Support for scheduling future billing account changes
- Backward compatibility with existing billing profiles

## Service Layer

### BillingAccountService

Provides CRUD operations for billing accounts:

- `createBillingAccount`: Create a new billing account
- `getBillingAccount`: Retrieve a billing account by ID
- `listBillingAccounts`: List billing accounts for a tenant
- `updateBillingAccount`: Update a billing account
- `deleteBillingAccount`: Delete a billing account (with safety checks)

### BillingAccountLinkService

Manages the relationship between projects and billing accounts:

- `scheduleLink`: Schedule a billing account link for a project
- `cancelLink`: Cancel a future billing account link
- `listLinks`: List all links for a project
- `getEffectiveBillingAccount`: Resolve the effective billing account for a project at a specific time

## API Endpoints

### GET /v1/projects/:projectId/billing-account

Retrieve the effective billing account for a project at the current time.

**Response:**
```json
{
  "billingAccount": {
    "id": "uuid",
    "tenantId": "uuid",
    "name": "string",
    "billingEmail": "string",
    "status": "trialing|active|past_due|suspended|canceled",
    "trialEndsAtUtc": "ISO timestamp",
    "externalCustomerRef": "string",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  },
  "requestId": "uuid"
}
```

### GET /v1/projects/:projectId/billing-account/schedule

List all scheduled billing account links for a project.

**Response:**
```json
{
  "schedule": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "billingAccountId": "uuid",
      "tenantId": "uuid",
      "effectiveFromUtc": "ISO timestamp",
      "effectiveToUtc": "ISO timestamp"
    }
  ],
  "requestId": "uuid"
}
```

### POST /v1/projects/:projectId/billing-account/schedule (staging only)

Schedule a new billing account link for a project.

**Request Body:**
```json
{
  "billingAccountId": "uuid",
  "effectiveFromUtc": "ISO timestamp"
}
```

**Response:**
```json
{
  "link": {
    "id": "uuid",
    "projectId": "uuid",
    "billingAccountId": "uuid",
    "tenantId": "uuid",
    "effectiveFromUtc": "ISO timestamp",
    "effectiveToUtc": "ISO timestamp"
  },
  "requestId": "uuid"
}
```

### POST /v1/projects/:projectId/billing-account/schedule/:assignmentId/cancel (staging only)

Cancel a future billing account link.

**Response:**
```json
{
  "message": "Link canceled successfully",
  "requestId": "uuid"
}
```

## Integration with Existing Systems

### Backward Compatibility

Projects without billing account links continue to use the existing `project_billing_profiles` table. The billing enforcement logic prioritizes:

1. Billing account state (if linked)
2. Project billing profile (fallback)

This maintains existing behavior while enabling the new system.

### Entitlements and Enforcement

The billing enforcement middleware has been updated to:

1. Check for an effective billing account link
2. If found, use the billing account's status for enforcement
3. If not found, fall back to the project billing profile
4. Apply the same precedence rules as before

## Future Stripe Integration

The `external_customer_ref` field in `billing_accounts` is specifically designed to store Stripe customer IDs when integration is implemented. The mapping will be:

- Forg3t `billing_account` ↔ Stripe `customer`
- Projects within a billing account share the same Stripe customer
- Consolidated invoices can be generated for all projects under a billing account

## Production Gating

The scheduling and cancellation endpoints are restricted to staging environments only to prevent accidental changes in production. This follows the same pattern as other administrative endpoints in the system.

## Testing Strategy

### Unit Tests

- Resolution logic for determining effective billing accounts
- Overlap prevention in link scheduling
- Backward compatibility with projects without billing account links

### Integration Tests

- API endpoint validation
- End-to-end billing account lifecycle
- Entitlement enforcement with billing accounts

### Production Gating Tests

- Endpoint access restrictions in different environments
- Proper error responses in production

## Security Considerations

- All operations are tenant-scoped to prevent cross-tenant access
- Proper authorization checks are enforced through existing middleware
- No sensitive data (secrets, raw content) is exposed in responses
- Request IDs are included in all responses for traceability