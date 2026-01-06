# Forg3t CLI Guide

The Forg3t CLI provides a command-line interface for interacting with the Forg3t Protocol control plane.

## Installation

```bash
npm install -g @forg3t/cli
```

## Global Options

The CLI supports several global options that can be used with any command:

| Option | Description | Default |
|--------|-------------|---------|
| `--request-id <id>` | Specify a request ID for correlation | Auto-generated UUID |
| `--json` | Output results in JSON format | Text format |
| `--pretty` | Pretty-print JSON output (requires `--json`) | Minified JSON |

## Exit Codes

The CLI uses standardized exit codes to indicate the result of operations:

| Exit Code | Meaning | Description |
|-----------|---------|-------------|
| 0 | Success | Command executed successfully |
| 1 | Validation Error | Invalid input or missing required parameters |
| 2 | Quota Exceeded | Operation blocked due to quota limits |
| 3 | Authentication Error | Invalid or missing API key |
| 4 | Not Found | Requested resource not found |
| 5 | Internal Error | Unexpected error occurred |

## Commands

### Overview

Get project overview information:

```bash
forg3t overview --project <project-id>
```

### Usage

#### Usage Summary

Get a summary of usage events for a project:

```bash
forg3t usage summary --project <project-id> [--from <date>] [--to <date>]
```

#### Billing Preview

Get a preview of usage data for billing purposes:

```bash
forg3t usage billing-preview --project <project-id> --from <YYYY-MM-DD> --to <YYYY-MM-DD>
```

#### Export Usage

Export usage data in CSV or JSONL format:

```bash
forg3t usage export --project <project-id> [--from <date>] [--to <date>] [--format csv|jsonl]
```

### Quotas

#### Get Quotas

Get quota information for a project:

```bash
forg3t quotas get --project <project-id>
```

#### Set Quota (Staging Only)

Set a quota for a project (only available in staging environments):

```bash
forg3t quotas set --project <project-id> --event <event-type> --period <daily|weekly|monthly> --limit <number> [--hard true|false]
```

### Entitlements

Get entitlements information for a project:

```bash
forg3t entitlements get --project <project-id>
```

### Support Bundle

Export a support bundle for a project:

```bash
forg3t support-bundle export --project <project-id>
```

### Billing Profile

Get billing profile information for a project:

```bash
forg3t billing-profile get --project <project-id>
```

### Doctor

Check environment readiness:

```bash
forg3t doctor
```

This command verifies:
- API URL is configured
- API key is present and valid
- Request ID correlation is working

## Output Formats

### Text Format (Default)

Commands output human-readable text by default:

```bash
$ forg3t usage summary --project my-project
Request ID: 123e4567-e89b-12d3-a456-426614174000

Usage Summary:
Event Type           Count  First Event          Last Event
───────────────────  ─────  ───────────────────  ───────────────────
job_submit           42     2023-01-01 10:30:00  2023-01-01 15:45:00
```

### JSON Format

Use the `--json` flag to output structured JSON:

```bash
$ forg3t usage summary --project my-project --json
{
  "success": true,
  "data": [
    {
      "projectId": "my-project",
      "eventType": "job_submit",
      "count": 42,
      "firstEventAt": "2023-01-01T10:30:00Z",
      "lastEventAt": "2023-01-01T15:45:00Z"
    }
  ],
  "requestId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Pretty JSON Format

Combine `--json` and `--pretty` for formatted JSON output:

```bash
$ forg3t usage summary --project my-project --json --pretty
{
  "success": true,
  "data": [
    {
      "projectId": "my-project",
      "eventType": "job_submit",
      "count": 42,
      "firstEventAt": "2023-01-01T10:30:00Z",
      "lastEventAt": "2023-01-01T15:45:00Z"
    }
  ],
  "requestId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Environment Variables

The CLI uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `FORG3T_API_URL` | API endpoint URL | http://localhost:3000 |
| `FORG3T_API_KEY` | API key for authentication | None (required) |

## Examples

### Get usage summary with custom date range

```bash
forg3t usage summary --project my-project --from 2023-01-01 --to 2023-01-31
```

### Export usage data in JSONL format

```bash
forg3t usage export --project my-project --format jsonl > usage-export.jsonl
```

### Check environment with JSON output

```bash
forg3t doctor --json --pretty
```

### Use custom request ID for correlation

```bash
forg3t usage summary --project my-project --request-id custom-request-123
```