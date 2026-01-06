# Resend Email Integration Setup

This document provides instructions for setting up Resend for transactional emails in the Forg3t Protocol system.

## Environment Variables

The following environment variables need to be configured:

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Your Resend API key for sending emails | Yes |
| `DASHBOARD_URL` | The dashboard URL for invitation links (defaults to https://dashboard.forg3t.io) | No |

These variables should be added to your `.env` file in the dashboard-backend service.

Example:
```bash
RESEND_API_KEY=your_resend_api_key_here
DASHBOARD_URL=https://dashboard.yourdomain.com
```

## DNS Records Checklist

To ensure proper email deliverability, configure the following DNS records with your domain registrar:

### SPF Record
Add a TXT record to authorize Resend to send emails on your behalf:
```
Type: TXT
Name: @ (or your subdomain)
Value: v=spf1 include:amazonses.com ~all
```

### DKIM Record
Resend will provide you with unique DKIM records after you verify your domain in the Resend dashboard. They typically look like:
```
Type: CNAME
Name: selector._domainkey
Value: selector.dkim.amazonses.com
```

You'll need to add multiple CNAME records as provided by Resend.

### DMARC Record (Optional but Recommended)
Add a TXT record to specify how receivers should handle emails that fail SPF/DKIM:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

## Domain Verification Steps

1. Sign up for a Resend account at [resend.com](https://resend.com)
2. Add your domain (e.g., forg3t.io) in the Resend dashboard
3. Resend will provide you with DNS records to add to your domain registrar
4. Add the provided SPF, DKIM, and verification records to your DNS
5. Wait for DNS propagation (usually 1-5 minutes)
6. Click "Verify" in the Resend dashboard to confirm your domain

## Email Templates

The system uses the following built-in email templates:

1. **Demo Request Confirmation** - Sent to users who submit a demo request
2. **Admin Notification** - Sent to administrators when a new demo request is submitted
3. **Invitation Email** - Sent to users when their demo request is approved
4. **Rejection Email** - Sent to users when their demo request is rejected (optional)

All templates are implemented as HTML emails with responsive design.

## Rate Limiting

Public endpoints (demo request, contact) have built-in rate limiting:
- Maximum 5 requests per minute per IP/user

In production, this should be backed by Redis for distributed rate limiting.

## Idempotency

The email system ensures idempotency to prevent duplicate emails:
- Admin notifications are deduplicated using the demo request ID
- Invitation emails are deduplicated using the invitation token

This prevents duplicate emails even if the same operation is triggered multiple times.

## Data Storage

Email logs are stored in the `email_log` table with the following information:
- Idempotency key (for duplicate prevention)
- Recipient email address
- Template used
- Timestamp of sending
- Message ID from Resend

Raw email content or large text blobs are never stored.

## Testing

Run the email sender unit tests with:
```bash
npm test -- emailSender.test.ts
```

Integration tests are part of the overall test suite:
```bash
npm test
```

## Audit Logging

All email operations are logged with structured logging for audit purposes:
- Demo request submissions
- Admin approvals
- Invitation sends
- Rejection sends

Logs include relevant identifiers without storing sensitive data.