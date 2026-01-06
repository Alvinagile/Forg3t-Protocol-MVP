# Forg3t Protocol TypeScript SDK

Official TypeScript client SDK for the Forg3t Protocol control-plane.

## Quick Start

### Installation

```bash
npm install @forg3t/client-sdk
```

### Basic Usage

```typescript
import { Forg3tClient } from '@forg3t/client-sdk';

// Initialize the client
const client = new Forg3tClient({
  apiUrl: 'http://localhost:3000', // Optional, defaults to FORG3T_API_URL env var
  apiKey: 'your-api-key'           // Optional, defaults to FORG3T_API_KEY env var
});

// Get project overview
const overview = await client.getProjectOverview('project-id');
console.log(overview.data);
```

### Environment Variables

The SDK can read configuration from environment variables:

```bash
FORG3T_API_URL=http://localhost:3000
FORG3T_API_KEY=your-api-key
```

## SDK Features

### Request ID Propagation

Every API call includes a request ID for tracing:

```typescript
// Automatically generated UUID
const result = await client.getProjectOverview('project-id');

// Or provide your own
const result = await client.getProjectOverview('project-id', 'custom-request-id');
```

### Retry Logic

The SDK automatically retries on transient errors (429, 502, 503) with exponential backoff:

```typescript
// Will retry on transient errors
const result = await client.listApiKeys('project-id');

// Non-idempotent calls are not retried by default
const result = await client.createApiKey('project-id', { name: 'My Key' });
```

## API Reference

### Projects

#### Get Project Overview

```typescript
const overview = await client.getProjectOverview(projectId, requestId?);
```

Equivalent curl command:
```bash
curl -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/projects/$PROJECT_ID/overview
```

#### List Audit Events

```typescript
const events = await client.listAuditEvents(projectId, {
  action?: string,
  resourceType?: string,
  resourceId?: string,
  from?: string,
  to?: string,
  limit?: number,
  cursor?: string
}, requestId?);
```

Equivalent curl command:
```bash
curl -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     "http://localhost:3000/v1/projects/$PROJECT_ID/audit?limit=50"
```

### API Keys

#### List API Keys

```typescript
const keys = await client.listApiKeys(projectId, requestId?);
```

Equivalent curl command:
```bash
curl -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/projects/$PROJECT_ID/api-keys
```

#### Create API Key

```typescript
const key = await client.createApiKey(projectId, {
  name: 'My Key',
  expiresAt?: '2023-12-31T23:59:59Z'
}, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     -d '{"name":"My Key","expiresAt":"2023-12-31T23:59:59Z"}' \
     http://localhost:3000/v1/projects/$PROJECT_ID/api-keys
```

#### Rotate API Key

```typescript
const key = await client.rotateApiKey(keyId, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/api-keys/$KEY_ID/rotate
```

#### Revoke API Key

```typescript
const key = await client.revokeApiKey(keyId, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/api-keys/$KEY_ID/revoke
```

### Jobs

#### Submit Job

```typescript
const job = await client.submitJob(projectId, {
  type: 'unlearning-job',
  payload: { /* job data */ },
  idempotencyKey?: 'unique-key'
}, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     -d '{"type":"unlearning-job","payload":{},"idempotencyKey":"unique-key"}' \
     http://localhost:3000/v1/projects/$PROJECT_ID/jobs
```

#### Claim Jobs

```typescript
const jobs = await client.claimJobs(projectId, {
  limit?: 10
}, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     -d '{"limit":10}' \
     http://localhost:3000/v1/projects/$PROJECT_ID/jobs/claim
```

#### Heartbeat Job

```typescript
const job = await client.heartbeatJob(projectId, jobId, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/projects/$PROJECT_ID/jobs/$JOB_ID/heartbeat
```

#### Complete Job

```typescript
const job = await client.completeJob(projectId, jobId, {
  result: { /* job result */ }
}, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     -d '{"result":{}}' \
     http://localhost:3000/v1/projects/$PROJECT_ID/jobs/$JOB_ID/complete
```

#### Fail Job

