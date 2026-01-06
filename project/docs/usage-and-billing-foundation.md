# Usage and Billing Foundation

This document explains how usage events are tracked, rolled up, and how quotas are enforced in the Forg3t Protocol. It also describes how this system maps to future billing line items for Stripe integration.

## Event Types and Meaning

The Forg3t Protocol tracks various types of usage events that correspond to different operations within the system:

### Core Event Types

| Event Type | Description |
|------------|-------------|
| `job_submit` | A new unlearning job has been submitted to the system |
| `job_complete` | An unlearning job has successfully completed |
| `request_create` | A new unlearning request has been created |
| `evidence_generate` | Evidence has been generated for an unlearning operation |
| `audit_event` | Security or compliance-related audit events |

### Event Metadata

Each usage event includes the following metadata:
- `projectId`: The project this event belongs to
- `timestamp`: ISO 8601 formatted timestamp when the event occurred
- `requestId`: Optional correlation ID for tracing requests
- `metadata`: Additional event-specific data

## How Rollups Work

Usage events are aggregated into daily rollups to provide meaningful summaries for billing and monitoring purposes.

### Rollup Process

1. **Collection**: Events are collected throughout the day as operations occur
2. **Aggregation**: At the end of each day (UTC), events are grouped by:
   - Project ID
   - Event type
   - Day (bucketed by UTC date)
3. **Storage**: Aggregated counts and metadata are stored in rollup records
4. **Retention**: Rollup data is retained for billing and reporting purposes

### Rollup Data Structure

```typescript
interface UsageSummary {
  projectId: string;
  eventType: UsageEventType;
  count: number;
  firstEventAt: string;  // ISO timestamp
  lastEventAt: string;   // ISO timestamp
}
```

### Example Rollup

For a project with the following events on 2025-12-17:
- 25 job_submit events
- 20 job_complete events
- 5 evidence_generate events

The system would create a rollup record similar to:
```json
[
  {
    "projectId": "proj_123",
    "eventType": "job_submit",
    "count": 25,
    "firstEventAt": "2025-12-17T00:01:23Z",
    "lastEventAt": "2025-12-17T23:58:45Z"
  },
  {
    "projectId": "proj_123",
    "eventType": "job_complete",
    "count": 20,
    "firstEventAt": "2025-12-17T02:15:30Z",
    "lastEventAt": "2025-12-17T22:45:12Z"
  },
  {
    "projectId": "proj_123",
    "eventType": "evidence_generate",
    "count": 5,
    "firstEventAt": "2025-12-17T03:30:15Z",
    "lastEventAt": "2025-12-17T19:22:08Z"
  }
]
```

## Quota Enforcement Behavior

Quotas are used to limit resource consumption and prevent abuse of the system.

### Quota Types

| Quota Type | Description | Typical Use Case |
|------------|-------------|------------------|
| Daily | Reset every 24 hours | Preventing burst usage |
| Weekly | Reset every 7 days | Balancing weekly workloads |
| Monthly | Reset every 30 days | Overall resource allocation |

### Hard vs Soft Limits

- **Hard Limits**: Operations are rejected when the limit is reached
- **Soft Limits**: Operations are allowed but warnings are issued

### Quota Data Structure

