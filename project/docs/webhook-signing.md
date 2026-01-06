# Webhook Signing and Verification

This document explains how webhook signatures work in the Forg3t Protocol and how to verify them.

## How Webhook Signatures Work

Webhook signatures provide cryptographic proof that a webhook delivery originated from the Forg3t system and hasn't been tampered with. When a webhook is delivered, the system includes signature information in the payload that can be verified using the corresponding public key.

### What Gets Signed

The following fields are included in the signed payload:

- `id`: The unique identifier of the webhook delivery
- `eventType`: The type of event that triggered the webhook
- `timestamp`: The ISO timestamp when the event occurred
- `data`: The actual event data
- `proofBundleId`: (Optional) The ID of the associated proof bundle
- `canonicalPayloadHash`: The SHA256 hash of the canonicalized payload
- `signature`: The Ed25519 signature of the canonical payload hash
- `signingKeyId`: The ID of the signing key used
- `signingKeyPublicKey`: The public key used for verification
- `algorithm`: The signing algorithm (currently Ed25519)
- `createdAt`: The ISO timestamp when the signature was created

### What Does NOT Get Signed

The following fields are NOT included in the signed payload:

- HTTP headers (except for the signature header itself)
- Metadata about the delivery attempt
- Internal system fields

## Verification in Different Languages

### Node.js

```javascript
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const crypto = require('crypto');

// Function to canonicalize an object (ensure consistent ordering)
function canonicalize(obj) {
  const sortedObj = sortObjectKeys(obj);
  return JSON.stringify(sortedObj);
}

// Recursively sort object keys
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sortObjectKeys(item));
  }

  const sortedObj = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = sortObjectKeys(obj[key]);
  });

  return sortedObj;
}

// Hash canonicalized data
function hashCanonicalData(canonicalData) {
  return crypto.createHash('sha256').update(canonicalData).digest('hex');
}

// Verify a signature with an Ed25519 public key
function verifyWithEd25519(data, signature, publicKey) {
  try {
    const publicKeyBytes = naclUtil.decodeBase64(publicKey);
    const signatureBytes = naclUtil.decodeBase64(signature);
    const dataBytes = Buffer.from(data, 'utf8');
    return nacl.sign.detached.verify(dataBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    return false;
  }
}

// Verify a webhook delivery
function verifyWebhookDelivery(payload, signature, publicKey) {
  // Create canonical payload for verification
  const canonicalPayload = canonicalize(payload);
  const canonicalPayloadHash = hashCanonicalData(canonicalPayload);
  
  // Verify the signature
  return verifyWithEd25519(canonicalPayloadHash, signature, publicKey);
}

// Example usage:
// const isValid = verifyWebhookDelivery(webhookPayload, signature, publicKey);
```

### Python

```python
import json
import hashlib
import base64
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

def canonicalize(obj):
    """Create a canonical JSON representation with sorted keys."""
    return json.dumps(obj, sort_keys=True, separators=(',', ':'))

def hash_canonical_data(canonical_data):
    """Hash canonicalized data with SHA256."""
    return hashlib.sha256(canonical_data.encode('utf-8')).hexdigest()

def verify_with_ed25519(data, signature, public_key):
    """Verify a signature with an Ed25519 public key."""
    try:
        verify_key = VerifyKey(base64.b64decode(public_key))
        verify_key.verify(data.encode('utf-8'), base64.b64decode(signature))
        return True
    except BadSignatureError:
        return False

def verify_webhook_delivery(payload, signature, public_key):
    """Verify a webhook delivery signature."""
    # Create canonical payload for verification
    canonical_payload = canonicalize(payload)
    canonical_payload_hash = hash_canonical_data(canonical_payload)
    
    # Verify the signature
    return verify_with_ed25519(canonical_payload_hash, signature, public_key)

# Example usage:
# is_valid = verify_webhook_delivery(webhook_payload, signature, public_key)
```

## Handling Replay, Idempotency, and Retries

### Replay Protection

Each webhook delivery includes a unique `id` field that can be used to detect replays. Store processed delivery IDs and reject duplicates:

```javascript
const processedDeliveries = new Set();

function handleWebhook(req, res) {
  const deliveryId = req.body.id;
  
  // Check if already processed
  if (processedDeliveries.has(deliveryId)) {
    return res.status(409).json({ error: 'Delivery already processed' });
  }
  
  // Verify signature
  const isValid = verifyWebhookDelivery(
    req.body,
    req.headers['x-forg3t-signature'],
    req.body.signingKeyPublicKey
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process the webhook
  processWebhook(req.body);
  
  // Mark as processed
  processedDeliveries.add(deliveryId);
  
  res.status(200).json({ message: 'OK' });
}
```

### Idempotency

Use the `idempotencyKey` field when available to ensure operations are idempotent:

```javascript
const processedOperations = new Map();

function processOperation(operationId, idempotencyKey, data) {
  if (idempotencyKey && processedOperations.has(idempotencyKey)) {
    // Return cached result
    return processedOperations.get(idempotencyKey);
  }
  
  // Perform operation
  const result = performOperation(data);
  
  // Cache result if idempotency key is provided
  if (idempotencyKey) {
    processedOperations.set(idempotencyKey, result);
  }
  
  return result;
}
```

### Retry Logic

Implement exponential backoff for retries:

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Troubleshooting: "Signature Invalid" Cases

### Common Causes

1. **Incorrect Public Key**: Ensure you're using the correct public key that corresponds to the signing key.

2. **Payload Modification**: Any modification to the payload after signing will cause verification to fail.

3. **Timestamp Skew**: While not currently enforced, future versions may reject signatures with significant timestamp differences.

4. **Encoding Issues**: Ensure proper base64 encoding/decoding of signatures and public keys.

### Debugging Steps

1. **Check the Public Key**:
   ```bash
   # Get the correct public key for your project
   forg3t signing-keys list --project YOUR_PROJECT_ID
   ```

2. **Verify Payload Integrity**:
   ```bash
   # Get the delivery details
   forg3t deliveries get --project YOUR_PROJECT_ID --delivery DELIVERY_ID
   
   # Get payload for offline verification
   forg3t deliveries get --project YOUR_PROJECT_ID --delivery DELIVERY_ID > payload.json
   ```

3. **Test Offline Verification**:
   ```bash
   # Verify the signature offline
   forg3t deliveries verify-offline --payload payload.json --signature SIGNATURE --public-key PUBLIC_KEY --alg ed25519
   ```

4. **Compare Hashes**:
   ```javascript
   // Calculate the canonical payload hash manually
   const canonicalPayload = canonicalize(webhookPayload);
   const calculatedHash = hashCanonicalData(canonicalPayload);
   
   // Compare with the provided hash
   console.log('Calculated hash:', calculatedHash);
   console.log('Provided hash:', webhookPayload.canonicalPayloadHash);
   ```

### Example Debug Script

```javascript
// debug-webhook.js
const fs = require('fs');
const { canonicalize, hashCanonicalData } = require('./your-verification-utils');

// Load the payload
const payload = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Canonicalize and hash
const canonicalPayload = canonicalize(payload);
const canonicalPayloadHash = hashCanonicalData(canonicalPayload);

console.log('Canonical payload:');
console.log(canonicalPayload);
console.log('\nCanonical payload hash:');
console.log(canonicalPayloadHash);
console.log('\nProvided hash:');
console.log(payload.canonicalPayloadHash);
console.log('\nHashes match:', canonicalPayloadHash === payload.canonicalPayloadHash);
```

Run with:
```bash
node debug-webhook.js payload.json
```

## Security Best Practices

1. **Always Verify Signatures**: Never trust webhook data without verifying the signature.

2. **Store Public Keys Securely**: Retrieve public keys from trusted sources, not from the webhook payload itself.

3. **Implement Replay Protection**: Use delivery IDs to prevent replay attacks.

4. **Log Verification Failures**: Monitor failed verification attempts for potential security issues.

5. **Use HTTPS**: Always receive webhooks over HTTPS to prevent man-in-the-middle attacks.

6. **Validate Event Types**: Only process event types you expect and understand.