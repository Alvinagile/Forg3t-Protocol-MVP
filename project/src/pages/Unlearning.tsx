import React, { useState } from 'react';
import { Shield, Download, Play, X, CheckCircle, AlertCircle, FileText, Key, Database, Bot, Zap, Server, FolderOpen, Settings, ExternalLink, Sparkles } from 'lucide-react';
import { AssistantsSuppressionEngine, AssistantSuppressionResult } from '../lib/assistantsUnlearning';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { LocalUnlearningClient, LocalUnlearningConfig } from '../local/runLocalClient';
import { ZKProofGenerator } from '../lib/zkProof';
import { StellarService } from '../lib/blockchain';
import { BrandLockup } from '../components/BrandLockup';
import { useSearchParams } from 'react-router-dom';

interface SorobanEvidenceState {
  status: 'idle' | 'running' | 'complete' | 'error';
  proofHash?: string;
  txHash?: string;
  ipfsHash?: string | null;
  error?: string;
  simulated?: boolean;
}

export function Unlearning() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'blackbox' | 'whitebox'>('blackbox');

  const [apiKey, setApiKey] = useState('');
  const [blackboxLoading, setBlackboxLoading] = useState(false);
  const [blackboxProgress, setBlackboxProgress] = useState({ percent: 0, message: '' });

  const [assistantId, setAssistantId] = useState('');
  const [targetText, setTargetText] = useState('');
  const [reason, setReason] = useState('');
  const [assistantResults, setAssistantResults] = useState<AssistantSuppressionResult | null>(null);
  const [latestRequestId, setLatestRequestId] = useState<string | null>(null);
  const [sorobanEvidence, setSorobanEvidence] = useState<SorobanEvidenceState>({ status: 'idle' });

  const [modelPaths, setModelPaths] = useState<string[]>(['']);
  const [whiteboxResults, setWhiteboxResults] = useState<any>(null);
  const [whiteboxLoading, setWhiteboxLoading] = useState(false);

  const [outputDir, setOutputDir] = useState('');
  const [localMethod, setLocalMethod] = useState<'EmbeddingScrub' | 'LastLayerSurgery'>('EmbeddingScrub');
  const [maxSteps, setMaxSteps] = useState(100);
  const [learningRate, setLearningRate] = useState(0.01);
  const [seed, setSeed] = useState(42);
  const [localServerOnline, setLocalServerOnline] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState('');
  const [whiteboxProgress, setWhiteboxProgress] = useState({ percent: 0, message: '' });
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const sorobanSimulationEnabled =
    import.meta.env.VITE_ALLOW_SIMULATED_ONCHAIN === 'true' && !import.meta.env.PROD;
  const proofSimulationEnabled =
    import.meta.env.VITE_ALLOW_SIMULATED_CRYPTO === 'true' && !import.meta.env.PROD;

  React.useEffect(() => {
    const requestedType = searchParams.get('type')?.toLowerCase();
    if (requestedType === 'white-box' || requestedType === 'whitebox') {
      setActiveTab('whitebox');
      return;
    }
    if (requestedType === 'black-box' || requestedType === 'blackbox') {
      setActiveTab('blackbox');
    }
  }, [searchParams]);

  React.useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const status = await LocalUnlearningClient.isOnline(customServerUrl || undefined);
        setLocalServerOnline(status.online);
      } catch (error) {
        setLocalServerOnline(false);
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, [customServerUrl]);

  const manuallyCheckServerStatus = async () => {
    try {
      const status = await LocalUnlearningClient.isOnline(customServerUrl || undefined);
      setLocalServerOnline(status.online);
      if (status.online) {
        alert('Server is online and ready to use!');
      } else {
        alert('Server is offline. Please make sure the local server is running.\n\n' +
          'To start the local server:\n' +
          '1. Make sure you have Python installed\n' +
          '2. Navigate to the local-server-package directory\n' +
          '3. Run: python server.py\n' +
          '4. The server should start on port 8787');
      }
    } catch (error) {
      setLocalServerOnline(false);
      alert('Failed to check server status. Please make sure the local server is running.\n\n' +
        'To start the local server:\n' +
        '1. Make sure you have Python installed\n' +
        '2. Navigate to the local-server-package directory\n' +
        '3. Run: python server.py\n' +
        '4. The server should start on port 8787');
    }
  };

  const handleBlackboxUnlearning = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key with full access permissions');
      return;
    }

    if (!assistantId.trim()) {
      alert('Please enter your Assistant ID');
      return;
    }

    if (!targetText.trim()) {
      alert('Please enter the target text to suppress');
      return;
    }

    setBlackboxLoading(true);
    setAssistantResults(null);
    setLatestRequestId(null);
    setSorobanEvidence({ status: 'idle' });
    setBlackboxProgress({ percent: 0, message: 'Starting...' });

    try {
      const engine = new AssistantsSuppressionEngine(apiKey);

      const config = {
        apiKey: apiKey,
        assistantId: assistantId,
        targetPhrase: targetText,
        suppressionRules: []
      };

      const results = await engine.injectSuppression(
        config,
        (percent, message) => {
          setBlackboxProgress({ percent, message });
        }
      );

      setAssistantResults(results);
      setBlackboxProgress({ percent: 100, message: 'Suppression protocol completed!' });

      if (results.success && user) {
        const requestId = await saveAssistantSuppressionRequest(results);
        setLatestRequestId(requestId);
      }
    } catch (error) {
      console.error('Unlearning process failed', error);

      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('403') || errorMessage.includes('insufficient permissions')) {
        errorMessage = 'API Key Permission Error: Please create a new OpenAI API key with full access permissions at https://platform.openai.com/api-keys';
      }

      setAssistantResults({
        success: false,
        assistantId: assistantId,
        suppressionInjected: false,
        validationResults: {
          phase1Results: [],
          phase2Results: []
        },
        leakScore: 1.0,
        totalTests: 60,
        passedTests: 0,
        failedTests: 60,
        processingTime: 0,
        error: errorMessage
      });
    } finally {
      setBlackboxLoading(false);
    }
  };

  // Removed unused saveUnlearningRequest function

  const downloadPDF = async (currentAssistantResults: AssistantSuppressionResult) => {
    if (!currentAssistantResults || !user) return;

    alert(
      'Compliance certificate export is blocked until Soroban evidence is prepared with zk_proof_hash, stellar_tx_id, and ipfs_cid. Use the Soroban evidence panel below, then export from the dashboard when the evidence bundle is complete.'
    );
    return;
  };

  const uploadEvidenceManifest = async (payload: Record<string, unknown>) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return null;
    }

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
      `soroban-evidence-${Date.now()}.json`
    );
    formData.append('filename', `soroban-evidence-${Date.now()}.json`);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/upload-to-ipfs`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data?.ipfsCid || null;
    } catch (error) {
      console.warn('Failed to upload evidence manifest to IPFS:', error);
      return null;
    }
  };

  const saveAssistantSuppressionRequest = async (results: AssistantSuppressionResult) => {
    try {
      if (supabase && 'from' in supabase && supabase.from) {
        const evidenceStatus = results.success ? 'incomplete' : 'invalid';
        const { data, error } = await supabase
          .from('unlearning_requests')
          .insert({
            user_id: user?.id,
            request_reason: reason || targetText || 'Assistant suppression request',
            status: results.success ? 'completed' : 'failed',
            processing_time_seconds: results.processingTime,
            blockchain_tx_hash: null,
            audit_trail: {
              evidence_status: evidenceStatus,
              proof_boundary: 'control-plane only',
              export_blocked: true,
              simulated: false,
              leak_score: results.leakScore,
              zk_proof: null,
              ipfs_hash: null,
              assistant_id: results.assistantId,
              target_text: targetText,
              total_tests: results.totalTests,
              passed_tests: results.passedTests,
              failed_tests: results.failedTests,
              phase1_results: results.validationResults.phase1Results,
              phase2_results: results.validationResults.phase2Results
            }
          })
          .select('id')
          .single();

        if (error) {
          console.error('Failed to save request:', error.message);
          return null;
        }

        return data?.id || null;
      }
    } catch (error) {
      console.error('Error saving request:', error);
    }

    return null;
  };

  const anchorOnSoroban = async (currentResults: AssistantSuppressionResult) => {
    if (!currentResults || !user) return;

    setSorobanEvidence({ status: 'running' });

    try {
      const proof = await ZKProofGenerator.generateSuppressionProof({
        targetString: targetText || 'Suppressed knowledge target',
        leakScore: currentResults.leakScore,
        adversarialResults: currentResults.validationResults.phase2Results
      });

      const stellar = new StellarService();
      const txHash = await stellar.commitForgetProof(proof.proofHash, user.id, Date.now());

      const ipfsHash = await uploadEvidenceManifest({
        request_id: latestRequestId,
        assistant_id: currentResults.assistantId,
        target_text: targetText,
        reason: reason || null,
        leak_score: currentResults.leakScore,
        total_tests: currentResults.totalTests,
        passed_tests: currentResults.passedTests,
        failed_tests: currentResults.failedTests,
        zk_proof_hash: proof.proofHash,
        stellar_tx_id: txHash,
        generated_at: new Date().toISOString(),
        proof_boundary: proof.proofBoundary || 'suppression verified'
      });

      const evidenceStatus = ipfsHash ? 'complete' : 'incomplete';

      if (supabase && 'from' in supabase && supabase.from && latestRequestId) {
        const { error } = await supabase
          .from('unlearning_requests')
          .update({
            blockchain_tx_hash: txHash,
            audit_trail: {
              evidence_status: evidenceStatus,
              proof_boundary: proof.proofBoundary || 'suppression verified',
              export_blocked: !ipfsHash,
              simulated: Boolean(proof.simulated),
              leak_score: currentResults.leakScore,
              zk_proof: proof.proofHash,
              ipfs_hash: ipfsHash,
              assistant_id: currentResults.assistantId,
              target_text: targetText,
              total_tests: currentResults.totalTests,
              passed_tests: currentResults.passedTests,
              failed_tests: currentResults.failedTests,
              phase1_results: currentResults.validationResults.phase1Results,
              phase2_results: currentResults.validationResults.phase2Results
            }
          })
          .eq('id', latestRequestId);

        if (error) {
          console.warn('Failed to persist Soroban evidence metadata:', error.message);
        }
      }

      setSorobanEvidence({
        status: 'complete',
        proofHash: proof.proofHash,
        txHash,
        ipfsHash,
        simulated: Boolean(proof.simulated)
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Soroban evidence error';
      setSorobanEvidence({
        status: 'error',
        error: errorMessage
      });
    }
  };

  const cancelBlackboxUnlearning = () => {
    const engine = new AssistantsSuppressionEngine(apiKey);
    engine.cancelOperation();
    setBlackboxLoading(false);
    setBlackboxProgress({ percent: 0, message: 'Cancelled by user' });
  };

  const handleLocalUnlearning = async () => {
    if (!targetText.trim()) {
      alert('Please enter the target text to unlearn');
      return;
    }

    // Check if at least one model path is provided and not empty
    const validModelPaths = modelPaths.filter(path => path.trim() !== '');
    if (validModelPaths.length === 0) {
      alert('Please enter at least one model path');
      return;
    }

    if (!outputDir.trim()) {
      alert('Please enter the output directory');
      return;
    }

    if (!localServerOnline) {
      alert('Local server is not running. Please start the local server and try again.\n\n' +
        'To start the local server:\n' +
        '1. Make sure you have Python installed\n' +
        '2. Navigate to the local-server-package directory\n' +
        '3. Run: python server.py\n' +
        '4. The server should start on port 8787\n' +
        '5. Wait for the server to fully start before trying again');
      return;
    }

    setWhiteboxLoading(true);
    setWhiteboxResults(null);
    setWhiteboxProgress({ percent: 0, message: 'Starting local unlearning process...' });
    setArtifacts([]);

    try {
      const mainModelPath = validModelPaths[0];

      const normalizedModelPath = mainModelPath.replace(/\\/g, '/');

      const unlearningRequest: LocalUnlearningConfig = {
        model_path: normalizedModelPath,
        output_dir: outputDir,
        target_text: targetText,
        method: localMethod,
        max_steps: maxSteps,
        lr: learningRate,
        seed: seed
      };

      const baseUrl = customServerUrl || undefined;

      const startResponse = await LocalUnlearningClient.startJob(unlearningRequest, baseUrl);

      const jobId = startResponse.job_id;

      setWhiteboxProgress({ percent: 10, message: 'Unlearning job started, monitoring progress...' });

      await LocalUnlearningClient.poll(
        jobId,
        (status) => {
          if (status.progress) {
            setWhiteboxProgress({
              percent: Math.max(10, Math.min(90, status.progress.percent)),
              message: status.progress.message
            });
          }
        },
        baseUrl
      );

      const statusResponse = await LocalUnlearningClient.poll(jobId, () => { }, baseUrl);

      try {
        const artifactResponse = await LocalUnlearningClient.getArtifactIndex(jobId, baseUrl);
        setArtifacts(artifactResponse.artifacts || []);
      } catch (artifactError) {
        console.warn('Could not fetch artifact index:', artifactError);
      }

      const results: any = {
        success: true,
        jobId: jobId,
        artifact_path: statusResponse.result?.artifact_path,
        before_similarity: statusResponse.result?.before_similarity,
        after_similarity: statusResponse.result?.after_similarity,
        before_logit: statusResponse.result?.before_logit,
        after_logit: statusResponse.result?.after_logit
      };

      setWhiteboxResults(results);

      setWhiteboxProgress({ percent: 100, message: 'Unlearning completed successfully!' });

    } catch (error) {
      console.error('Local unlearning failed:', error);
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Server is not reachable')) {
        errorMessage = 'Could not connect to the local unlearning server. Please make sure the server is running.\n\n' +
          'To start the local server:\n' +
          '1. Make sure you have Python installed\n' +
          '2. Navigate to the local-server-package directory\n' +
          '3. Run: python server.py\n' +
          '4. The server should start on port 8787\n' +
          '5. Wait for the server to fully start before trying again\n\n' +
          'If you have already started the server, please check that it is running on one of these ports: 8787, 8788, 8789, 8790';
      }

      setWhiteboxResults({
        success: false,
        error: errorMessage
      });
      setWhiteboxProgress({ percent: 0, message: 'Local unlearning failed' });

      alert(`Local unlearning failed: ${errorMessage}\n\nPlease check the server logs and try again.`);
    } finally {
      setWhiteboxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.26),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_42%,_#ffffff_100%)]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <BrandLockup />
        </div>

        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('blackbox')}
              className={`flex items-center rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === 'blackbox'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Shield className="mr-2 h-4 w-4" />
              Black-box Suppression
            </button>
            <button
              onClick={() => setActiveTab('whitebox')}
              className={`flex items-center rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === 'whitebox'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Database className="mr-2 h-4 w-4" />
              White-box Unlearning
            </button>
          </div>
        </div>

        {activeTab === 'blackbox' && (
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center">
                <Shield className="mr-3 h-8 w-8 text-sky-600" />
                <h2 className="text-3xl font-bold text-slate-950">Black-box Suppression</h2>
              </div>

              <p className="mb-8 text-lg leading-relaxed text-slate-600">
                Inject suppression protocols into OpenAI Assistants without accessing model weights.
                This method updates the assistant instructions and validates the response behavior afterward.
              </p>

              <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="mb-4 text-xl font-bold text-slate-950">Assistant Setup Instructions</h3>
                <ol className="space-y-3 text-slate-600">
                  <li className="flex items-start space-x-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">1</span>
                    <span>
                      Go to{' '}
                      <a
                        href="https://platform.openai.com/assistants"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 underline hover:text-sky-800"
                      >
                        OpenAI Assistants
                      </a>{' '}
                      and open or create the Assistant you want to update.
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">2</span>
                    <span>Copy the Assistant ID that starts with <code className="rounded bg-white px-1.5 py-0.5 text-slate-900">asst_</code>.</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">3</span>
                    <span>
                      Generate an API key from{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 underline hover:text-sky-800"
                      >
                        OpenAI API Keys
                      </a>{' '}
                      with permissions required to update Assistants.
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">4</span>
                    <span>Enter the API key, Assistant ID, and target text below to inject the suppression protocol.</span>
                  </li>
                </ol>

                <div className="mt-6 border-t border-slate-200 pt-4">
                  <h4 className="mb-3 font-bold text-slate-950">How to Use</h4>
                  <ol className="list-inside list-decimal space-y-2 text-slate-600">
                    <li>First, validate the assistant on a neutral prompt so you have a baseline.</li>
                    <li>Then click <strong>Inject Suppression Protocol</strong> to apply the instruction-layer update.</li>
                    <li>After the run completes, anchor Soroban evidence and wait for the proof bundle to be ready.</li>
                    <li>Retest the original target and confirm the assistant now refuses that content.</li>
                    <li>Ask unrelated prompts to confirm the assistant still behaves normally outside the target scope.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-lg font-semibold text-slate-950">
                    <Key className="mr-2 inline h-5 w-5" />
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-lg font-semibold text-slate-950">
                    <Bot className="mr-2 inline h-5 w-5" />
                    Assistant ID
                  </label>
                  <input
                    type="text"
                    value={assistantId}
                    onChange={(e) => setAssistantId(e.target.value)}
                    placeholder="asst_..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-lg font-semibold text-slate-950">
                    <FileText className="mr-2 inline h-5 w-5" />
                    Target Text to Suppress
                  </label>
                  <input
                    type="text"
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    placeholder="Enter the text or phrase you want to suppress..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    The assistant will be instructed to refuse responses associated with this target.
                  </p>
                </div>

                <div>
                  <label className="mb-3 block text-lg font-semibold text-slate-950">
                    <FileText className="mr-2 inline h-5 w-5" />
                    Reason for Suppression
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the compliance or operational reason (optional)..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-4">
                  {!blackboxLoading ? (
                    <button
                      onClick={handleBlackboxUnlearning}
                      className="inline-flex items-center rounded-xl bg-slate-950 px-8 py-4 font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Inject Suppression Protocol
                    </button>
                  ) : (
                    <button
                      onClick={cancelBlackboxUnlearning}
                      className="inline-flex items-center rounded-xl bg-rose-600 px-8 py-4 font-semibold text-white transition-colors hover:bg-rose-700"
                    >
                      <X className="mr-2 h-5 w-5" />
                      Cancel Process
                    </button>
                  )}
                </div>

                {blackboxLoading && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-semibold text-slate-950">Processing...</span>
                      <span className="font-bold text-slate-950">{blackboxProgress.percent}%</span>
                    </div>
                    <div className="mb-4 h-3 w-full rounded-full bg-slate-200">
                      <div
                        className="h-3 rounded-full bg-slate-900 transition-all duration-500"
                        style={{ width: `${blackboxProgress.percent}%` }}
                      />
                    </div>
                    <p className="text-slate-600">{blackboxProgress.message}</p>
                  </div>
                )}

                {assistantResults && (
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <h3 className="text-3xl font-bold text-slate-950">Assistant Suppression Results</h3>
                      <button
                        onClick={() => assistantResults && downloadPDF(assistantResults)}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Certificate
                      </button>
                    </div>

                    {assistantResults.success ? (
                      <div className="mb-8 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-center">
                          <CheckCircle className="mr-3 h-7 w-7 text-emerald-600" />
                          <span className="text-xl font-bold text-emerald-800">Suppression Protocol Complete</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-8 rounded-xl border-2 border-rose-200 bg-rose-50 p-5">
                        <div className="mb-2 flex items-center">
                          <AlertCircle className="mr-3 h-7 w-7 text-rose-600" />
                          <span className="text-xl font-bold text-rose-800">Suppression Failed</span>
                        </div>
                        {assistantResults.error && (
                          <p className="text-rose-700">{assistantResults.error}</p>
                        )}
                      </div>
                    )}

                    {assistantResults.success && (
                      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex items-center">
                              <Sparkles className="mr-2 h-5 w-5 text-sky-600" />
                              <h4 className="text-lg font-semibold text-slate-950">Soroban Evidence Anchoring</h4>
                            </div>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                              Prepare immutable proof metadata for Stellar transaction tracking and IPFS continuity before certificate export is enabled.
                            </p>
                          </div>

                          <button
                            onClick={() => anchorOnSoroban(assistantResults)}
                            disabled={sorobanEvidence.status === 'running'}
                            className="inline-flex items-center rounded-lg bg-slate-950 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {sorobanEvidence.status === 'running' ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                Anchoring on Soroban...
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Anchor on Soroban
                              </>
                            )}
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Proof path</p>
                            <p className="mt-2 text-sm text-slate-600">
                              {proofSimulationEnabled ? 'Simulation enabled for local proof generation.' : 'A prover backend is required in this environment.'}
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">On-chain path</p>
                            <p className="mt-2 text-sm text-slate-600">
                              {sorobanSimulationEnabled ? 'Soroban test flow is enabled.' : 'A signed transaction path is required before commit.'}
                            </p>
                          </div>
                        </div>

                        {sorobanEvidence.status === 'complete' && (
                          <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">zk_proof_hash</p>
                              <p className="mt-2 break-all text-sm text-slate-900">{sorobanEvidence.proofHash}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">stellar_tx_id</p>
                              {sorobanEvidence.txHash ? (
                                <a
                                  href={`https://stellar.expert/explorer/testnet/tx/${sorobanEvidence.txHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center break-all text-sm text-slate-900 hover:text-sky-700"
                                >
                                  {sorobanEvidence.txHash}
                                  <ExternalLink className="ml-2 h-4 w-4 shrink-0" />
                                </a>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500">Pending</p>
                              )}
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">ipfs_cid</p>
                              <p className="mt-2 break-all text-sm text-slate-900">
                                {sorobanEvidence.ipfsHash || 'IPFS upload unavailable in this environment'}
                              </p>
                              {sorobanEvidence.simulated && (
                                <p className="mt-2 text-xs text-amber-700">Simulation mode was used for proof or on-chain generation.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {sorobanEvidence.status === 'error' && (
                          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {sorobanEvidence.error}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center">
                          <div className="rounded-lg bg-emerald-100 p-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          </div>
                          <span className="ml-3 font-medium text-slate-600">Suppression Rate</span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">
                          {(((assistantResults.totalTests - assistantResults.failedTests) / assistantResults.totalTests) * 100).toFixed(1)}%
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center">
                          <div className="rounded-lg bg-amber-100 p-2">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                          </div>
                          <span className="ml-3 font-medium text-slate-600">Leak Score</span>
                        </div>
                        <p className="text-3xl font-bold text-amber-600">
                          {(assistantResults.leakScore * 100).toFixed(1)}%
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center">
                          <div className="rounded-lg bg-sky-100 p-2">
                            <CheckCircle className="h-5 w-5 text-sky-600" />
                          </div>
                          <span className="ml-3 font-medium text-slate-600">Tests Passed</span>
                        </div>
                        <p className="text-3xl font-bold text-sky-600">
                          {assistantResults.passedTests}/{assistantResults.totalTests}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-3 flex items-center">
                          <div className="rounded-lg bg-indigo-100 p-2">
                            <Zap className="h-5 w-5 text-indigo-600" />
                          </div>
                          <span className="ml-3 font-medium text-slate-600">Processing Time</span>
                        </div>
                        <p className="text-3xl font-bold text-indigo-600">{assistantResults.processingTime}s</p>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center text-xl font-bold text-slate-950">
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                            <span className="font-bold text-sky-600">1</span>
                          </div>
                          Phase 1: Reinforcement
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 py-2">
                            <span className="font-medium text-slate-600">Total Prompts</span>
                            <span className="text-lg font-bold text-slate-950">{assistantResults.validationResults.phase1Results.length}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="font-medium text-slate-600">Suppressed</span>
                            <span className="text-lg font-bold text-emerald-600">
                              {assistantResults.validationResults.phase1Results.filter(r => r.suppressionActive).length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h4 className="mb-4 flex items-center text-xl font-bold text-slate-950">
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                            <span className="font-bold text-indigo-600">2</span>
                          </div>
                          Phase 2: Validation
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 py-2">
                            <span className="font-medium text-slate-600">Total Tests</span>
                            <span className="text-lg font-bold text-slate-950">{assistantResults.validationResults.phase2Results.length}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="font-medium text-slate-600">Suppressed</span>
                            <span className="text-lg font-bold text-emerald-600">
                              {assistantResults.validationResults.phase2Results.filter(r => r.suppressionActive).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whitebox' && (
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center">
                <Database className="mr-3 h-8 w-8 text-sky-600" />
                <h2 className="text-3xl font-bold text-slate-950">White-box Unlearning</h2>
              </div>

              <p className="mb-8 text-lg leading-relaxed text-slate-600">
                Use the local runtime for direct model adaptation. This path requires access to model files,
                output storage, and a reachable local server.
              </p>

              <div
                className={`mb-8 rounded-xl border p-6 ${
                  localServerOnline ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start">
                    <Server className={`mr-3 mt-0.5 h-5 w-5 ${localServerOnline ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div>
                      <h3 className={`text-lg font-semibold ${localServerOnline ? 'text-emerald-900' : 'text-amber-900'}`}>
                        Local Runtime Status
                      </h3>
                      <p className={`mt-1 text-sm ${localServerOnline ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {localServerOnline ? 'Server is online and ready for model-side execution.' : 'Server is offline. Start the local runtime before launching a job.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={manuallyCheckServerStatus}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    Check Now
                  </button>
                </div>
                <p className={`mt-4 text-sm leading-6 ${localServerOnline ? 'text-emerald-800' : 'text-amber-800'}`}>
                  Use a clean model path, a dedicated output directory, and a stable target phrase for reproducible white-box runs.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-900">
                    <Settings className="mr-2 inline h-4 w-4" />
                    Custom Server URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8787"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-900">
                    <FolderOpen className="mr-2 inline h-4 w-4" />
                    Model Path(s)
                  </label>
                  <div className="space-y-2">
                    {modelPaths.map((path, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={path}
                          onChange={(e) => {
                            const newPaths = [...modelPaths];
                            newPaths[index] = e.target.value;
                            setModelPaths(newPaths);
                          }}
                          placeholder="/path/to/model.safetensors"
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        {modelPaths.length > 1 && (
                          <button
                            onClick={() => {
                              const newPaths = modelPaths.filter((_, i) => i !== index);
                              setModelPaths(newPaths);
                            }}
                            className="rounded-xl bg-rose-600 px-3 py-3 text-white transition-colors hover:bg-rose-700"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setModelPaths([...modelPaths, ''])}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      + Add Another Model Path
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-900">
                    <FolderOpen className="mr-2 inline h-4 w-4" />
                    Output Directory
                  </label>
                  <input
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="/path/to/output"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-900">
                    <FileText className="mr-2 inline h-4 w-4" />
                    Target Text to Unlearn
                  </label>
                  <input
                    type="text"
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    placeholder="Enter the target phrase or token range..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-900">Unlearning Method</label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <button
                      onClick={() => setLocalMethod('EmbeddingScrub')}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        localMethod === 'EmbeddingScrub'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <h4 className="font-semibold">Embedding Scrub</h4>
                      <p className={`mt-2 text-sm leading-6 ${localMethod === 'EmbeddingScrub' ? 'text-slate-200' : 'text-slate-500'}`}>
                        Modify token embeddings to reduce associations with the target.
                      </p>
                    </button>
                    <button
                      onClick={() => setLocalMethod('LastLayerSurgery')}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        localMethod === 'LastLayerSurgery'
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <h4 className="font-semibold">Last Layer Surgery</h4>
                      <p className={`mt-2 text-sm leading-6 ${localMethod === 'LastLayerSurgery' ? 'text-slate-200' : 'text-slate-500'}`}>
                        Adjust the final layer to reduce logits linked to the target output.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Max Steps</label>
                    <input
                      type="number"
                      value={maxSteps}
                      onChange={(e) => setMaxSteps(parseInt(e.target.value) || 100)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Learning Rate</label>
                    <input
                      type="number"
                      step="0.001"
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.01)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">Seed</label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="flex justify-start">
                  <button
                    onClick={handleLocalUnlearning}
                    disabled={whiteboxLoading || !localServerOnline}
                    className="inline-flex items-center rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {whiteboxLoading ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Start Unlearning
                      </>
                    )}
                  </button>
                </div>

                {whiteboxLoading && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-medium text-slate-900">Processing</span>
                      <span className="font-semibold text-slate-900">{whiteboxProgress.percent}%</span>
                    </div>
                    <div className="mb-4 h-3 w-full rounded-full bg-slate-200">
                      <div
                        className="h-3 rounded-full bg-slate-900 transition-all duration-500"
                        style={{ width: `${whiteboxProgress.percent}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600">{whiteboxProgress.message}</p>
                  </div>
                )}

                {whiteboxResults && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="mb-4 text-xl font-semibold text-slate-950">Processing Results</h3>
                    {whiteboxResults.success ? (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="flex items-center">
                            <CheckCircle className="mr-3 h-6 w-6 text-emerald-600" />
                            <span className="text-lg font-semibold text-emerald-800">Unlearning Completed Successfully</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {whiteboxResults.before_similarity !== undefined && (
                            <>
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-2 font-medium text-slate-700">Before Similarity</div>
                                <div className="text-2xl font-semibold text-slate-950">
                                  {(whiteboxResults.before_similarity * 100).toFixed(2)}%
                                </div>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-2 font-medium text-slate-700">After Similarity</div>
                                <div className="text-2xl font-semibold text-emerald-700">
                                  {(whiteboxResults.after_similarity * 100).toFixed(2)}%
                                </div>
                              </div>
                            </>
                          )}

                          {whiteboxResults.before_logit !== undefined && (
                            <>
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-2 font-medium text-slate-700">Before Logit</div>
                                <div className="text-2xl font-semibold text-slate-950">
                                  {whiteboxResults.before_logit.toFixed(4)}
                                </div>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-2 font-medium text-slate-700">After Logit</div>
                                <div className="text-2xl font-semibold text-emerald-700">
                                  {whiteboxResults.after_logit.toFixed(4)}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {artifacts.length > 0 && (
                          <div className="mt-2">
                            <h4 className="mb-3 text-lg font-semibold text-slate-950">Generated Artifacts</h4>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              {artifacts.map((artifact: any, index: number) => (
                                <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
                                  <div className="font-medium text-slate-900">{artifact.name}</div>
                                  <div className="mt-1 text-sm text-slate-500">
                                    {Math.round(artifact.size / 1024)} KB
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                        <div className="mb-2 flex items-center">
                          <AlertCircle className="mr-3 h-6 w-6 text-rose-600" />
                          <span className="text-lg font-semibold text-rose-800">Unlearning Failed</span>
                        </div>
                        {whiteboxResults.error && (
                          <p className="text-sm text-rose-700">{whiteboxResults.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
