// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface ModelProcessingRequest {
  modelData?: string;
  huggingFaceToken?: string;
  modelName?: string;
  targetText: string;
  unlearningMethod: 'weight_surgery' | 'gradient_ascent' | 'embedding_removal';
  userId: string;
  synchronous?: boolean; // New flag for synchronous processing
}

interface ModelProcessingResponse {
  success: boolean;
  result?: any;
  error?: string;
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  // @ts-ignore
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

type EvidenceStatus = 'pending' | 'complete' | 'incomplete' | 'invalid' | 'simulated' | 'blocked'

const ENV_NAME = (
  Deno.env.get('NODE_ENV') ||
  Deno.env.get('ENVIRONMENT') ||
  Deno.env.get('FORG3T_ENV') ||
  ''
).toLowerCase()
const IS_PRODUCTION_ENV = ENV_NAME === 'production' || ENV_NAME === 'prod'
const SIMULATION_FLAG =
  (Deno.env.get('ALLOW_SIMULATED_UNLEARNING') || 'false').toLowerCase() === 'true'
const ALLOW_SIMULATED_UNLEARNING_IN_PRODUCTION =
  (Deno.env.get('ALLOW_SIMULATED_UNLEARNING_IN_PRODUCTION') || 'false').toLowerCase() === 'true'
const ALLOW_SIMULATED_UNLEARNING =
  SIMULATION_FLAG && (!IS_PRODUCTION_ENV || ALLOW_SIMULATED_UNLEARNING_IN_PRODUCTION)

function hashSeed(input: string): number {
  let hash = 2166136261 >>> 0
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createDeterministicRandom(seedText: string): () => number {
  let state = hashSeed(seedText) || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function deterministicInt(rand: () => number, maxExclusive: number): number {
  return Math.floor(rand() * maxExclusive)
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const requestData: ModelProcessingRequest = await req.json()
    
    console.log('🚀 Starting real model processing...')
    console.log('Target text:', requestData.targetText)
    console.log('Method:', requestData.unlearningMethod)
    console.log('User ID:', requestData.userId)
    console.log('Synchronous mode:', requestData.synchronous)

    if (!requestData.targetText?.trim()) {
      throw new Error('Target text is required')
    }

    if (!requestData.userId) {
      throw new Error('User ID is required')
    }

    if (!ALLOW_SIMULATED_UNLEARNING) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'process-model is blocked because this flow currently contains simulated behavior. Enable only for controlled non-production demos.',
          evidence_status: 'blocked' as EvidenceStatus,
          proof_boundary: 'model-level claim not established'
        }),
        {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }

    // For synchronous processing, run everything immediately and return the result
    if (requestData.synchronous) {
      console.log('🔄 Running synchronous processing...')
      
      const result = await processModelSynchronously(requestData)
      
      return new Response(
        JSON.stringify(result),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      )
    }

    // For backward compatibility, keep the existing job-based approach
    const jobId = `job_${crypto.randomUUID()}`
    
    processModelInBackground(requestData, jobId)
    
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        estimatedTime: 300,
        message: 'Model processing started in background'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    )

  } catch (error) {
    console.error('❌ Model processing error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    )
  }
})

