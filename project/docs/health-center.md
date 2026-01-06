# Health Center

The Health Center provides operators and users with a centralized view of their project's operational status, helping them understand why they might be blocked and what actions to take next.

## Overview

The Health Center aggregates data from multiple subsystems to provide a unified view of project health, including:

- Billing state and upcoming changes
- Current plan and scheduled plan changes
- Write access status and reasons for blocks
- Quota utilization across all meter keys
- Recent quota blocks with detailed information
- Detected anomalies with severity levels and suggested actions
- Webhook reliability metrics (when enabled)

## SDK Usage

The client SDK provides methods to programmatically access health information:

### getProjectHealth(projectId)

Retrieves a snapshot of the current project health status.

```typescript
import Forg3tClient from '@forg3t/client-sdk';

const client = new Forg3tClient({ apiUrl, apiKey });
const healthSnapshot = await client.getProjectHealth('project-id');
```

### getProjectHealthTimeline(projectId, fromDayUtc, toDayUtc)

Retrieves a timeline of project health status over a specified date range.

```typescript
import Forg3tClient from '@forg3t/client-sdk';

const client = new Forg3tClient({ apiUrl, apiKey });
const healthTimeline = await client.getProjectHealthTimeline(
  'project-id', 
  '2023-11-01', 
  '2023-11-30'
);
```

### getSupportBundle(projectId, version='2')

Retrieves a comprehensive support bundle containing all health data.

```typescript
import Forg3tClient from '@forg3t/client-sdk';

const client = new Forg3tClient({ apiUrl, apiKey });
const supportBundle = await client.getSupportBundle('project-id', '2');
```

## CLI Usage

The CLI provides command-line access to health information:

### forg3t health show

Display the current project health snapshot.

```bash
# Basic usage
forg3t health show --project project-id

# JSON output
forg3t health show --project project-id --json

# Pretty-printed JSON output
forg3t health show --project project-id --json --pretty

# With custom request ID
forg3t health show --project project-id --request-id custom-request-id
```

### forg3t health timeline

Display the project health timeline over a specified date range.

```bash
# Basic usage
forg3t health timeline --project project-id --from 2023-11-01 --to 2023-11-30

# JSON output
forg3t health timeline --project project-id --from 2023-11-01 --to 2023-11-30 --format json

# JSONL output for streaming
forg3t health timeline --project project-id --from 2023-11-01 --to 2023-11-30 --format jsonl

# CSV output for spreadsheet analysis
forg3t health timeline --project project-id --from 2023-11-01 --to 2023-11-30 --format csv
```

### forg3t support-bundle export

Export a comprehensive support bundle.

```bash
# Export support bundle v2
forg3t support-bundle export --project project-id --version 2

# Export to file
forg3t support-bundle export --project project-id --version 2 --out bundle.json

# With custom request ID
forg3t support-bundle export --project project-id --version 2 --request-id custom-request-id
```

## Health Snapshot Semantics

The health snapshot represents a point-in-time view of project health, composed of data from multiple subsystems at a consistent moment:

- **Billing State**: Current billing status and upcoming scheduled changes
- **Plan Schedule**: Active plan and future plan changes
- **Entitlements**: Current capabilities, quota limits, and write access status
- **Usage and Quotas**: Real-time quota consumption data
- **Quota Blocks**: Recent quota enforcement events
- **Anomalies**: Detected irregularities with severity assessments
- **Webhook Reliability**: Webhook delivery performance metrics (when applicable)

## Timeline UTC Boundaries

The health timeline uses UTC day strings (YYYY-MM-DD) as boundaries to ensure consistent timezone handling:

- **From Boundary**: Inclusive start date
- **To Boundary**: Inclusive end date
- **Timezone**: All dates are interpreted as UTC midnight boundaries

Example: `--from 2023-11-01 --to 2023-11-30` includes the full months of November 2023.

## Common Scenarios

### Writes Blocked Due to Suspended

When a project is suspended due to billing issues:
- Billing state shows `suspended`
- Write access is denied with reason code
- Unblock hint suggests resolving payment method

### Writes Allowed with Warnings in Past_Due or Grace

When a project is in a grace period:
- Billing state shows `past_due` or `grace`
- Write access is still allowed but with warnings
- Users are notified to update payment information

### Quota Blocks and How to Upgrade Plan

When quota limits are exceeded:
- Specific meter keys show as exceeded
- Recent blocks are listed with timestamps
- Unblock hint suggests upgrading to a higher plan tier

### Anomalies and Recommended Mitigation

Detected anomalies with severity levels:
- **Critical**: Immediate action required
- **Warning**: Attention recommended soon
- **Info**: Informational observations

Each anomaly includes a recommended mitigation strategy.

## API Integration

The Health Center communicates with the control plane backend through the following API endpoints:

### Health Snapshot
```
GET /api/v1/projects/:projectId/health
```

### Health Timeline
```
GET /api/v1/projects/:projectId/health/timeline?fromDayUtc=YYYY-MM-DD&toDayUtc=YYYY-MM-DD
```

### Support Bundle v2
```
GET /api/v1/projects/:projectId/support-bundle?version=2
```

## Security

The Health Center follows strict security practices:
- Never displays secrets or raw API keys
- Respects tenant isolation and project scoping
- Preserves request ID propagation for traceability
- Uses input validation with Zod for all API calls

## Loading and Error States

The Health Center provides clear visual feedback for:
- Loading states with spinners
- Error states with descriptive messages
- Empty states when no data is available

## Navigation

The Health Center is accessible through the main dashboard navigation menu under "Health Center". Users can navigate between the overview and timeline views seamlessly.