```typescript
interface Quota {
  id: string;
  projectId: string;
  eventType: UsageEventType;
  period: 'daily' | 'weekly' | 'monthly';
  limit: number;
  used: number;
  hardLimit: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Quota Checking Process

1. **Event Occurrence**: When an event occurs, the system checks applicable quotas
2. **Counter Update**: The usage counter for the quota is incremented
3. **Limit Check**: If the counter exceeds the limit:
   - For hard limits: The operation is rejected with an error
   - For soft limits: The operation proceeds but a warning is logged
4. **Reset Schedule**: Counters are reset according to their period schedule

### Example Quota Enforcement

A project might have the following quotas configured:
```json
{
  "projectId": "proj_123",
  "quotas": [
    {
      "id": "quota_1",
      "eventType": "job_submit",
      "period": "daily",
      "limit": 100,
      "used": 75,
      "hardLimit": true
    },
    {
      "id": "quota_2",
      "eventType": "evidence_generate",
      "period": "monthly",
      "limit": 1000,
      "used": 850,
      "hardLimit": false
    }
  ]
}
```

In this example:
- The project can submit up to 100 jobs per day (hard limit)
- The project has used 75 of those slots today
- The project can generate up to 1000 pieces of evidence per month (soft limit)
- The project has generated 850 pieces of evidence this month

## Project Health Monitoring

The Forg3t Protocol provides comprehensive project health monitoring that aggregates data from multiple subsystems to give operators a unified view of project status.

### Health Data Sources

1. **Billing State**: Current billing status, scheduled changes, and transition history
2. **Plan Schedule**: Current plan, upcoming changes, and full schedule history
3. **Entitlements**: Active capabilities, quota limits, and write access status
4. **Usage and Quotas**: Real-time quota consumption and limits
5. **Quota Blocks**: Recent enforcement actions with reason codes
6. **Anomalies**: Detected issues with severity and suggested actions
7. **Webhook Reliability**: Delivery queue status and dispatcher health

### Health APIs

Operators can access project health through two primary endpoints:

1. **Health Snapshot**: Point-in-time comprehensive view
   ```
   GET /v1/projects/{projectId}/health
   ```

2. **Health Timeline**: Historical view over a date range
   ```
   GET /v1/projects/{projectId}/health/timeline?fromDayUtc=YYYY-MM-DD&toDayUtc=YYYY-MM-DD
   ```

These APIs enable proactive monitoring and troubleshooting of project issues.

## Mapping to Stripe Meters

The usage tracking system is designed to integrate with Stripe's metered billing system.

### Stripe Meter Mapping

| Forg3t Event Type | Stripe Meter ID | Description |
|-------------------|-----------------|-------------|
| `job_submit` | `meter_job_submissions` | Count of job submissions |
| `job_complete` | `meter_jobs_completed` | Count of completed jobs |
| `evidence_generate` | `meter_evidence_generated` | Count of evidence generation events |
| `request_create` | `meter_requests_created` | Count of unlearning requests |
| `audit_event` | `meter_audit_events` | Count of audit events (security/compliance) |

### Billing Model Examples

#### Tiered Pricing Model

```javascript
// Example Stripe pricing tiers
const pricingTiers = [
  {
    up_to: 1000,  // First 1000 job submissions
    unit_amount: 0.10  // $0.10 per submission
  },
  {
    up_to: 10000,  // Next 9000 submissions
    unit_amount: 0.08  // $0.08 per submission
  },
  {
    up_to: null,  // Above 10000 submissions
    unit_amount: 0.05  // $0.05 per submission
  }
];
```

#### Per-Event Pricing Model

```javascript
// Simple per-event pricing
const eventPrices = {
  'job_submit': 0.15,      // $0.15 per job submission
  'job_complete': 0.10,    // $0.10 per completed job
  'evidence_generate': 0.05 // $0.05 per evidence item
};
```

### Integration Flow

1. **Daily Sync**: Usage rollups are synced to Stripe daily
2. **Meter Updates**: Stripe meters are updated with new usage counts
3. **Billing Calculation**: Stripe calculates billing based on configured pricing
4. **Invoice Generation**: Invoices are generated based on usage and pricing

## Cost Attribution System

The cost attribution system provides a foundation for understanding unit economics without implementing actual pricing. It maps usage events to cost events with deterministic weightings to enable analysis of resource consumption patterns.

### Cost Events

Cost events are derived from usage events and include cost weightings that represent the relative cost of different operations. Unlike billing events, cost events do not include monetary values, only dimensionless weights.

### Cost Event Data Structure

```typescript
interface CostEvent {
  id: string;
  projectId: string;
  meterKey: string;
  units: number;
  costWeight: number;
  occurredAt: string; // ISO timestamp
}
```

### Cost Weighting Model

The system applies deterministic cost weights to different event types based on their relative resource consumption:

| Event Type | Cost Weight | Description |
|------------|-------------|-------------|
| `job_submit` | 1.0 | Base unit for job submission |
| `job_complete` | 1.5 | Completed jobs consume more resources |
| `job_fail` | 0.5 | Failed jobs consume fewer resources |
| `webhook_delivery_attempt` | 0.1 | Lightweight delivery attempt |
| `webhook_delivery_success` | 0.2 | Successful delivery consumes more resources |
| `webhook_delivery_fail` | 0.1 | Failed delivery consumes fewer resources |
| `api_key_create` | 0.05 | Minimal cost for API key creation |
| `proof_bundle_create` | 2.0 | High cost for cryptographic operations |
| `http_requests_total` | 0.01 | Very low cost per HTTP request |
| `unlearning_submit` | 3.0 | High cost for initiating unlearning |
| `unlearning_complete` | 4.0 | Highest cost for completing unlearning |
| `unlearning_fail` | 1.0 | Moderate cost for failed unlearning |

### Cost Preview Data Structure

```typescript
interface CostPreviewItem {
  meterKey: string;
  totalUnits: number;
  totalCostWeight: number;
}
```

### API Endpoints

#### Get Cost Preview

```
GET /v1/projects/{projectId}/cost-preview?fromDayUtc={YYYY-MM-DD}&toDayUtc={YYYY-MM-DD}
```

Returns cost preview data for the specified project and date range.

Response:
```json
{
  "costPreview": [
    {
      "meterKey": "forg3t.jobs.submit",
      "totalUnits": 100,
      "totalCostWeight": 100.0
    },
    {
      "meterKey": "forg3t.jobs.complete",
      "totalUnits": 95,
      "totalCostWeight": 142.5
    }
  ],
  "from": "2025-12-01",
  "to": "2025-12-31",
  "requestId": "abcd-1234-efgh-5678"
}
```

## Usage Tracking Examples

### Node.js SDK Example

```javascript
import { Forg3tClient } from '@forg3t/client-sdk';