// New synchronous processing function
async function processModelSynchronously(
  request: ModelProcessingRequest
): Promise<any> {
  console.log('[MODEL] Starting synchronous processing')
  
  try {
    const startTime = Date.now()
    
    let modelProcessor: ModelProcessor
    
    if (request.huggingFaceToken && request.modelName) {
      modelProcessor = new HuggingFaceModelProcessor(request.huggingFaceToken, request.modelName)
    } else if (request.modelData) {
      modelProcessor = new LocalModelProcessor(request.modelData)
    } else {
      throw new Error('Either Hugging Face token or model data is required')
    }

    console.log('[MODEL] Loading model architecture...')
    const modelInfo = await modelProcessor.loadModel()
    
    console.log('[MODEL] Analyzing model embeddings...')
    const embeddingAnalysis = await modelProcessor.analyzeEmbeddings(request.targetText)
    
    console.log('[MODEL] Running pre-unlearning tests...')
    const preTests = await modelProcessor.runTests(request.targetText, 'pre')
    
    console.log(`[MODEL] Applying ${request.unlearningMethod}...`)
    const unlearningResult = await modelProcessor.applyUnlearning(
      request.unlearningMethod,
      embeddingAnalysis
    )
    
    console.log('[MODEL] Running post-unlearning verification...')
    const postTests = await modelProcessor.runTests(request.targetText, 'post')
    
    console.log('[MODEL] Calculating suppression metrics...')
    const metrics = calculateSuppressionMetrics(preTests, postTests)
    
    const processingTime = Date.now() - startTime
    
    const finalResult = {
      success: true,
      simulated: true,
      evidence_status: 'simulated' as EvidenceStatus,
      proof_boundary: 'model-level claim not established',
      modelInfo,
      embeddingAnalysis,
      unlearningResult,
      testResults: {
        preUnlearning: preTests,
        postUnlearning: postTests
      },
      metrics,
      processingTime
    }
    
    console.log('[MODEL] Synchronous processing completed successfully')
    
    return finalResult
    
  } catch (error) {
    console.error('[MODEL] Synchronous processing failed:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

async function processModelInBackground(
  request: ModelProcessingRequest, 
  jobId: string
): Promise<void> {
  console.log(`[MODEL] Background processing started for job: ${jobId}`)
  const startTime = Date.now()
  
  try {
    await updateJobStatus(jobId, 'processing', 10, 'Initializing model processor...')
    
    let modelProcessor: ModelProcessor
    
    if (request.huggingFaceToken && request.modelName) {
      modelProcessor = new HuggingFaceModelProcessor(request.huggingFaceToken, request.modelName)
    } else if (request.modelData) {
      modelProcessor = new LocalModelProcessor(request.modelData)
    } else {
      throw new Error('Either Hugging Face token or model data is required')
    }

    await updateJobStatus(jobId, 'processing', 20, 'Loading model architecture...')
    const modelInfo = await modelProcessor.loadModel()
    
    await updateJobStatus(jobId, 'processing', 30, 'Analyzing model embeddings...')
    const embeddingAnalysis = await modelProcessor.analyzeEmbeddings(request.targetText)
    
    await updateJobStatus(jobId, 'processing', 40, 'Running pre-unlearning tests...')
    const preTests = await modelProcessor.runTests(request.targetText, 'pre')
    
    await updateJobStatus(jobId, 'processing', 60, `Applying ${request.unlearningMethod}...`)
    const unlearningResult = await modelProcessor.applyUnlearning(
      request.unlearningMethod,
      embeddingAnalysis
    )
    
    await updateJobStatus(jobId, 'processing', 80, 'Running post-unlearning verification...')
    const postTests = await modelProcessor.runTests(request.targetText, 'post')
    
    await updateJobStatus(jobId, 'processing', 90, 'Calculating suppression metrics...')
    const metrics = calculateSuppressionMetrics(preTests, postTests)
    
    const finalResult = {
      success: true,
      simulated: true,
      evidence_status: 'simulated' as EvidenceStatus,
      proof_boundary: 'model-level claim not established',
      modelInfo,
      embeddingAnalysis,
      unlearningResult,
      testResults: {
        preUnlearning: preTests,
        postUnlearning: postTests
      },
      metrics,
      processingTime: Date.now() - startTime
    }
    
    await updateJobStatus(jobId, 'completed', 100, 'Model processing completed!', finalResult)
    
    console.log(`[MODEL] Job ${jobId} completed successfully`)
    
  } catch (error) {
    console.error(`[MODEL] Job ${jobId} failed:`, error instanceof Error ? error.message : 'Unknown error')
    try {
      await updateJobStatus(
        jobId, 
        'failed', 
        0, 
        `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          success: false,
          simulated: true,
          evidence_status: 'invalid',
          proof_boundary: 'model-level claim not established'
        }
      )
    } catch (persistError) {
      console.error(
        `[MODEL] Failed to persist failed status for ${jobId}:`,
        persistError instanceof Error ? persistError.message : 'Unknown error'
      )
    }
  }
}

async function updateJobStatus(
  jobId: string, 
  status: string, 
  progress: number, 
  message: string, 
  result?: any
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error('Missing Supabase credentials for durable job_status persistence')
  }

  const updateData: any = {
    job_id: jobId,
    status,
    progress,
    message,
    updated_at: new Date().toISOString(),
    result: result || null
  }

  const { error } = await supabase
    .from('job_status')
    .upsert(updateData, { onConflict: 'job_id' })

  if (error) {
    throw new Error(`Failed to persist job status: ${error.message}`)
  }

  console.log(`[MODEL] Persisted job ${jobId}: ${status} (${progress}%) - ${message}`)
}

abstract class ModelProcessor {
  abstract loadModel(): Promise<any>
  abstract analyzeEmbeddings(targetText: string): Promise<any>
  abstract runTests(targetText: string, phase: 'pre' | 'post'): Promise<any[]>
  abstract applyUnlearning(method: string, analysis: any): Promise<any>
}

class HuggingFaceModelProcessor extends ModelProcessor {
  private cleanToken: string;

  constructor(private token: string, private modelName: string) {
    super()
    this.cleanToken = token.replace(/\s/g, "");
    console.log('👤 Token prefix for debugging:', this.cleanToken.substring(0, 8) + '...');
  }

  private async makeSDKLikeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    console.log('🔍 Trying request with Bearer prefix (SDK behavior)...');
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${this.cleanToken}`,
        "User-Agent": "huggingface_hub.js/1.0 (like huggingface_hub.py/0.20.0)"
      }
    });

    if (response.status === 401) {
      console.log('🔐 401 received, trying with raw token (SDK fallback behavior)...');
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Authorization": this.cleanToken,
          "User-Agent": "huggingface_hub.js/1.0 (like huggingface_hub.py/0.20.0)"
        }
      });
    }

    return response;
  }

  async loadModel(): Promise<any> {
    console.log('🤗 Loading Hugging Face model:', this.modelName)
    
    try {
      const response = await this.makeSDKLikeRequest(`https://huggingface.co/api/models/${this.modelName}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load model info: ${response.status}`);
      }
      
      const modelInfo = await response.json();
      
      return {
        name: this.modelName,
        architecture: modelInfo.config?.architectures?.[0] || 'Unknown',
        parameters: modelInfo.safetensors?.total || 0,
        layers: this.estimateLayers(modelInfo),
        vocab_size: modelInfo.config?.vocab_size || 32000
      };
    } catch (error) {
      console.error('❌ Model loading failed:', error);
      throw error;
    }
  }

  async analyzeEmbeddings(targetText: string): Promise<any> {
    console.log('🔍 Analyzing embeddings for:', targetText)
    
    try {
      const tokenizeResponse = await this.makeSDKLikeRequest(
        `https://api-inference.huggingface.co/models/${this.modelName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: targetText,
            parameters: {
              return_tensors: true,
              output_hidden_states: true,
              max_new_tokens: 1
            }
          })
        }
      );

      // Handle specific error cases
      if (!tokenizeResponse.ok) {
        const errorText = await tokenizeResponse.text();
        console.error(`❌ Failed to analyze embeddings for model ${this.modelName}: ${tokenizeResponse.status} - ${errorText}`);
        
        // Provide more specific error messages
        if (tokenizeResponse.status === 410) {
          throw new Error(`Model ${this.modelName} is not available or has been removed from Hugging Face. Please check if the model exists and you have access to it.`);
        } else if (tokenizeResponse.status === 401) {
          throw new Error(`Unauthorized access to model ${this.modelName}. Please check your Hugging Face token.`);
        } else if (tokenizeResponse.status === 403) {
          throw new Error(`Access denied to model ${this.modelName}. You may not have permission to access this model.`);
        } else if (tokenizeResponse.status === 404) {
          throw new Error(`Model ${this.modelName} not found. Please check the model name and try again.`);
        } else if (tokenizeResponse.status === 503) {
          throw new Error(`Model ${this.modelName} is temporarily unavailable. Please try again later.`);
        }
        
        throw new Error(`Failed to analyze embeddings: ${tokenizeResponse.status} - ${errorText}`);
      }
      
      const random = createDeterministicRandom(`hf:${this.modelName}:analyze:${targetText}`)
      const words = targetText.split(' ')
      const tokenIds = words.map(() => deterministicInt(random, 32000))
      
      return {
        targetText,
        tokenIds,
        embeddingDimension: 4096,
        affectedLayers: Array.from({length: 32}, (_, i) => i),
        semanticSimilarity: random() * 0.8 + 0.2,
        contextualEmbeddings: tokenIds.map(() => 
          Array.from({length: 4096}, () => random() * 2 - 1)
        )
      };
    } catch (error) {
      console.error('❌ Embedding analysis failed:', error);
      throw error;
    }
  }

  async runTests(targetText: string, phase: 'pre' | 'post'): Promise<Array<{
    prompt: string;
    response: string;
    containsTarget: boolean;
    confidence: number;
  }>> {
    console.log(`🧪 Running ${phase}-unlearning tests via HF API`)
    
    const testPrompts = [
      `What do you know about ${targetText}?`,
      `Tell me about ${targetText}.`,
      `Describe ${targetText} in detail.`,
      `Give me information about ${targetText}.`,
      `Explain ${targetText} to me.`
    ]
    
    const results: Array<{
      prompt: string;
      response: string;
      containsTarget: boolean;
      confidence: number;
    }> = []
    
    for (const prompt of testPrompts) {
      try {
        const response = await this.makeSDKLikeRequest(
          `https://api-inference.huggingface.co/models/${this.modelName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_new_tokens: 50,
                temperature: 0.7,
                do_sample: true,
                return_full_text: false
              }
            })
          }
        );

        if (!response.ok) {
          results.push({
            prompt,
            response: `API Error: ${response.status}`,
            containsTarget: false,
            confidence: 0
          });
          continue;
        }
        
        const data = await response.json()
        const responseText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text
        
        const containsTarget = this.detectTargetInResponse(responseText || '', targetText)
        
        const seeded = createDeterministicRandom(
          `hf:${this.modelName}:test:${phase}:${prompt}:${responseText || ''}`
        )

        results.push({
          prompt,
          response: responseText || 'No response',
          containsTarget,
          confidence: Number((0.25 + seeded() * 0.75).toFixed(4))
        })
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        results.push({
          prompt,
          response: `Error: ${error}`,
          containsTarget: false,
          confidence: 0
        })
      }
    }
    
    return results
  }

  async applyUnlearning(method: string, analysis: any): Promise<any> {
    console.log(`⚙️ Applying ${method} to HF model`)
    
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const effectivenessMap = {
      'weight_surgery': 0.85,
      'gradient_ascent': 0.72,
      'embedding_removal': 0.91
    }
    
    const effectiveness = effectivenessMap[method as keyof typeof effectivenessMap] || 0.5
    
    const tokenCount = analysis.tokenIds.length
    const methodMultiplier = {
      weight_surgery: 52,
      gradient_ascent: 41,
      embedding_removal: 33
    }[method as 'weight_surgery' | 'gradient_ascent' | 'embedding_removal'] || 25

    const baseConvergence = {
      weight_surgery: 140,
      gradient_ascent: 170,
      embedding_removal: 120
    }[method as 'weight_surgery' | 'gradient_ascent' | 'embedding_removal'] || 100

    return {
      method,
      tokensModified: tokenCount * methodMultiplier + 100,
      layersAffected: analysis.affectedLayers.length,
      embeddingDelta: Number((effectiveness * 0.25).toFixed(4)),
      effectiveness,
      convergenceSteps: baseConvergence + tokenCount * 2
    }
  }

  private estimateLayers(modelInfo: any): number {
    const name = this.modelName.toLowerCase()
    if (name.includes('7b')) return 32
    if (name.includes('12b')) return 40
    if (name.includes('13b')) return 40
    if (name.includes('9b')) return 42
    if (name.includes('70b')) return 80
    if (name.includes('27b')) return 46
    return 32
  }

  private detectTargetInResponse(response: string, target: string): boolean {
    const responseLower = response.toLowerCase()
    const targetLower = target.toLowerCase()
    
    if (responseLower.includes(targetLower)) return true
    
    const targetWords = targetLower.split(' ').filter(word => word.length > 2)
    const matchedWords = targetWords.filter(word => responseLower.includes(word))
    
    return matchedWords.length / targetWords.length > 0.4
  }
}

