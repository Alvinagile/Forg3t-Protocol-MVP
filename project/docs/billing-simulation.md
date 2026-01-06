# How to Simulate Billing Lifecycle in Staging

This guide explains how to simulate billing state transitions in the staging environment for testing purposes.

## Overview

The billing lifecycle simulation tools allow operators to test different billing scenarios without affecting production systems. These tools are only available in staging environments (development, test, and staging) and are completely disabled in production.

## Available Tools

### 1. Admin API Endpoint

**POST /v1/projects/:projectId/billing-state/events**

Applies a billing event to transition the state.

**Request Body:**
```json
{
  "event": "payment_failed", // Required
  "actorId": "user-123",     // Optional
  "graceWindowDays": 7       // Optional
}
```

**Valid Event Types:**
- `payment_failed`
- `payment_restored`
- `trial_started`
- `trial_ended`
- `manual_suspend`
- `manual_unsuspend`
- `cancel`

### 2. CLI Commands

#### Get Current Billing State
```bash
forg3t billing state --project <project-id>
```

#### Apply Billing Event
```bash
forg3t billing event --project <project-id> --type payment_failed
```

Optional parameters:
- `--actor <actor-id>`: Specify the actor ID
- `--grace-days <days>`: Specify grace window days (1-30)

### 3. Dashboard Interface

In the Billing Profile page, staging environments show a "Simulate Event" dropdown that allows selecting and applying billing events through the UI.

## Billing State Transitions

### State Diagram
```
trialing → active (automatically after trial period)
active → past_due (on payment failure)
past_due → grace (after grace window)
grace → suspended (after grace period)
suspended → active (on payment restoration)
manual_suspend/manual_unsuspend (operator controlled)
cancel (permanent)
```

### Transition Rules

1. **payment_failed**: Only affects `active` state → `past_due`
2. **payment_restored**: Affects `past_due`, `grace`, `suspended` → `active`
3. **trial_started**: Only affects non-trialing states → `trialing`
4. **trial_ended**: Only affects `trialing` state → `active`
5. **manual_suspend**: Affects any state except `canceled` → `suspended`
6. **manual_unsuspend**: Only affects `suspended` state → `active`
7. **cancel**: Affects any state → `canceled` (irreversible)

## Testing Scenarios

### Scenario 1: Normal Payment Flow
1. Start with `trialing` state
2. Apply `trial_ended` → transitions to `active`
3. Apply `payment_failed` → transitions to `past_due`
4. Wait for grace period or apply `payment_restored` → transitions to `active`

### Scenario 2: Suspension and Restoration
1. Start with `active` state
2. Apply `manual_suspend` → transitions to `suspended`
3. Apply `manual_unsuspend` → transitions to `active`

### Scenario 3: Cancellation
1. Start with any state
2. Apply `cancel` → transitions to `canceled` (permanent)

## Audit Logging

All billing events and state transitions are logged in the audit system with the following event types:
- `billing_state_transition`: When a state change occurs
- `billing_event_applied`: When an event is applied (even if no state change occurs)

## Security

- All simulation tools are gated to staging environments only
- Production environments completely disable these endpoints
- All actions are logged with actor information
- Access controls apply (users can only simulate events for their own projects)