const client = new Forg3tClient({
  apiUrl: 'https://api.forg3t.example.com',
  apiKey: process.env.FORG3T_API_KEY
});

// Get usage summary for the current month
async function getCurrentMonthUsage(projectId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const usageSummary = await client.getUsageSummary(projectId, {
    from: startOfMonth.toISOString(),
    to: endOfMonth.toISOString()
  });

  console.log('Monthly Usage Summary:');
  usageSummary.data.forEach(summary => {
    console.log(`  ${summary.eventType}: ${summary.count} events`);
  });
}

// Export usage data for analysis
async function exportUsageData(projectId) {
  const usageExport = await client.exportUsage(projectId, {
    from: '2025-12-01T00:00:00Z',
    to: '2025-12-31T23:59:59Z',
    format: 'csv'
  });

  // Save to file or process as needed
  console.log(usageExport.data);
}

// Check current quota status
async function checkQuotas(projectId) {
  const quotaStatus = await client.getQuotas(projectId);
  
  console.log('Quota Status:');
  quotaStatus.data.quotas.forEach(quota => {
    const percentage = (quota.used / quota.limit * 100).toFixed(1);
    console.log(`  ${quota.eventType} (${quota.period}): ${quota.used}/${quota.limit} (${percentage}%)`);
  });

  if (quotaStatus.data.exceededQuotas.length > 0) {
    console.warn('Warning: The following quotas have been exceeded:');
    quotaStatus.data.exceededQuotas.forEach(quotaId => {
      console.warn(`  - Quota ID: ${quotaId}`);
    });
  }
}
```

### Python SDK Example

```python
from forg3t import Client

client = Client(
    api_url="https://api.forg3t.example.com",
    api_key=os.environ["FORG3T_API_KEY"]
)

# Get usage summary for the current month
def get_current_month_usage(project_id):
    import datetime
    
    now = datetime.datetime.now()
    start_of_month = datetime.datetime(now.year, now.month, 1)
    end_of_month = datetime.datetime(now.year, now.month + 1, 1) - datetime.timedelta(days=1)
    
    usage_summary = client.get_usage_summary(
        project_id=project_id,
        from_date=start_of_month.isoformat(),
        to_date=end_of_month.isoformat()
    )
    
    print("Monthly Usage Summary:")
    for summary in usage_summary.data:
        print(f"  {summary.event_type}: {summary.count} events")

