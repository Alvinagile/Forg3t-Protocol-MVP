# Stellar and Soroban Setup Guide

This guide explains how to configure, build, deploy, and interact with the Forg3t Protocol's Soroban smart contract.

## Prerequisites

1. **Stellar SDK**: `@stellar/stellar-sdk` (already included in the project)
2. **Soroban CLI**: Install the Soroban CLI tools
3. **Stellar Account**: Testnet account with funded XLM
4. **Environment Variables**: Configure the following in your `.env` file:
   ```
   STELLAR_NETWORK=testnet
   SOROBAN_RPC_URL=https://soroban-testnet.stellar.org:443
   FORG3T_CONTRACT_ID=CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM
   ```

## Setting Up Stellar Testnet

1. **Create a Testnet Account**:
   - Visit the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
   - Create a new account and fund it with test XLM using the friendbot

2. **Configure Environment Variables**:
   ```env
   STELLAR_NETWORK=testnet
   SOROBAN_RPC_URL=https://soroban-testnet.stellar.org:443
   STELLAR_ACCOUNT_SECRET=SBCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

## Building the Soroban Contract

The Forg3t Protocol uses a Soroban smart contract for on-chain proof verification. The contract is written in Rust.

1. **Install Rust Toolchain**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

2. **Install Soroban CLI**:
   ```bash
   cargo install --locked soroban-cli
   ```

3. **Build the Contract**:
   ```bash
   cd contracts/forg3t_verifier
   soroban contract build
   ```

## Deploying to Testnet

1. **Deploy the Contract**:
   ```bash
   npm run deploy-contract
   ```
   
   Or manually using Soroban CLI:
   ```bash
   soroban contract deploy \
     --wasm target/wasm32-unknown-unknown/release/forg3t_verifier.wasm \
     --source ACCOUNT_SECRET_KEY \
     --rpc-url https://soroban-testnet.stellar.org:443 \
     --network-passphrase "Test SDF Network ; September 2015"
   ```

2. **Update Environment Variables**:
   After deployment, update your `.env` file with the new contract ID:
   ```env
   FORG3T_CONTRACT_ID=NEW_CONTRACT_ID_HERE
   ```

## Calling the Verifier Contract

The contract exposes a `verify_proof` function that accepts a proof hash and returns a verification result.

### Function Signature
```rust
fn verify_proof(proof_hash: String, user_hash: String, timestamp: u64) -> bool
```

### Parameters
- `proof_hash`: SHA-256 hash of the zk-SNARK proof
- `user_hash`: Hash of the user's public key
- `timestamp`: Unix timestamp of the proof generation

### Return Value
- `true`: Proof is valid
- `false`: Proof is invalid

## Example Usage

### JavaScript/TypeScript Integration
```typescript
import { StellarService } from '../src/lib/blockchain';

const stellarService = new StellarService();

// Verify a proof on-chain
const isValid = await stellarService.verifyProofOnChain(proofHash);
console.log('Proof verification result:', isValid);
```

### CLI Verification
```bash
npm run verify-proof
```

Or using Soroban CLI directly:
```bash
soroban contract invoke \
  --id CONTRACT_ID \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015" \
  -- \
  verify_proof \
  --proof_hash "PROOF_HASH_HERE" \
  --user_hash "USER_HASH_HERE" \
  --timestamp 1640995200
```

## Contract Events

The verifier contract emits events for audit trails:

1. **ProofVerified**: Emitted when a proof is successfully verified
   - `proof_hash`: The hash of the verified proof
   - `user_hash`: The hash of the user who submitted the proof
   - `timestamp`: When the proof was verified
   - `result`: Boolean indicating verification success

2. **ProofRejected**: Emitted when a proof fails verification
   - `proof_hash`: The hash of the rejected proof
   - `reason`: Reason for rejection

## Viewing Transaction Details

After submitting a proof for verification, you can view the transaction details on the Stellar Expert explorer:

1. Get the transaction hash from the verification response
2. Visit: `https://stellar.expert/explorer/testnet/tx/{TRANSACTION_HASH}`

## Troubleshooting

### Common Issues

1. **Insufficient Funds**: Ensure your testnet account has enough XLM for transaction fees
2. **Network Connectivity**: Verify the RPC URL is correct and accessible
3. **Contract Not Found**: Check that the contract ID is correct and the contract is deployed
4. **Invalid Parameters**: Ensure all parameters are correctly formatted and within expected ranges

### Debugging Tips

1. **Enable Debug Logging**: Set `DEBUG=stellar:*` to see detailed Stellar SDK logs
2. **Check Soroban Events**: Use the Soroban CLI to query contract events
3. **Verify Contract State**: Query contract storage to check its current state

## Future Enhancements

1. **Token Integration**: Integrate 4GET tokens for verification fees
2. **Validator Nodes**: Implement a validator node system for distributed verification
3. **Proof Indexer**: Build an indexer for efficient proof discovery
4. **Multi-Signature Verification**: Add multi-sig support for enterprise use cases

## Security Considerations

1. **Private Key Management**: Never commit private keys to version control
2. **Contract Audits**: Regularly audit the smart contract code
3. **Upgrade Mechanisms**: Implement secure contract upgrade patterns
4. **Rate Limiting**: Apply rate limiting to prevent abuse