```typescript
const job = await client.failJob(projectId, jobId, {
  error: { /* error details */ }
}, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     -d '{"error":{}}' \
     http://localhost:3000/v1/projects/$PROJECT_ID/jobs/$JOB_ID/fail
```

#### List Dead Jobs

```typescript
const jobs = await client.listDeadJobs(projectId, requestId?);
```

Equivalent curl command:
```bash
curl -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/projects/$PROJECT_ID/jobs/dead
```

#### Replay Job

```typescript
const job = await client.replayJob(projectId, jobId, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/projects/$PROJECT_ID/jobs/$JOB_ID/replay
```

### Webhooks

#### List Webhooks

```typescript
const webhooks = await client.listWebhooks(projectId, requestId?);
```

Equivalent curl command:
```bash
curl -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/projects/$PROJECT_ID/webhooks
```

#### Create Webhook

```typescript
const webhook = await client.createWebhook(projectId, {
  url: 'https://example.com/webhook',
  description: 'My webhook'
}, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     -d '{"url":"https://example.com/webhook","description":"My webhook"}' \
     http://localhost:3000/v1/projects/$PROJECT_ID/webhooks
```

#### Update Webhook

```typescript
const webhook = await client.updateWebhook(webhookId, {
  url: 'https://example.com/new-webhook',
  description: 'Updated webhook',
  enabled: true
}, requestId?);
```

Equivalent curl command:
```bash
curl -X PATCH \
     -H "Content-Type: application/json" \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     -d '{"url":"https://example.com/new-webhook","description":"Updated webhook","enabled":true}' \
     http://localhost:3000/v1/webhooks/$WEBHOOK_ID
```

#### Delete Webhook

```typescript
const result = await client.deleteWebhook(webhookId, requestId?);
```

Equivalent curl command:
```bash
curl -X DELETE \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/webhooks/$WEBHOOK_ID
```

#### Rotate Webhook Secret

```typescript
const webhook = await client.rotateWebhookSecret(webhookId, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/webhooks/$WEBHOOK_ID/rotate-secret
```

#### Enable Webhook

```typescript
const webhook = await client.enableWebhook(webhookId, requestId?);
```

#### Disable Webhook

```typescript
const webhook = await client.disableWebhook(webhookId, requestId?);
```

### Webhook Deliveries

#### List Webhook Deliveries

```typescript
const deliveries = await client.listWebhookDeliveries(webhookId, {
  status?: 'success' | 'failed' | 'pending' | 'dead',
  eventType?: string,
  limit?: number,
  offset?: number
}, requestId?);
```

Equivalent curl command:
```bash
curl -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     "http://localhost:3000/v1/webhooks/$WEBHOOK_ID/deliveries?status=failed&limit=50"
```

#### Replay Webhook Delivery

```typescript
const delivery = await client.replayWebhookDelivery(deliveryId, requestId?);
```

Equivalent curl command:
```bash
curl -X POST \
     -H "X-API-Key: $FORG3T_API_KEY" \
     -H "X-Request-ID: $REQUEST_ID" \
     http://localhost:3000/v1/webhook-deliveries/$DELIVERY_ID/replay
```

## CLI Usage

The Forg3t CLI provides command-line access to the SDK functionality:

```bash
# Get project overview
forg3t overview --project project-id

# List API keys
forg3t apikeys list --project project-id

# Submit a job
forg3t jobs submit --project project-id --type noop --payload '{}'

# List dead jobs
forg3t jobs dead --project project-id

# Replay a dead job
forg3t jobs replay --project project-id --job job-id

# List webhooks
forg3t webhooks list --project project-id

# Create a webhook
forg3t webhooks create --project project-id --url https://example.com/webhook --description "My webhook"

# Rotate a webhook secret
forg3t webhooks rotate-secret --project project-id --webhook webhook-id

# List deliveries
forg3t deliveries list --project project-id --status dead

# Replay a delivery
forg3t deliveries replay --project project-id --delivery delivery-id
```

### CLI Environment Variables

```bash
FORG3T_API_URL=http://localhost:3000
FORG3T_API_KEY=your-api-key
```