# Export usage data for analysis
def export_usage_data(project_id):
    usage_export = client.export_usage(
        project_id=project_id,
        from_date="2025-12-01T00:00:00Z",
        to_date="2025-12-31T23:59:59Z",
        format="csv"
    )
    
    # Save to file or process as needed
    print(usage_export.data)

# Check current quota status
def check_quotas(project_id):
    quota_status = client.get_quotas(project_id=project_id)
    
    print("Quota Status:")
    for quota in quota_status.data.quotas:
        percentage = (quota.used / quota.limit) * 100
        print(f"  {quota.event_type} ({quota.period}): {quota.used}/{quota.limit} ({percentage:.1f}%)")
    
    if quota_status.data.exceeded_quotas:
        print("Warning: The following quotas have been exceeded:")
        for quota_id in quota_status.data.exceeded_quotas:
            print(f"  - Quota ID: {quota_id}")
```

### CLI Examples

```bash
# Get usage summary for a project
forg3t usage summary --project proj_123 --from 2025-12-01 --to 2025-12-31

# Export usage data in CSV format
forg3t usage export --project proj_123 --from 2025-12-01 --to 2025-12-31 --format csv > usage-december.csv

# Export usage data in JSONL format
forg3t usage export --project proj_123 --from 2025-12-01 --to 2025-12-31 --format jsonl > usage-december.jsonl

# Check current quota status
forg3t quotas get --project proj_123

# Set a quota (staging only)
forg3t quotas set --project proj_123 --event job_submit --period monthly --limit 100000 --hard true
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Usage Trends**: Track usage patterns to predict scaling needs
2. **Quota Utilization**: Monitor how close projects are to their quotas
3. **Rate Limiting**: Track how often rate limits are hit
4. **Billing Accuracy**: Ensure usage reporting matches actual consumption

### Alerting Thresholds

- **80% Quota Warning**: Notify when a project reaches 80% of any quota
- **95% Quota Critical**: Urgent notification when approaching hard limits
- **Unusual Spikes**: Alert on sudden increases in usage patterns
- **Billing Discrepancies**: Flag when reported usage differs from expected patterns

## Billing Profile System

The billing profile system manages project billing statuses and enforces restrictions when accounts are suspended.

### Billing Statuses

| Status | Description | Restrictions |
|--------|-------------|--------------|
| `trial` | Free trial period | None |
| `active` | Active paid account | None |
| `past_due` | Payment is past due | Limited features |
| `suspended` | Account suspended due to non-payment | Write operations blocked |

### Billing Profile Data Structure

```typescript
interface BillingProfile {
  id: string;
  projectId: string;
  billingStatus: 'trial' | 'active' | 'past_due' | 'suspended';
  trialEndsAt: string | null;  // ISO timestamp
  billingEmail: string | null;
  externalCustomerRef: string | null;  // For future Stripe integration
  createdAt: string;  // ISO timestamp
  updatedAt: string;  // ISO timestamp
}
```

### Blocked Actions When Suspended

When a project's billing status is `suspended`, the following write operations are blocked:

- Creating new jobs
- Creating or updating webhooks
- Creating or updating API keys
- Creating or updating signing keys
- Creating or updating unlearning requests

Read operations continue to function normally.

### API Endpoints

#### Get Billing Profile

```
GET /v1/projects/{projectId}/billing-profile
```

Returns the billing profile for the specified project. If no profile exists, a default trial profile is created.

#### Update Billing Profile (Admin Only)

```
POST /v1/projects/{projectId}/billing-profile
```

Updates the billing profile for the specified project. This endpoint is only available in development, test, and staging environments.

Request body:
```json
{
  "billingStatus": "suspended",
  "trialEndsAt": "2026-01-15T00:00:00Z",
  "billingEmail": "billing@example.com"
}
```

## Entitlements System

The entitlements system manages project plans, capabilities, and quota limits.

### Plan Templates

The system includes predefined plan templates:

| Plan | Description | Key Features |
|------|-------------|--------------|
| Free | Basic plan for getting started | Limited quotas, no webhooks |
| Pro | Professional plan for growing teams | Higher quotas, webhooks enabled |
| Enterprise | Full-featured plan for organizations | Highest quotas, all features |

### Entitlements Data Structure

