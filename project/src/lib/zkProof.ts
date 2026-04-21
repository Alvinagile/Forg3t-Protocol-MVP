const IS_PRODUCTION_BUILD = Boolean(import.meta.env.PROD);
const ALLOW_SIMULATED_CRYPTO =
  import.meta.env.VITE_ALLOW_SIMULATED_CRYPTO === 'true' && !IS_PRODUCTION_BUILD;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toHex(new Uint8Array(buffer));
}

function fieldFromHex(hex: string, start: number): string {
  return `0x${hex.slice(start, start + 64).padEnd(64, '0')}`;
}

export class ZKProofGenerator {
  static async generateSuppressionProof(
    inputData: {
      targetString: string;
      leakScore: number;
      embeddingDelta?: number;
      adversarialResults: any[];
    }
  ): Promise<{
    proof: any;
    publicSignals: any;
    proofHash: string;
    simulated?: boolean;
    proofBoundary?: string;
  }> {
    if (!ALLOW_SIMULATED_CRYPTO) {
      throw new Error(
        'ZK proof generation is blocked: no prover backend is configured. Simulated crypto is disabled for production builds.'
      );
    }

    const canonical = JSON.stringify({
      targetString: inputData.targetString,
      leakScore: Number(inputData.leakScore.toFixed(6)),
      embeddingDelta: Number((inputData.embeddingDelta || 0).toFixed(6)),
      adversarialCount: inputData.adversarialResults.length
    });

    const digest = await sha256Hex(canonical);
    const digest2 = await sha256Hex(`proof:${digest}`);
    const digest3 = await sha256Hex(`proof:${digest2}`);

    const proof = {
      pi_a: [fieldFromHex(digest, 0), fieldFromHex(digest2, 0)],
      pi_b: [
        [fieldFromHex(digest, 16), fieldFromHex(digest2, 16)],
        [fieldFromHex(digest3, 0), fieldFromHex(digest3, 16)]
      ],
      pi_c: [fieldFromHex(digest2, 8), fieldFromHex(digest3, 8)]
    };

    const publicSignals = [
      Math.floor(inputData.leakScore * 1000).toString(),
      Math.floor((inputData.embeddingDelta || 0) * 10000).toString(),
      inputData.adversarialResults.length.toString()
    ];

    return {
      proof,
      publicSignals,
      proofHash: `0x${digest}`,
      simulated: true,
      proofBoundary: 'control-plane only'
    };
  }

  static async verifyProof(proof: any, publicSignals: any): Promise<boolean> {
    if (!ALLOW_SIMULATED_CRYPTO) {
      console.warn('Proof verification blocked: simulated cryptographic verifier is disabled for this build.');
      return false;
    }

    if (!proof || !publicSignals) {
      return false;
    }

    const digest = await sha256Hex(JSON.stringify({ proof, publicSignals }));
    return digest.length === 64;
  }
}