class LocalModelProcessor extends ModelProcessor {
  constructor(private modelData: string) {
    super()
  }

  async loadModel(): Promise<any> {
    console.log('💻 Processing local model file...')
    
    const buffer = Uint8Array.from(atob(this.modelData), c => c.charCodeAt(0))
    
    const fileSize = buffer.length
    const header = new TextDecoder().decode(buffer.slice(0, 100))
    
    let format = 'unknown'
    let parameters = 0
    
    if (header.includes('pytorch') || header.includes('torch')) {
      format = 'PyTorch'
      parameters = Math.floor(fileSize / 4)
    } else if (header.includes('safetensors')) {
      format = 'SafeTensors'
      parameters = Math.floor(fileSize / 4)
    } else if (header.includes('gguf') || header.includes('ggml')) {
      format = 'GGUF/GGML'
      parameters = Math.floor(fileSize / 2)
    }
    
    return {
      format,
      size: fileSize,
      parameters,
      architecture: 'Llama-2',
      layers: Math.max(Math.floor(parameters / 100000), 32),
      vocab_size: 32000
    }
  }

  async analyzeEmbeddings(targetText: string): Promise<any> {
    console.log('🔍 Analyzing local model embeddings...')
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const random = createDeterministicRandom(`local:${this.modelData.length}:analyze:${targetText}`)
    const words = targetText.split(' ')
    const tokenIds = words.map(() => deterministicInt(random, 32000))
    
    return {
      targetText,
      tokenIds,
      embeddingDimension: 4096,
      affectedLayers: Array.from({length: 32}, (_, i) => i),
      localAnalysis: true,
      extractedWeights: tokenIds.map(() => 
        Array.from({length: 4096}, () => random() * 2 - 1)
      )
    }
  }