```typescript
interface Entitlements {
  planKey: string;
  capabilities: Record<string, any>;
  quotaLimits: Array<{
    meterKey: string;
    limit: number;
    period: 'daily' | 'monthly';
  }>;
  effectiveFrom: string; // ISO timestamp
}
```

### API Endpoints

#### Get Entitlements

```
GET /v1/projects/{projectId}/entitlements
```

Returns the effective entitlements for the specified project.

#### Assign Plan (Admin Only)

```
POST /v1/projects/{projectId}/plan
```

Assigns a plan to the specified project. This endpoint is only available in development, test, and staging environments.

Request body:
```json
{
  "planKey": "pro",
  "effectiveFrom": "2026-01-01T00:00:00Z"
}
```

## Dashboard Improvements

The dashboard has been enhanced with observability and operator-friendly features.

### Global Banner

A global banner is displayed at the top of the dashboard when actions are blocked due to billing or capability restrictions. The banner provides immediate visibility into account status issues.

### "Why Am I Blocked" Modal

Users can click on the "Blocked" indicator in the navigation bar to open a modal that explains why actions are blocked and provides next steps to resolve the issue.

### Export Entitlements

The Entitlements page includes an "Export JSON" button that allows users to download a snapshot of their current entitlements, including plan information, capabilities, and quota limits.

### New Dashboard Pages

#### Billing Profile Page

The Billing Profile page displays detailed information about the project's billing status, including:
- Current billing status (trial, active, past due, suspended)
- Trial expiration date (if applicable)
- Billing contact email
- External customer reference
- Last updated timestamp

#### Entitlements Page

The Entitlements page displays comprehensive information about the project's entitlements, including:
- Current plan and effective date
- All capabilities with their enabled/disabled status
- All quota limits with their values and periods
- Export functionality for entitlements data

#### Cost Preview Page

The Cost Preview page displays cost attribution data for analyzing unit economics, including:
- Cost preview data grouped by meter key
- Total units and cost weights
- Visualization of cost distribution
- Export functionality for cost data in CSV/JSONL formats

## Observability and Monitoring

### Metrics

The system exposes the following metrics for monitoring plan changes, billing status changes, and entitlement blocks:

| Metric | Labels | Description |
|--------|--------|-------------|
| `plan_changes_total` | `planKey` | Total number of plan changes by plan key |
| `billing_status_changes_total` | `status` | Total number of billing status changes by status |
| `entitlement_blocks_total` | `reason` | Total number of entitlement blocks by reason |
| `quota_blocks_total` | `meterKey` | Total number of quota blocks by meter key |
| `quota_warnings_total` | `meterKey` | Total number of quota warnings by meter key |

These metrics are exposed in Prometheus format and can be scraped from the `/v1/ops/metrics` endpoint.

### Error Codes

The system defines standardized error codes for capability and billing restrictions:

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `CAPABILITY_NOT_ALLOWED` | 403 | Operation blocked due to capability restrictions |
| `BILLING_SUSPENDED` | 403 | Operation blocked due to suspended billing status |
| `QUOTA_EXCEEDED` | 429 | Operation blocked due to quota limits |

All error responses include a `requestId` and `details` object for troubleshooting.

## CLI Commands

The Forg3t CLI includes commands for retrieving entitlements and billing profile information:

### Get Entitlements

```bash
forg3t entitlements get --project <project-id>
```

Displays the current plan, capabilities, and quota limits for a project. Includes the request ID for troubleshooting.

Example output:
```
Request ID: abcd-1234-efgh-5678

Plan Key: pro
Effective From: 2026-01-01T00:00:00Z

Capabilities:
  allowWebhooks: true
  allowProofSignatures: true
  maxProjects: 5
  maxApiKeysPerProject: 10
  maxJobsPerDay: 1000
  maxWebhooksPerProject: 10
  allowCustomJobTypes: false
  allowAdvancedQuotas: true

Quota Limits:
Meter Key                           Limit  Period
─────────────────────────────────── ────── ───────
forg3t.job.submit                  10000  monthly
forg3t.job.complete                10000  monthly
forg3t.webhooks.delivery_attempt    10000  monthly
forg3t.http.requests                100000 monthly
forg3t.apikeys.create               10     monthly
forg3t.proofbundles.create          1000   monthly
```

