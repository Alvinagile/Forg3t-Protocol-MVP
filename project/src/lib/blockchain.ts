import * as StellarSdk from '@stellar/stellar-sdk';

const IS_PRODUCTION_BUILD = Boolean(import.meta.env.PROD);
const ALLOW_SIMULATED_ONCHAIN =
  import.meta.env.VITE_ALLOW_SIMULATED_ONCHAIN === 'true' && !IS_PRODUCTION_BUILD;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toHex(new Uint8Array(buffer));
}

export class StellarService {
  private server: StellarSdk.rpc.Server;
  private contractId: string;

  constructor() {
    this.server = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org:443');
    this.contractId = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
  }

  async commitForgetProof(
    proofHash: string,
    userHash: string,
    timestamp: number
  ): Promise<string> {
    try {
      if (!ALLOW_SIMULATED_ONCHAIN) {
        throw new Error(
          'On-chain commit is blocked: no signed transaction path is configured. Simulated on-chain mode is disabled for production builds.'
        );
      }

      const txSeed = JSON.stringify({
        proofHash,
        userHash,
        timestamp,
        contractId: this.contractId
      });
      const txHash = `0x${await sha256Hex(txSeed)}`;

      console.log('Committing proof to Stellar:', {
        proofHash,
        userHash,
        timestamp,
        contractId: this.contractId
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      return txHash;
    } catch (error) {
      console.error('Stellar commit failed:', error);
      throw new Error('Failed to commit proof to blockchain');
    }
  }

  async verifyProofOnChain(proofHash: string): Promise<boolean> {
    try {
      if (!ALLOW_SIMULATED_ONCHAIN) {
        console.warn('On-chain verification is blocked: simulated on-chain mode is disabled for this build.');
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      return /^0x[a-fA-F0-9]{64}$/.test(proofHash);
    } catch (error) {
      console.error('On-chain verification failed:', error);
      return false;
    }
  }

  getStellarExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  }
}
