import React, { useState } from 'react';
import { Brain, Shield, Upload, Download, Play, X, CheckCircle, AlertCircle, FileText, Key, Database, Bot, Zap } from 'lucide-react';
import { AssistantsSuppressionEngine, AssistantSuppressionResult } from '../lib/assistantsUnlearning';
import { PDFGenerator } from '../lib/pdfGenerator';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { ComplianceReport } from '../types';
import { DebugLogger } from '../lib/debug';

export function Unlearning() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'blackbox' | 'whitebox'>('blackbox');
  
  // Black-box states
  const [apiKey, setApiKey] = useState('');
  const [blackboxLoading, setBlackboxLoading] = useState(false);
  const [blackboxProgress, setBlackboxProgress] = useState({ percent: 0, message: '' });
  
  // Assistant API states (integrated into black-box)
  const [assistantId, setAssistantId] = useState('');
  const [targetText, setTargetText] = useState('');
  const [reason, setReason] = useState('');
  const [assistantResults, setAssistantResults] = useState<AssistantSuppressionResult | null>(null);

  // White-box states
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [whiteboxResults, setWhiteboxResults] = useState<any>(null);
  const [whiteboxLoading, setWhiteboxLoading] = useState(false);

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
      // Assistant API suppression
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
      
      // Save to database for dashboard
      if (results.success && user) {
        await saveAssistantSuppressionRequest(results);
        DebugLogger.log('Assistant suppression request saved to database');
      }
    } catch (error) {
      DebugLogger.error('Unlearning process failed', error);
      
      // Show user-friendly error message for API key issues
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

  const saveUnlearningRequest = async (results: UnlearningResult) => {
    try {
      // First ensure user profile exists
      const { data: existingUsers, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user?.id)
        .limit(1);
        
      if (!existingUsers || existingUsers.length === 0) {
        // User doesn't exist, create profile
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user?.id,
            email: user?.email || '',
            package_type: user?.user_metadata?.package_type || 'individual'
          });
          
        if (insertError) {
          DebugLogger.error('Failed to create user profile');
        }
      }
      
      // Generate mock blockchain and IPFS hashes
      const mockTxHash = "0x" + Math.random().toString(16).slice(2, 66);
      const mockIpfsHash = "Qm" + Math.random().toString(36).slice(2, 44);
      const mockZkProof = "proof_" + Math.random().toString(16).slice(2, 32);
      
      const { error } = await supabase
        .from('unlearning_requests')
        .insert({
          model_id: null, // Black-box doesn't need model_id
          requested_by: user?.id,
          request_reason: reason || targetInfo.slice(0, 100) + '...',
          data_count: results.totalTests,
          status: results.success ? 'completed' : 'failed',
          processing_time_seconds: results.processingTime || 480,
          blockchain_tx_hash: mockTxHash,
          audit_trail: {
            leak_score: results.leakScore,
            zk_proof: mockZkProof,
            ipfs_hash: mockIpfsHash,
            target_info: targetInfo,
            total_tests: results.totalTests,
            passed_tests: results.passedTests,
            failed_tests: results.failedTests
          }
        });
        
      if (error) {
        DebugLogger.error('Failed to save unlearning request');
      } else {
        DebugLogger.log('Unlearning request saved to dashboard');
      }
    } catch (error) {
      DebugLogger.error('Error saving unlearning request');
    }
  };

  const cancelBlackboxUnlearning = () => {
    const engine = new AssistantsSuppressionEngine(apiKey);
    engine.cancelOperation();
    setBlackboxLoading(false);
    setBlackboxProgress({ percent: 0, message: 'Cancelled by user' });
  };

  const downloadPDF = async (currentAssistantResults: AssistantSuppressionResult) => {
    if (!currentAssistantResults || !user) return;

    try {
      DebugLogger.log('Generating PDF and uploading to IPFS');
      
      // Create proper compliance report format
      const report: ComplianceReport = {
        user_id: user.id,
        request_id: crypto.randomUUID(),
        operation_type: 'AI Unlearning - Assistant Suppression',
        timestamp: new Date().toISOString(),
        zk_proof_hash: currentAssistantResults.assistantId || 'proof_' + Date.now().toString(16),
        bnb_tx_id: '0x' + Math.random().toString(16).slice(2, 66),
        ipfs_cid: 'Qm' + Math.random().toString(36).slice(2, 44),
        jurisdiction: 'EU' as const,
        regulatory_tags: ['GDPR Article 17', 'Right to be Forgotten', 'AI Transparency']
      };

      const additionalData = {
        modelIdentifier: `OpenAI Assistant (${currentAssistantResults.assistantId})`,
        leakScore: currentAssistantResults.leakScore || 0,
        unlearningType: 'Assistant Instruction Suppression',
        targetInfo: targetText || 'Confidential Information',
        // Don't pass detailed results to avoid showing prompts table in PDF
        result: {
          success: currentAssistantResults.success || false,
          leakScore: currentAssistantResults.leakScore || 0,
          totalTests: currentAssistantResults.totalTests || 0,
          passedTests: currentAssistantResults.passedTests || 0,
          failedTests: currentAssistantResults.failedTests || 0
          // Removed results array to hide detailed prompts in PDF
        }
      };

      const pdfBlob = PDFGenerator.generateComplianceCertificate(report, additionalData);
      
      // First download the PDF immediately
      PDFGenerator.downloadPDF(pdfBlob, `forg3t-certificate-${Date.now()}.pdf`);
      
      // Try to upload to IPFS in background (optional)
      try {
        DebugLogger.log('Uploading PDF to IPFS...');
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
            DebugLogger.log(`PDF uploaded to IPFS: ${DebugLogger.maskSensitive(ipfsCid)}`);
            
            // Update the saved request with the real IPFS CID
            await supabase
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
              
          } else {
          }
        } else {
        }
      } catch (ipfsError) {
        DebugLogger.warn('IPFS upload failed, but PDF was downloaded', ipfsError);
      }
      
    } catch (error) {
      DebugLogger.error('PDF generation/upload failed', error);
    }
  };

  const handleWhiteboxUnlearning = async () => {
    if (!modelFile) {
      alert('Please upload a model file');
      return;
    }

    setWhiteboxLoading(true);
    
    // Simulate white-box processing
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

  const saveAssistantSuppressionRequest = async (results: AssistantSuppressionResult) => {
    try {
      console.log('💾 Saving assistant suppression request...');
      
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
        console.error('💥 Failed to save request:', error.message);
      } else {
        console.log('✅ Request saved to dashboard');
      }
    } catch (error) {
      console.error('💥 Error saving request:', error);
    }
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
                {/* Model Upload */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Upload className="w-6 h-6 mr-2" />
                    Model Processing
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* HF Model Access */}
                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-4">
                        HF Model Access
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Select Model
                          </label>
                          <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]">
                            <option>google/gemma-2-2b</option>
                            <option>google/gemma-2-9b</option>
                            <option>meta-llama/Llama-2-7b</option>
                            <option>microsoft/DialoGPT-medium</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-4">
                        Upload Gemma Model
                      </h4>
                      
                      <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-[#60a5fa] transition-colors">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <input
                          type="file"
                          onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="model-upload"
                          accept=".safetensors,.bin,.pytorch"
                        />
                        <label
                          htmlFor="model-upload"
                          className="cursor-pointer text-[#60a5fa] hover:text-[#60a5fa]/80 font-semibold"
                        >
                          Click to upload model file
                        </label>
                        <p className="text-gray-400 text-sm mt-2">
                          Supports .safetensors, .bin, .pytorch files
                        </p>
                        {modelFile && (
                          <p className="text-green-400 mt-2">
                            ✓ {modelFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Process Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleWhiteboxUnlearning}
                    disabled={whiteboxLoading}
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

                {/* White-box Results */}
                {whiteboxResults && (
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                    <h3 className="text-xl font-bold text-white mb-4">Processing Results</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{(whiteboxResults.originalAccuracy * 100).toFixed(1)}%</div>
                        <div className="text-gray-400 text-sm">Original Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{(whiteboxResults.newAccuracy * 100).toFixed(1)}%</div>
                        <div className="text-gray-400 text-sm">New Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#60a5fa]">{whiteboxResults.targetDataRemoved.toLocaleString()}</div>
                        <div className="text-gray-400 text-sm">Data Points Removed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">{whiteboxResults.processingTime}s</div>
                        <div className="text-gray-400 text-sm">Processing Time</div>
                      </div>
                    </div>
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