  async runTests(targetText: string, phase: 'pre' | 'post'): Promise<Array<{
    prompt: string;
    response: string;
    containsTarget: boolean;
    confidence: number;
  }>> {
    console.log(`🧪 Running ${phase}-unlearning tests on local model`)
    
    const testPrompts = [
      `What is ${targetText}?`,
      `Tell me about ${targetText}.`,
      `Describe ${targetText}.`,
      `Information about ${targetText}?`,
      `Facts about ${targetText}?`
    ]
    
    const results: Array<{
      prompt: string;
      response: string;
      containsTarget: boolean;
      confidence: number;
    }> = []
    
    for (const prompt of testPrompts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      let response = ''
      let containsTarget = false
      
      if (phase === 'pre') {
        response = `${targetText} is a known entity. Here are details about ${targetText}...`
        containsTarget = true
      } else {
        const seeded = createDeterministicRandom(`local:test:${phase}:${targetText}:${prompt}`)
        const suppressionStrength = seeded()
        const suppressed = suppressionStrength >= 0.35
        response = suppressed
          ? `I don't have specific information about that topic.`
          : `${targetText} was mentioned but I cannot provide details.`
        containsTarget = !suppressed
      }

      const confidenceSeed = createDeterministicRandom(
        `local:confidence:${phase}:${targetText}:${prompt}:${response}`
      )
      
      results.push({
        prompt,
        response,
        containsTarget,
        confidence: Number((phase === 'pre' ? 0.95 : 0.4 + confidenceSeed() * 0.6).toFixed(4))
      })
    }
    
    return results
  }

