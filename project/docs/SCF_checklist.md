# SCF Checklist

This checklist provides reviewer-friendly links to all key components of the Forg3t Protocol project.

## Repository
- [Main Repository](https://github.com/your-username/forg3t-protocol) (Please update with actual repository URL)

## Demo
- [Live Demo](https://your-demo-url.com) (Please update with actual demo URL)
- [Demo Video](https://your-video-url.com) (Please update with actual video URL)

## Diagrams
- [Architecture Diagram](./architecture.md)
- [Technical Flow Diagram](./architecture.md#technical-flow)

## Smart Contract
- **Contract Address**: CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM (Testnet)
- **Source Code**: [Soroban Contract](../contracts/forg3t_verifier.rs) (Please update with actual contract location)

## Test Transaction Instructions
1. Deploy the Soroban contract to testnet using `npm run deploy-contract`
2. Generate a zk-SNARK proof using the application
3. Submit the proof for verification using `npm run verify-proof`
4. Check the transaction on [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet)

## Key Features
- [x] zk-SNARK proof generation
- [x] Stellar blockchain integration
- [x] Soroban smart contract verification
- [x] IPFS storage for certificates
- [x] PDF certificate generation
- [ ] White-box unlearning (Planned)
- [ ] Proof indexer (Planned)

## 4GET Token
- **Token Code**: 4GET
- **Token Status**: Planned for future implementation
- **Utility**: Verification fees and validator incentives