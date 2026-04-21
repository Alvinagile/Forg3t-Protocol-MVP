export interface UnlearningResult {
  success: boolean;
  leakScore: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  zkProof?: string;
  blockchainTxHash?: string;
  ipfsHash?: string;
  processingTime?: number;
  results?: Array<{
    prompt: string;
    response: string;
    containsTarget: boolean;
  }>;
  error?: string;
}

interface BlackBoxUnlearningOptions {
  targetInfo: string;
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Legacy placeholder kept for backward compatibility.
 * This module now fails closed to avoid simulated outputs being mistaken for evidence.
 */
export class UnlearningEngine {
  private apiKey: string;
  private abortController: AbortController | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: 'Missing API key.' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { valid: false, error: `OpenAI validation failed (${response.status}): ${errorText}` };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown network error',
      };
    }
  }

  async blackBoxUnlearning(options: BlackBoxUnlearningOptions): Promise<UnlearningResult> {
    const { targetInfo, onProgress } = options;
    this.abortController = new AbortController();

    if (onProgress) onProgress(5, 'Checking legacy engine status...');

    if (!targetInfo?.trim()) {
      return {
        success: false,
        leakScore: 1,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        error: 'targetInfo is required.',
      };
    }

    if (onProgress) onProgress(15, 'Validating API key...');
    const keyValidation = await this.validateApiKey();
    if (!keyValidation.valid) {
      return {
        success: false,
        leakScore: 1,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        error: keyValidation.error ?? 'Invalid API key.',
      };
    }

    if (onProgress) onProgress(100, 'Blocked: legacy engine disabled.');

    return {
      success: false,
      leakScore: 1,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      error:
        'Legacy ipfs unlearning engine is disabled for production safety. Use AssistantsSuppressionEngine or whitebox local runner flows.',
    };
  }

  cancelOperation(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