### Get Billing Profile

```bash
forg3t billing-profile get --project <project-id>
```

Displays the current billing status, trial information, and contact details for a project. Includes the request ID for troubleshooting.

Example output:
```
Request ID: efgh-5678-abcd-1234

Project ID: proj_123
Billing Status: active
Trial Ends At: N/A
Billing Email: billing@example.com
```

## Abuse and Anomaly Detection

The abuse and anomaly detection system monitors usage patterns to identify potential abuse and unusual activity that could impact billing accuracy.

### Anomaly Detection Rules

The system implements two primary anomaly detection rules:

1. **Sudden Spike Detection**: Identifies sudden, significant increases in usage for specific meter keys by comparing recent usage to historical averages
2. **Repeated Quota Warnings Without Upgrade**: Detects patterns where projects repeatedly hit quota limits without upgrading their plan

### Anomaly Data Structure

```typescript
interface Anomaly {
  id: string;
  projectId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string; // ISO timestamp
  suggestedAction: string;
  details?: Record<string, any>;
}
```

### API Endpoints

#### Get Anomalies

```
GET /v1/projects/{projectId}/anomalies
```

Returns detected anomalies for the specified project, including reasons and suggested actions.

Response:
```json
{
  "anomalies": [
    {
      "id": "spike-proj_123-job_submit-1234567890",
      "projectId": "proj_123",
      "reason": "usage_spike_job_submit",
      "severity": "high",
      "detectedAt": "2025-12-18T10:30:00Z",
      "suggestedAction": "Review job_submit usage patterns and consider rate limiting if abusive",
      "details": {
        "eventType": "job_submit",
        "recentQuantity": 1000,
        "historicalAverage": 100,
        "multiplier": "10.00"
      }
    }
  ],
  "requestId": "abcd-1234-efgh-5678"
}
```

### Dashboard Integration

The dashboard includes an Anomalies page that displays detected anomalies with severity levels, timestamps, and suggested actions. Users can monitor for unusual usage patterns and potential abuse through this interface.

### Metrics

The system exposes metrics for detected anomalies:

| Metric | Labels | Description |
|--------|--------|-------------|
| `anomalies_detected_total` | `reason` | Total number of anomalies detected by reason |

These metrics follow the principle of not including tenant or project identifiers in labels to maintain privacy.

## Support Bundle for Debugging

The support bundle feature provides a comprehensive snapshot of a project's entitlements, billing state, and recent activity to aid in debugging across SDK, CLI, and support workflows.

### Support Bundle Contents

The support bundle includes:

1. **Entitlements Snapshot**: Current plan, capabilities, and quota limits
2. **Billing Profile Snapshot**: Current billing status and related information
3. **Recent Audit Events**: Last 7 days of audit events for the project
4. **Recent Quota Blocks**: Quota block events from the recent audit history

All data is redacted to remove sensitive information before inclusion in the bundle.

### API Endpoint

#### Get Support Bundle

```
GET /v1/projects/{projectId}/support-bundle
```

Returns a support bundle containing entitlements, billing profile, recent audit events, and recent quota blocks.

Response:
```json
{
  "entitlementsSnapshot": {
    "planKey": "pro",
    "capabilities": {
      "allowWebhooks": true,
      "maxJobsPerDay": 1000
    },
    "quotaLimits": [
      {
        "meterKey": "forg3t.job.submit",
        "limit": 10000,
        "period": "monthly"
      }
    ],
    "effectiveFrom": "2025-12-18T00:00:00Z"
  },
  "billingProfileSnapshot": {
    "billingStatus": "active",
    "trialEndsAt": null,
    "billingEmail": null,
    "externalCustomerRef": null,
    "createdAt": "2025-12-18T00:00:00Z",
    "updatedAt": "2025-12-18T00:00:00Z"
  },
  "recentAuditEvents": [
    {
      "id": "audit-123",
      "action": "job_submit",
      "resourceType": "job",
      "resourceId": "job-456",
      "ip": "127.0.0.1",
      "userAgent": "sdk-client",
      "createdAt": "2025-12-18T10:30:00Z",
      "metadata": {
        "eventType": "job_submit"
      }
    }
  ],
  "recentQuotaBlocks": [
    {
      "id": "audit-789",
      "action": "quota_block",
      "resourceType": "quota",
      "resourceId": "quota-123",
      "ip": "127.0.0.1",
      "userAgent": "system",
      "createdAt": "2025-12-18T09:15:00Z",
      "metadata": {
        "eventType": "job_submit",
        "limit": 1000
      }
    }
  ],
  "generatedAt": "2025-12-18T11:00:00Z",
  "requestId": "abcd-1234-efgh-5678"
}
```

