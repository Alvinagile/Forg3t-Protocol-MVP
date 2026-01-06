# Webhooks

Webhooks allow you to receive real-time notifications about events happening in your Forg3t project. When an event occurs, Forg3t will send an HTTP POST request to your webhook URL with details about the event.

## Webhook Signing Verification

To verify that a webhook request came from Forg3t and wasn't tampered with, we sign each request with a secret key. The signature is included in the `X-Forg3t-Signature` header.

### Signature Verification Process

1. Extract the signature from the `X-Forg3t-Signature` header
2. Create a hash of the request body using HMAC-SHA256 and your webhook secret
3. Compare the computed hash with the signature from the header

### Example Verification Code (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Usage in Express.js
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-forg3t-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook event
  console.log('Received event:', req.body);
  res.status(200).send('OK');
});
```

### Example Verification Code (Python)

```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

# Usage in Flask
@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Forg3t-Signature')
    payload = request.get_data()
    
    if not verify_webhook_signature(payload.decode('utf-8'), signature, WEBHOOK_SECRET):
        return 'Invalid signature', 401
    
    # Process the webhook event
    print('Received event:', request.json)
    return 'OK', 200
```

## Retry Behavior

Forg3t implements an exponential backoff retry strategy for webhook deliveries:

1. **Initial Attempt**: Immediate delivery upon event occurrence
2. **First Retry**: 1 minute after failure
3. **Second Retry**: 5 minutes after failure
4. **Third Retry**: 30 minutes after failure
5. **Fourth Retry**: 2 hours after failure
6. **Final Retry**: 24 hours after failure

If all retry attempts fail, the delivery is marked as "dead" and will not be retried automatically.

### Retry Logic Details

- **Retry Conditions**: HTTP status codes 429 (rate limited), 5xx (server errors)
- **No Retry**: HTTP status codes 2xx, 3xx, 4xx (client errors except 429)
- **Maximum Attempts**: 6 (1 initial + 5 retries)
- **Maximum Duration**: ~24 hours

## Common Debugging Steps

### 1. Check Webhook Status

Verify that your webhook is enabled:

```bash
# Using the CLI
forg3t webhooks list --project your-project-id

# Using the SDK
const webhooks = await client.listWebhooks('your-project-id');
console.log(webhooks.data);
```

### 2. Inspect Delivery History

Check recent deliveries to identify issues:

```bash
# Using the CLI
forg3t deliveries list --project your-project-id --status failed

# Using the SDK
const deliveries = await client.listWebhookDeliveries('your-webhook-id', {
  status: 'failed'
});
console.log(deliveries.data);
```

### 3. Test Your Endpoint

Use curl to test your webhook endpoint:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Forg3t-Signature: test-signature" \
  -d '{"eventType":"test.event","timestamp":"2023-01-01T00:00:00Z"}' \
  https://your-domain.com/webhook
```

### 4. Check Firewall and Network

Ensure your endpoint is accessible from the public internet and not blocked by firewalls.

### 5. Verify SSL/TLS Configuration

If using HTTPS, ensure your SSL certificate is valid and properly configured.

### 6. Review Logs

Check your application logs for errors during webhook processing.

### 7. Replay Failed Deliveries

Manually retry failed deliveries:

```bash
# Using the CLI
forg3t deliveries replay --project your-project-id --delivery delivery-id

# Using the SDK
const result = await client.replayWebhookDelivery('delivery-id');
console.log(result.data);
```

## Webhook Event Types

### Job Events

- `job.created`: A new job has been created
- `job.started`: A job has been claimed by a worker
- `job.completed`: A job has been successfully completed
- `job.failed`: A job has failed
- `job.dead`: A job has been marked as dead after all retries

### Proof Events

- `proof.generated`: A proof has been successfully generated
- `proof.failed`: Proof generation has failed

### Audit Events

- `audit.event`: An audit event has occurred

## Webhook Payload Structure

```json
{
  "id": "delivery-id",
  "eventType": "job.completed",
  "timestamp": "2023-01-01T00:00:00Z",
  "data": {
    "jobId": "job-id",
    "projectId": "project-id",
    "result": {
      // Job-specific result data
    }
  }
}
```

## Best Practices

1. **Always verify signatures** to ensure authenticity
2. **Respond quickly** (within 30 seconds) to webhook requests
3. **Handle retries gracefully** by making your webhook handlers idempotent
4. **Log failures** for debugging purposes
5. **Monitor delivery metrics** to ensure reliability
6. **Use HTTPS** for secure communication
7. **Implement proper error handling** to distinguish between retryable and non-retryable errors