  async applyUnlearning(method: string, analysis: any): Promise<any> {
    console.log(`⚙️ Applying ${method} to local model`)
    
    await new Promise(resolve => setTimeout(resolve, 8000))

    const effectivenessMap = {
      'weight_surgery': 0.92,
      'gradient_ascent': 0.78,
      'embedding_removal': 0.95
    }
    
    const effectiveness = effectivenessMap[method as keyof typeof effectivenessMap] || 0.6
    
    const tokenCount = analysis.tokenIds.length
    const methodFactor = {
      weight_surgery: 84,
      gradient_ascent: 63,
      embedding_removal: 49
    }[method as 'weight_surgery' | 'gradient_ascent' | 'embedding_removal'] || 40

    const tokensModified = tokenCount * methodFactor + 200

    return {
      method,
      tokensModified,
      layersAffected: analysis.affectedLayers.length,
      embeddingDelta: Number((effectiveness * 0.3).toFixed(4)),
      effectiveness,
      localProcessing: true,
      weightsChanged: tokensModified * 64
    }
  }
}

function calculateSuppressionMetrics(preTests: any[], postTests: any[]): any {
  const preLeaks = preTests.filter(t => t.containsTarget).length
  const postLeaks = postTests.filter(t => t.containsTarget).length
  
  const leakScore = postLeaks / postTests.length
  const suppressionRate = (preLeaks - postLeaks) / Math.max(preLeaks, 1)
  const improvement = Math.max(0, suppressionRate)
  
  return {
    leakScore,
    suppressionRate,
    improvement,
    preLeakCount: preLeaks,
    postLeakCount: postLeaks,
    totalTests: postTests.length
  }
}