### Dashboard Integration

The dashboard includes an "Export Support Bundle" button on the Entitlements page that allows users to download a JSON file containing the support bundle for their project.

### CLI Command

#### Export Support Bundle

```bash
forg3t support-bundle export --project <project-id> --format json
```

Exports a support bundle for the specified project in JSON format.

Example output:
```bash
$ forg3t support-bundle export --project proj_123 --format json
{
  "entitlementsSnapshot": {
    "planKey": "pro",
    "capabilities": {
      "allowWebhooks": true
    },
    "quotaLimits": [],
    "effectiveFrom": "2025-12-18T00:00:00Z"
  },
  "billingProfileSnapshot": {
    "billingStatus": "active",
    "billingEmail": null
  },
  "recentAuditEvents": [],
  "recentQuotaBlocks": [],
  "generatedAt": "2025-12-18T11:00:00Z",
  "requestId": "abcd-1234-efgh-5678"
}
```

## Invoice Preview

The Invoice Preview feature allows customers to preview their usage and cost data for billing purposes without generating actual charges. This feature provides visibility into usage patterns and helps with budgeting and forecasting.

### Key Features

1. **Usage Totals**: Aggregated usage data by canonical meter key
2. **Cost Weight Totals**: Calculated cost weights based on usage and pricing models
3. **Plan Information**: Current plan key at the time window
4. **Warnings**: Quota and billing warnings to alert customers of potential issues
5. **UTC Date Range Selection**: Flexible date range selection in UTC
6. **Export Options**: Export to CSV and JSONL formats

### API Endpoint

#### Get Invoice Preview

```
GET /v1/projects/{projectId}/invoice-preview?fromDayUtc=YYYY-MM-DD&toDayUtc=YYYY-MM-DD
```

Returns an invoice preview containing usage totals, cost weight totals, plan key, and warnings for the specified date range.

Response:
```json
{
  "usageTotals": {
    "forg3t.job.submit": 150,
    "forg3t.job.complete": 145
  },
  "costWeightTotals": {
    "forg3t.job.submit": 150.0,
    "forg3t.job.complete": 217.5
  },
  "planKey": "pro",
  "warnings": {
    "quotaWarnings": [
      {
        "meterKey": "forg3t.job.submit",
        "limit": 1000,
        "used": 150,
        "period": "monthly"
      }
    ],
    "billingWarnings": [
      "Payment is past due. Please update payment method to avoid suspension."
    ]
  },
  "fromDayUtc": "2025-12-01",
  "toDayUtc": "2025-12-31",
  "requestId": "abcd-1234-efgh-5678"
}
```

### Dashboard Integration

The dashboard includes an "Invoice Preview" page with a UTC date range picker that allows users to view and export invoice preview data.

### CLI Command

#### Get Invoice Preview

```bash
forg3t invoice preview --project <project-id> --from <YYYY-MM-DD> --to <YYYY-MM-DD> [--format json|csv|jsonl]
```

Gets an invoice preview for the specified project and date range in the requested format.

Example output:
```bash
$ forg3t invoice preview --project proj_123 --from 2025-12-01 --to 2025-12-31 --format table
Request ID: abcd-1234-efgh-5678

Invoice Preview for 2025-12-01 to 2025-12-31
Plan: pro

⚠️  Warnings:
  • Quota exceeded for forg3t.job.submit: 150/1000 (monthly)
  • Payment is past due. Please update payment method to avoid suspension.

Meter Key                             Units    Cost Weight
───────────────────────────────────── ──────── ───────────
forg3t.job.submit                   150      150.00     
forg3t.job.complete                  145      217.50     

Note: This is a preview only and not a charge.
```

