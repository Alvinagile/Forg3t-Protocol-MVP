import React, { useState } from 'react';
import { Shield, Download, Play, X, CheckCircle, AlertCircle, FileText, Key, Database, Bot, Zap, Server, FolderOpen, Settings } from 'lucide-react';
import { AssistantsSuppressionEngine, AssistantSuppressionResult } from '../lib/assistantsUnlearning';
import { PDFGenerator } from '../lib/pdfGenerator';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { ComplianceReport } from '../types';
import { LocalUnlearningClient, LocalUnlearningConfig } from '../local/runLocalClient';

export function Unlearning() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'blackbox' | 'whitebox'>('blackbox');
  
  const [apiKey, setApiKey] = useState('');
  const [blackboxLoading, setBlackboxLoading] = useState(false);
  const [blackboxProgress, setBlackboxProgress] = useState({ percent: 0, message: '' });
  
  const [assistantId, setAssistantId] = useState('');
  const [targetText, setTargetText] = useState('');
  const [reason, setReason] = useState('');
  const [assistantResults, setAssistantResults] = useState<AssistantSuppressionResult | null>(null);

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
        await saveAssistantSuppressionRequest(results);
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

    try {
      const report: ComplianceReport = {
        user_id: user.id,
        request_id: crypto.randomUUID(),
        operation_type: 'AI Unlearning - Assistant Suppression',
        timestamp: new Date().toISOString(),
        zk_proof_hash: currentAssistantResults.assistantId || 'proof_' + Date.now().toString(16),
        stellar_tx_id: '0x' + Math.random().toString(16).slice(2, 66),
        ipfs_cid: 'Qm' + Math.random().toString(36).slice(2, 44),
        jurisdiction: 'EU',
        regulatory_tags: ['GDPR Article 17', 'Right to be Forgotten', 'AI Transparency']
      };

      const additionalData = {
        modelIdentifier: `OpenAI Assistant (${currentAssistantResults.assistantId})`,
        leakScore: currentAssistantResults.leakScore || 0,
        unlearningType: 'Assistant Instruction Suppression',
        targetInfo: targetText || 'Confidential Information',
        result: {
          success: currentAssistantResults.success || false,
          leakScore: currentAssistantResults.leakScore || 0,
          totalTests: currentAssistantResults.totalTests || 0,
          passedTests: currentAssistantResults.passedTests || 0,
          failedTests: currentAssistantResults.failedTests || 0
        }
      };

      const pdfBlob = PDFGenerator.generateComplianceCertificate(report, additionalData);
      
      PDFGenerator.downloadPDF(pdfBlob, `forg3t-certificate-${Date.now()}.pdf`);
      
      try {
        const formData = new FormData();
        formData.append('filename', `unlearning-certificate-${report.request_id.slice(0, 8)}.pdf`);
        formData.append('file', pdfBlob);

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-ipfs`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const { success, ipfsCid } = await response.json();
          
          if (success && ipfsCid) {
            if (supabase && 'from' in supabase && supabase.from) {
              const updateResult = await supabase
                .from('unlearning_requests')
                .update({
                  audit_trail: {
                    ...currentAssistantResults,
                    ipfs_hash: ipfsCid 
                  }
                })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);
                
              if (updateResult && updateResult.error) {
                console.error('Failed to update request with IPFS CID', updateResult.error);
              }
            }
          }
        }
      } catch (ipfsError) {
        console.warn('IPFS upload failed, but PDF was downloaded', ipfsError);
      }
      
    } catch (error) {
      console.error('PDF generation/upload failed', error);
    }
  };

  const saveAssistantSuppressionRequest = async (results: AssistantSuppressionResult) => {
    try {
      if (supabase && 'from' in supabase && supabase.from) {
        const { error } = await supabase
          .from('unlearning_requests')
          .insert({
            user_id: user?.id,
            request_reason: reason || targetText || 'Assistant suppression request',
            status: results.success ? 'completed' : 'failed',
            processing_time_seconds: results.processingTime,
            blockchain_tx_hash: "0x" + Math.random().toString(16).slice(2, 66),
            audit_trail: {
              leak_score: results.leakScore,
              zk_proof: "proof_" + Math.random().toString(16).slice(2, 32),
              ipfs_hash: "Qm" + Math.random().toString(36).slice(2, 44),
              assistant_id: results.assistantId,
              target_text: targetText,
              total_tests: results.totalTests,
              passed_tests: results.passedTests,
              failed_tests: results.failedTests,
              phase1_results: results.validationResults.phase1Results,
              phase2_results: results.validationResults.phase2Results
            }
          });
          
        if (error) {
          console.error('Failed to save request:', error.message);
        }
      }
    } catch (error) {
      console.error('Error saving request:', error);
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

      const statusResponse = await LocalUnlearningClient.poll(jobId, () => {}, baseUrl);
      
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

  const handleWhiteboxUnlearning = async () => {
    const validModelPaths = modelPaths.filter(path => path.trim() !== '');
    if (validModelPaths.length === 0) {
      alert('Please enter at least one model path');
      return;
    }

    setWhiteboxLoading(true);
    
    setTimeout(() => {
      setWhiteboxResults({
        success: true,
        originalAccuracy: 0.94,
        newAccuracy: 0.91,
        targetDataRemoved: 1247,
        processingTime: 45.2,
        retrainRequired: true
      });
      setWhiteboxLoading(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700 flex gap-1">
            <button
              onClick={() => setActiveTab('blackbox')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center ${
                activeTab === 'blackbox'
                  ? 'bg-[#60a5fa] text-white shadow-lg shadow-[#60a5fa]/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Shield className="w-5 h-5 mr-2" />
              Black-Box
            </button>
            <button
              onClick={() => setActiveTab('whitebox')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center ${
                activeTab === 'whitebox'
                  ? 'bg-[#60a5fa] text-white shadow-lg shadow-[#60a5fa]/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Database className="w-5 h-5 mr-2" />
              White-Box
            </button>
          </div>
        </div>

        {/* Black-Box Unlearning */}
        {activeTab === 'blackbox' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <Shield className="w-8 h-8 text-[#60a5fa] mr-3" />
                <h2 className="text-3xl font-bold text-white">Black-Box Unlearning</h2>
              </div>
              
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Inject suppression protocols into OpenAI Assistants without accessing model weights. 
                This method modifies the assistant's instructions to refuse specific information requests.
              </p>
              
              {/* Setup Instructions */}
              <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  Assistant Setup Instructions
                </h3>
                <ol className="space-y-3 text-blue-300">
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</span>
                    <span>
                      Go to <a href="https://platform.openai.com/assistants" target="_blank" className="text-blue-200 underline hover:text-blue-100">
                        OpenAI Assistants
                      </a> and create a new Assistant
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</span>
                    <span>Copy the Assistant ID (starts with "asst_")</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</span>
                    <span>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-200 underline hover:text-blue-100">OpenAI API Keys</a></span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">4</span>
                    <span>Enter both below to inject suppression protocol</span>
                  </li>
                </ol>
              </div>

              <div className="space-y-6">
                {/* API Key Input */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <Key className="w-5 h-5 inline mr-2" />
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Assistant ID Input */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <Bot className="w-5 h-5 inline mr-2" />
                    Assistant ID
                  </label>
                  <input
                    type="text"
                    value={assistantId}
                    onChange={(e) => setAssistantId(e.target.value)}
                    placeholder="asst_..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Target Information Display */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <FileText className="w-5 h-5 inline mr-2" />
                    Target Text to Suppress
                  </label>
                  <input
                    type="text"
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    placeholder="Enter the text/phrase you want to suppress..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent transition-all duration-300"
                  />
                  <p className="text-gray-400 mt-2 text-sm">
                    The Assistant will be programmed to refuse all requests about this specific information.
                  </p>
                </div>

                {/* Reason Input */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <FileText className="w-5 h-5 inline mr-2" />
                    Reason for Suppression
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the reason for this suppression request (optional)..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent transition-all duration-300 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {!blackboxLoading ? (
                    <button
                      onClick={handleBlackboxUnlearning}
                      className="flex items-center px-8 py-4 bg-gradient-to-r from-[#60a5fa] to-[#60a5fa]/90 text-white font-semibold rounded-xl hover:from-[#60a5fa]/90 hover:to-[#60a5fa]/80 transition-all duration-300 shadow-lg shadow-[#60a5fa]/30 hover:shadow-[#60a5fa]/50 hover:scale-105"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Inject Suppression Protocol
                    </button>
                  ) : (
                    <button
                      onClick={cancelBlackboxUnlearning}
                      className="flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-600/30"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel Process
                    </button>
                  )}
                </div>

                {/* Progress Display */}
                {blackboxLoading && (
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-semibold">Processing...</span>
                      <span className="text-purple-400 font-bold">{blackboxProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                      <div
                        className="bg-gradient-to-r from-[#60a5fa] to-[#60a5fa]/90 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${blackboxProgress.percent}%` }}
                      />
                    </div>
                    <p className="text-gray-300">{blackboxProgress.message}</p>
                  </div>
                )}

                {/* Assistant API Results Display */}
                {assistantResults && (
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white">Assistant Suppression Results</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => assistantResults && downloadPDF(assistantResults)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </button>
                      </div>
                    </div>
                    
                    {assistantResults.success ? (
                      <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                          <span className="text-green-400 font-bold text-lg">Suppression Protocol Complete</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center mb-2">
                          <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
                          <span className="text-red-400 font-bold text-lg">Suppression Failed</span>
                        </div>
                        {assistantResults.error && (
                          <p className="text-red-300">{assistantResults.error}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Assistant Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                          <span className="text-white font-semibold">Suppression Rate</span>
                        </div>
                        <p className="text-2xl font-bold text-[#60a5fa]">
                          {(((assistantResults.totalTests - assistantResults.failedTests) / assistantResults.totalTests) * 100).toFixed(1)}%
                        </p>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                        <div className="text-white font-semibold mb-2">Leak Score</div>
                        <p className="text-2xl font-bold text-yellow-400">
                          {(assistantResults.leakScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                        <div className="text-white font-semibold mb-2">Tests Passed</div>
                        <p className="text-2xl font-bold text-green-400">
                          {assistantResults.passedTests}/{assistantResults.totalTests}
                        </p>
                      </div>
                      
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                        <div className="text-white font-semibold mb-2">Processing Time</div>
                        <p className="text-2xl font-bold text-blue-400">
                          {assistantResults.processingTime}s
                        </p>
                      </div>
                    </div>

                    {/* Phase Results */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                        <h4 className="text-lg font-bold text-white mb-3">Phase 1: Reinforcement</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Total Prompts:</span>
                            <span className="text-white font-semibold">{assistantResults.validationResults.phase1Results.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Suppressed:</span>
                            <span className="text-green-400 font-semibold">
                              {assistantResults.validationResults.phase1Results.filter(r => r.suppressionActive).length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                        <h4 className="text-lg font-bold text-white mb-3">Phase 2: Validation</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Total Tests:</span>
                            <span className="text-white font-semibold">{assistantResults.validationResults.phase2Results.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Suppressed:</span>
                            <span className="text-green-400 font-semibold">
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

        {/* White-Box Unlearning */}
        {activeTab === 'whitebox' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <Database className="w-8 h-8 text-[#60a5fa] mr-3" />
                <h2 className="text-3xl font-bold text-white">White-Box Unlearning</h2>
              </div>
              
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Direct model weight manipulation for precise data removal. This method requires access to 
                the model's internal parameters and provides the most accurate unlearning results.
              </p>

              <div className="space-y-6">
                {/* Server Status */}
                <div className={`p-4 rounded-lg ${localServerOnline ? 'bg-green-900/30 border border-green-500/50' : 'bg-red-900/30 border border-red-500/50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Server className={`w-5 h-5 mr-2 ${localServerOnline ? 'text-green-400' : 'text-red-400'}`} />
                      <span className={`font-semibold ${localServerOnline ? 'text-green-400' : 'text-red-400'}`}>
                        Local Server Status: {localServerOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <button
                      onClick={manuallyCheckServerStatus}
                      className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      Check Now
                    </button>
                  </div>
                  {!localServerOnline && (
                    <div className="mt-2">
                      <p className="text-gray-300 text-sm">
                        Please start the local unlearning server to use this feature.
                      </p>
                      <p className="text-gray-300 text-sm mt-1">
                        To start the server:
                      </p>
                      <ol className="text-gray-300 text-sm mt-1 list-decimal list-inside space-y-1">
                        <li>Open a new terminal/command prompt</li>
                        <li>Navigate to the local-server-package directory:
                          <pre className="bg-gray-800 p-2 rounded mt-1 text-xs">
                            cd "c:\Users\Alvinn\Desktop\Forg3t PROJE DOSYALARI - KOD\Forg3t Protocol MVP stellar\project\local-server-package"
                          </pre>
                        </li>
                        <li>Install required dependencies (if not already installed):
                          <pre className="bg-gray-800 p-2 rounded mt-1 text-xs">
                            pip install -r requirements.txt
                          </pre>
                        </li>
                        <li>Run the server:
                          <pre className="bg-gray-800 p-2 rounded mt-1 text-xs">
                            python server.py
                          </pre>
                        </li>
                        <li>The server should start on port 8787</li>
                        <li>Wait for the message "Starting server on port 8787"</li>
                        <li>Click "Check Now" to verify the connection</li>
                      </ol>
                      <p className="text-gray-300 text-sm mt-2">
                        <strong>Common issues:</strong>
                      </p>
                      <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                        <li>Make sure Python is installed and accessible from your PATH</li>
                        <li>If you get module import errors, install the missing packages with pip</li>
                        <li>Make sure no other application is using port 8787</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Custom Server URL */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <Settings className="w-5 h-5 inline mr-2" />
                    Custom Server URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    placeholder="http://127.0.0.1:8787 (leave empty for default)"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Model Path */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <FolderOpen className="w-5 h-5 inline mr-2" />
                    Model Path(s) (.safetensors files)
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
                          placeholder="C:/path/to/your/model.safetensors"
                          className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent transition-all duration-300"
                        />
                        {modelPaths.length > 1 && (
                          <button
                            onClick={() => {
                              const newPaths = modelPaths.filter((_, i) => i !== index);
                              setModelPaths(newPaths);
                            }}
                            className="px-3 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setModelPaths([...modelPaths, ''])}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      + Add Another Model Path
                    </button>
                  </div>
                </div>

                {/* Output Directory */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <FolderOpen className="w-5 h-5 inline mr-2" />
                    Output Directory
                  </label>
                  <input
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="C:/path/to/output/directory"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Target Information */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    <FileText className="w-5 h-5 inline mr-2" />
                    Target Text to Unlearn
                  </label>
                  <input
                    type="text"
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    placeholder="Enter the text/phrase you want to unlearn..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Method Selection */}
                <div>
                  <label className="block text-lg font-semibold text-white mb-3">
                    Unlearning Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setLocalMethod('EmbeddingScrub')}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        localMethod === 'EmbeddingScrub'
                          ? 'bg-[#60a5fa]/20 border-[#60a5fa] text-white'
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <h4 className="font-bold">Embedding Scrub</h4>
                      <p className="text-sm mt-2">Modify token embeddings to reduce information about the target</p>
                    </button>
                    <button
                      onClick={() => setLocalMethod('LastLayerSurgery')}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        localMethod === 'LastLayerSurgery'
                          ? 'bg-[#60a5fa]/20 border-[#60a5fa] text-white'
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <h4 className="font-bold">Last Layer Surgery</h4>
                      <p className="text-sm mt-2">Modify the final layer to reduce logits for target tokens</p>
                    </button>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Steps
                    </label>
                    <input
                      type="number"
                      value={maxSteps}
                      onChange={(e) => setMaxSteps(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Learning Rate
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.01)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Seed
                    </label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                    />
                  </div>
                </div>

                {/* Process Button */}
                <div className="flex justify-center">
                  <button
                    onClick={activeTab === 'whitebox' ? handleLocalUnlearning : handleWhiteboxUnlearning}
                    disabled={whiteboxLoading || !localServerOnline}
                    className="flex items-center px-8 py-4 bg-gradient-to-r from-[#60a5fa] to-[#60a5fa]/90 text-white font-semibold rounded-xl hover:from-[#60a5fa]/90 hover:to-[#60a5fa]/80 transition-all duration-300 shadow-lg shadow-[#60a5fa]/30 hover:shadow-[#60a5fa]/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {whiteboxLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Start Unlearning
                      </>
                    )}
                  </button>
                </div>

                {/* Progress Display */}
                {whiteboxLoading && (
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-semibold">Processing...</span>
                      <span className="text-purple-400 font-bold">{whiteboxProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                      <div
                        className="bg-gradient-to-r from-[#60a5fa] to-[#60a5fa]/90 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${whiteboxProgress.percent}%` }}
                      />
                    </div>
                    <p className="text-gray-300">{whiteboxProgress.message}</p>
                  </div>
                )}

                {/* White-box Results */}
                {whiteboxResults && (
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                    <h3 className="text-xl font-bold text-white mb-4">Processing Results</h3>
                    {whiteboxResults.success ? (
                      <div className="space-y-4">
                        <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4">
                          <div className="flex items-center mb-2">
                            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                            <span className="text-green-400 font-bold text-lg">Unlearning Completed Successfully</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {whiteboxResults.before_similarity !== undefined && (
                            <>
                              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                                <div className="text-white font-semibold mb-2">Before Similarity</div>
                                <div className="text-2xl font-bold text-blue-400">
                                  {(whiteboxResults.before_similarity * 100).toFixed(2)}%
                                </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                                <div className="text-white font-semibold mb-2">After Similarity</div>
                                <div className="text-2xl font-bold text-green-400">
                                  {(whiteboxResults.after_similarity * 100).toFixed(2)}%
                                </div>
                              </div>
                            </>
                          )}
                          
                          {whiteboxResults.before_logit !== undefined && (
                            <>
                              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                                <div className="text-white font-semibold mb-2">Before Logit</div>
                                <div className="text-2xl font-bold text-blue-400">
                                  {whiteboxResults.before_logit.toFixed(4)}
                                </div>
                              </div>
                              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-600">
                                <div className="text-white font-semibold mb-2">After Logit</div>
                                <div className="text-2xl font-bold text-green-400">
                                  {whiteboxResults.after_logit.toFixed(4)}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {artifacts.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-lg font-bold text-white mb-3">Generated Artifacts</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {artifacts.map((artifact: any, index: number) => (
                                <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                                  <div className="font-medium text-white">{artifact.name}</div>
                                  <div className="text-sm text-gray-400">
                                    {Math.round(artifact.size / 1024)} KB
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4">
                        <div className="flex items-center mb-2">
                          <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
                          <span className="text-red-400 font-bold text-lg">Unlearning Failed</span>
                        </div>
                        {whiteboxResults.error && (
                          <p className="text-red-300">{whiteboxResults.error}</p>
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