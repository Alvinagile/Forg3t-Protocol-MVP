# Proof Bundle Signatures

This document explains how proof bundle signatures work in the Forg3t Protocol, including what is signed, canonicalization rules, and how to verify signatures both server-side and client-side.

## What is Signed and What is Not

### Signed Components

Every proof bundle includes cryptographic signatures to ensure authenticity and integrity. The following components are included in the signature:

- **Bundle ID**: Unique identifier of the proof bundle
- **Tenant ID**: Identifier of the tenant that owns the proof bundle
- **Project ID**: Identifier of the project the proof bundle belongs to
- **Job ID**: Identifier of the job that generated the proof bundle
- **Type**: Type of the proof bundle
- **Input Hash**: SHA256 hash of the input data
- **Output Hash**: SHA256 hash of the output data
- **Created At**: Timestamp when the proof bundle was created

### Unsigned Components

The following components are not included in the signature:

- **Evidence JSON**: The actual evidence data (can be large)
- **Metadata**: Additional metadata that may be added later

## Canonicalization Rules

To ensure deterministic signatures regardless of JSON serialization order, proof bundles use a canonicalization process:

1. **Key Sorting**: All object keys are sorted alphabetically
2. **Recursive Application**: Canonicalization is applied recursively to nested objects
3. **Array Preservation**: Array order is preserved as it's significant
4. **Type Preservation**: All data types are preserved during canonicalization

Example canonicalization:

```javascript
// Original object
{
  "b": 2,
  "a": 1,
  "nested": {
    "z": 26,
    "y": 25
  }
}

// Canonicalized (sorted keys)
{
  "a": 1,
  "b": 2,
  "nested": {
    "y": 25,
    "z": 26
  }
}
```

## Server-Side Verification Example

Server-side verification uses the control plane API to verify signatures:

```bash
# Using the CLI
forg3t proof-bundles verify --project <project-id> --bundle <bundle-id>

# Using cURL
curl -X POST \
  -H "X-API-Key: <your-api-key>" \
  http://localhost:3000/v1/projects/<project-id>/proof-bundles/<bundle-id>/verify
```

Example response:
```json
{
  "valid": true,
  "signingKeyId": "550e8400-e29b-41d4-a716-446655440000",
  "algorithm": "ed25519",
  "canonicalPayloadHash": "a1b2c3d4e5f6...",
  "requestId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Client-Side Verification Example

Client-side verification can be performed without contacting the server:

```bash
# Using the CLI for offline verification
forg3t proof-bundles verify-offline \
  --public-key <public-key> \
  --payload <proof-bundle.json> \
  --signature <signature>

# Using the SDK
import { ProofBundleVerifier } from '@forg3t/client-sdk';

const isValid = ProofBundleVerifier.verifyProofBundle(
  proofBundle, 
  publicKey
);
```

JavaScript example:
```javascript
import { ProofBundleVerifier } from '@forg3t/client-sdk';

// Load proof bundle and public key
const proofBundle = {
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "tenant-123",
  "projectId": "project-456",
  "jobId": "job-789",
  "type": "unlearning-proof",
  "inputHash": "a1b2c3d4e5f6...",
  "outputHash": "f6e5d4c3b2a1...",
  "signature": "signature-data-here",
  "canonicalPayloadHash": "hash-of-canonical-payload",
  "createdAt": "2023-01-01T00:00:00.000Z"
};

const publicKey = "public-key-here";

// Verify the signature
const isValid = ProofBundleVerifier.verifyProofBundle(proofBundle, publicKey);
console.log(`Signature is ${isValid ? 'valid' : 'invalid'}`);
```

## Security Considerations

1. **Private Key Protection**: Private keys are never exposed to clients and are securely stored encrypted at rest
2. **Algorithm Support**: Currently only Ed25519 signatures are supported
3. **Key Rotation**: Signing keys can be rotated to enhance security
4. **Tenant Isolation**: Each tenant and project has isolated signing keys

## CLI Commands

The Forg3t CLI provides convenient commands for working with signatures:

```bash
# List signing keys for a project
forg3t signing-keys list --project <project-id>

# Rotate signing key for a project
forg3t signing-keys rotate --project <project-id>

# Verify a proof bundle signature (server-side)
forg3t proof-bundles verify --project <project-id> --bundle <bundle-id>

# Verify a proof bundle signature offline (client-side)
forg3t proof-bundles verify-offline \
  --public-key <public-key> \
  --payload <proof-bundle.json> \
  --signature <signature>
```