## Meter Key Registry

The Meter Key Registry provides a single source of truth for all meter keys used in the system. These canonical meter keys are used consistently across usage tracking, billing, and reporting systems.

### Canonical Meter Keys

| Domain | Event | Meter Key | Description |
|--------|-------|-----------|-------------|
| Jobs | Submit | `forg3t.job.submit` | Job submission event |
| Jobs | Claim | `forg3t.job.claim` | Job claim event |
| Jobs | Complete | `forg3t.job.complete` | Job completion event |
| Jobs | Fail | `forg3t.job.fail` | Job failure event |
| Jobs | Cancel | `forg3t.job.cancel` | Job cancellation event |
| Jobs | Dead | `forg3t.job.dead` | Job dead letter event |
| Webhooks | Delivery Attempt | `forg3t.webhooks.delivery_attempt` | Webhook delivery attempt event |
| Webhooks | Delivery Success | `forg3t.webhooks.delivery_success` | Successful webhook delivery event |
| Webhooks | Delivery Fail | `forg3t.webhooks.delivery_fail` | Failed webhook delivery event |
| Webhooks | Delivery Dead | `forg3t.webhooks.delivery_dead` | Dead webhook delivery event |
| API Keys | Create | `forg3t.apikeys.create` | API key creation event |
| API Keys | Rotate | `forg3t.apikeys.rotate` | API key rotation event |
| API Keys | Revoke | `forg3t.apikeys.revoke` | API key revocation event |
| Proof Bundles | Create | `forg3t.proofbundles.create` | Proof bundle creation event |
| Proof Bundles | Sign | `forg3t.proofbundles.sign` | Proof bundle signing event |
| Proof Bundles | Verify | `forg3t.proofbundles.verify` | Proof bundle verification event |
| HTTP Requests | Total | `forg3t.http.requests` | HTTP request event |
| Unlearning | Submit | `forg3t.unlearning.submit` | Unlearning request submission event |
| Unlearning | Complete | `forg3t.unlearning.complete` | Unlearning request completion event |
| Unlearning | Fail | `forg3t.unlearning.fail` | Unlearning request failure event |

### Mapping to Stripe Meters (Day 46-47 Integration)

For the Stripe integration in Days 46-47, these canonical meter keys will map directly to Stripe meter IDs:

| Forg3t Meter Key | Stripe Meter ID | Description |
|------------------|-----------------|-------------|
| `forg3t.job.submit` | `meter_jobs_submit` | Count of job submissions |
| `forg3t.job.complete` | `meter_jobs_complete` | Count of job completions |
| `forg3t.webhooks.delivery_attempt` | `meter_webhooks_delivery_attempt` | Count of webhook delivery attempts |
| `forg3t.webhooks.delivery_success` | `meter_webhooks_delivery_success` | Count of successful webhook deliveries |
| `forg3t.webhooks.delivery_fail` | `meter_webhooks_delivery_fail` | Count of failed webhook deliveries |
| `forg3t.apikeys.create` | `meter_apikeys_create` | Count of API key creations |
| `forg3t.proofbundles.create` | `meter_proofbundles_create` | Count of proof bundle creations |
| `forg3t.http.requests` | `meter_http_requests` | Count of HTTP requests |
| `forg3t.unlearning.submit` | `meter_unlearning_submit` | Count of unlearning request submissions |
| `forg3t.unlearning.complete` | `meter_unlearning_complete` | Count of unlearning request completions |

This mapping ensures consistency between Forg3t's internal usage tracking and Stripe's metered billing system.

## Future Enhancements

### Planned Features

1. **Custom Event Types**: Allow customers to define their own usage events
2. **Real-time Quota Updates**: Provide live quota status updates
3. **Advanced Analytics**: Offer deeper insights into usage patterns
4. **Budget Management**: Enable customers to set spending limits
5. **Usage Forecasting**: Predict future usage based on historical trends

### Integration Roadmap

1. **Stripe Billing Integration**: Full automation of usage reporting to Stripe
2. **AWS Marketplace Integration**: Support for AWS billing integration
3. **Custom Billing Engine**: Allow customers to implement their own billing logic
4. **Multi-cloud Support**: Extend billing integrations to other cloud providers