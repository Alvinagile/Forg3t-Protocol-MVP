import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  RefreshCw,
  Search,
  Filter,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Key,
  Hash,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ProofBundle {
  id: string;
  tenantId: string;
  projectId: string;
  jobId: string;
  type: string;
  inputHash: string;
  outputHash: string;
  evidence: Record<string, unknown>;
  createdAt: string;
  // New signature fields
  isSigned?: boolean;
  signature?: string;
  signingKeyId?: string;
  signatureAlg?: string;
  canonicalPayloadHash?: string;
}

interface VerificationResult {
  valid: boolean;
  signingKeyId?: string;
  algorithm?: string;
  canonicalPayloadHash?: string;
  error?: string;
  requestId?: string;
}

export function ProofBundles() {
  const { user } = useAuth();
  const [proofBundles, setProofBundles] = useState<ProofBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobIdFilter, setJobIdFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedBundle, setSelectedBundle] = useState<ProofBundle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  // Store API key in component state instead of localStorage
  const [apiKey, setApiKey] = useState<string | null>(null);

  const activeTenantId = localStorage.getItem('activeTenantId');

  useEffect(() => {
    const storedApiKey = localStorage.getItem('apiKey');
    setApiKey(storedApiKey);
  }, []);

  const fetchProofBundles = async () => {
    if (!user || !activeTenantId || !apiKey) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (jobIdFilter) {
        params.append('jobId', jobIdFilter);
      }
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      params.append('limit', '100');

      const response = await fetch(`/api/v1/proof-bundles/${activeTenantId}?${params.toString()}`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch proof bundles');
      }

      const data = await response.json();
      setProofBundles(data.items || []);
    } catch (err) {
      console.error('Error fetching proof bundles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proof bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchProofBundles();
  };

  const verifyProofBundle = async (bundleId: string, projectId: string) => {
    if (!apiKey) return;

    setVerifying(prev => ({ ...prev, [bundleId]: true }));

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/proof-bundles/${bundleId}/verify`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify proof bundle');
      }

      const result: VerificationResult = await response.json();
      setVerificationResults(prev => ({
        ...prev,
        [bundleId]: {
          ...result,
          requestId: response.headers.get('x-request-id') || undefined
        }
      }));
    } catch (err) {
      console.error('Error verifying proof bundle:', err);
      setVerificationResults(prev => ({
        ...prev,
        [bundleId]: {
          valid: false,
          error: err instanceof Error ? err.message : 'Failed to verify proof bundle'
        }
      }));
    } finally {
      setVerifying(prev => ({ ...prev, [bundleId]: false }));
    }
  };

  useEffect(() => {
    fetchProofBundles();
  }, [user, activeTenantId, apiKey, jobIdFilter, typeFilter]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateHash = (hash: string) => {
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const truncateKeyId = (keyId: string) => {
    if (!keyId) return 'N/A';
    if (keyId.length <= 12) return keyId;
    return `${keyId.substring(0, 6)}...${keyId.substring(keyId.length - 6)}`;
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-[#111111] sm:text-3xl sm:truncate">
            Proof Bundles
          </h1>
          <p className="mt-1 text-[#4B4B4B]">
            View cryptographic proof bundles for AI unlearning operations
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[#111111] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F80ED]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <label htmlFor="jobId" className="block text-sm font-medium text-[#111111] mb-1">
                Job ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="jobId"
                  placeholder="Filter by job ID..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-[#111111] placeholder-gray-400 focus:outline-none focus:ring-[#2F80ED] focus:border-[#2F80ED]"
                  value={jobIdFilter}
                  onChange={(e) => setJobIdFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1">
              <label htmlFor="type" className="block text-sm font-medium text-[#111111] mb-1">
                Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="type"
                  placeholder="Filter by type..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-[#111111] placeholder-gray-400 focus:outline-none focus:ring-[#2F80ED] focus:border-[#2F80ED]"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading proof bundles</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-6 flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F80ED]"></div>
        </div>
      )}

      {/* Proof Bundles Table */}
      {!loading && !error && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B4B4B] uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B4B4B] uppercase tracking-wider">
                    Job ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B4B4B] uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B4B4B] uppercase tracking-wider">
                    Input Hash
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B4B4B] uppercase tracking-wider">
                    Output Hash
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B4B4B] uppercase tracking-wider">
                    Signature Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B4B4B] uppercase tracking-wider">
                    Key ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B4B4B] uppercase tracking-wider">
                    Algorithm
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proofBundles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-[#4B4B4B]">
                      No proof bundles found
                    </td>
                  </tr>
                ) : (
                  proofBundles.map((bundle) => (
                    <tr key={bundle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111111]">
                        {formatDate(bundle.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2F80ED] font-mono">
                        {truncateHash(bundle.jobId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111111]">
                        {bundle.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2F80ED] font-mono">
                        {truncateHash(bundle.inputHash)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2F80ED] font-mono">
                        {truncateHash(bundle.outputHash)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111111]">
                        {bundle.isSigned ? (
                          <div className="flex items-center">
                            <ShieldCheck className="h-4 w-4 text-green-500 mr-1" />
                            <span>Signed</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <ShieldAlert className="h-4 w-4 text-yellow-500 mr-1" />
                            <span>Unsigned</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111111] font-mono">
                        {bundle.signingKeyId ? truncateKeyId(bundle.signingKeyId) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111111]">
                        {bundle.signatureAlg || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {bundle.isSigned && (
                            <button
                              onClick={() => verifyProofBundle(bundle.id, bundle.projectId)}
                              disabled={verifying[bundle.id]}
                              className="text-[#2F80ED] hover:text-[#2F80ED]/80 flex items-center"
                            >
                              {verifying[bundle.id] ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  <span>Verify</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedBundle(bundle);
                              setDrawerOpen(true);
                            }}
                            className="text-[#2F80ED] hover:text-[#2F80ED]/80"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {drawerOpen && selectedBundle && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setDrawerOpen(false)}
            ></div>
            <div className="fixed inset-y-0 right-0 max-w-full flex">
              <div className="relative w-screen max-w-2xl">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  <div className="flex-1 overflow-y-auto">
                    <div className="py-6 px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <h2 className="text-lg font-medium text-[#111111]">
                          Proof Bundle Details
                        </h2>
                        <div className="ml-3 h-7 flex items-center">
                          <button
                            type="button"
                            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setDrawerOpen(false)}
                          >
                            <span className="sr-only">Close panel</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="py-6 px-4 sm:px-6 space-y-6">
                        {/* Basic Info */}
                        <div>
                          <h3 className="text-md font-medium text-[#111111] mb-3">Basic Information</h3>
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-[#4B4B4B]">Bundle ID</dt>
                              <dd className="mt-1 text-sm text-[#111111] font-mono flex items-center">
                                {selectedBundle.id}
                                <button
                                  onClick={() => copyToClipboard(selectedBundle.id)}
                                  className="ml-2 text-[#2F80ED] hover:text-[#2F80ED]/80"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-[#4B4B4B]">Job ID</dt>
                              <dd className="mt-1 text-sm text-[#111111] font-mono flex items-center">
                                {selectedBundle.jobId}
                                <button
                                  onClick={() => copyToClipboard(selectedBundle.jobId)}
                                  className="ml-2 text-[#2F80ED] hover:text-[#2F80ED]/80"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-[#4B4B4B]">Type</dt>
                              <dd className="mt-1 text-sm text-[#111111]">{selectedBundle.type}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-[#4B4B4B]">Created At</dt>
                              <dd className="mt-1 text-sm text-[#111111]">{formatDate(selectedBundle.createdAt)}</dd>
                            </div>
                          </dl>
                        </div>

                        {/* Signature Information */}
                        <div>
                          <h3 className="text-md font-medium text-[#111111] mb-3">Signature Information</h3>
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-[#4B4B4B] flex items-center">
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Signature Status
                              </dt>
                              <dd className="mt-1 text-sm text-[#111111]">
                                {selectedBundle.isSigned ? (
                                  <div className="flex items-center">
                                    <ShieldCheck className="h-4 w-4 text-green-500 mr-1" />
                                    <span>Signed</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <ShieldAlert className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span>Unsigned</span>
                                  </div>
                                )}
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-[#4B4B4B] flex items-center">
                                <Key className="h-4 w-4 mr-1" />
                                Signing Key ID
                              </dt>
                              <dd className="mt-1 text-sm text-[#111111] font-mono flex items-center">
                                {selectedBundle.signingKeyId ? (
                                  <>
                                    {truncateKeyId(selectedBundle.signingKeyId)}
                                    <button
                                      onClick={() => copyToClipboard(selectedBundle.signingKeyId || '')}
                                      className="ml-2 text-[#2F80ED] hover:text-[#2F80ED]/80"
                                      title="Copy to clipboard"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : 'N/A'}
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-[#4B4B4B] flex items-center">
                                <Hash className="h-4 w-4 mr-1" />
                                Algorithm
                              </dt>
                              <dd className="mt-1 text-sm text-[#111111]">
                                {selectedBundle.signatureAlg || 'N/A'}
                              </dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-[#4B4B4B] flex items-center">
                                <Hash className="h-4 w-4 mr-1" />
                                Canonical Hash
                              </dt>
                              <dd className="mt-1 text-sm text-[#111111] font-mono flex items-center">
                                {selectedBundle.canonicalPayloadHash ? (
                                  <>
                                    {truncateHash(selectedBundle.canonicalPayloadHash)}
                                    <button
                                      onClick={() => copyToClipboard(selectedBundle.canonicalPayloadHash || '')}
                                      className="ml-2 text-[#2F80ED] hover:text-[#2F80ED]/80"
                                      title="Copy to clipboard"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : 'N/A'}
                              </dd>
                            </div>
                            {selectedBundle.signature && (
                              <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-[#4B4B4B] flex items-center">
                                  <ShieldCheck className="h-4 w-4 mr-1" />
                                  Signature
                                </dt>
                                <dd className="mt-1 text-sm text-[#111111] font-mono bg-gray-50 p-3 rounded-md break-all flex items-center">
                                  {selectedBundle.signature}
                                  <button
                                    onClick={() => copyToClipboard(selectedBundle.signature || '')}
                                    className="ml-2 text-[#2F80ED] hover:text-[#2F80ED]/80"
                                    title="Copy to clipboard"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </dd>
                              </div>
                            )}
                          </dl>

                          {/* Verification Section */}
                          {selectedBundle.isSigned && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-[#111111]">Verification</h4>
                                <button
                                  onClick={() => verifyProofBundle(selectedBundle.id, selectedBundle.projectId)}
                                  disabled={verifying[selectedBundle.id]}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[#111111] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F80ED]"
                                >
                                  {verifying[selectedBundle.id] ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                      Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Verify Now
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Verification Result */}
                              {verificationResults[selectedBundle.id] && (
                                <div className={`mt-3 p-3 rounded-md ${verificationResults[selectedBundle.id].valid
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                  }`}>
                                  <div className="flex items-start">
                                    {verificationResults[selectedBundle.id].valid ? (
                                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="ml-2">
                                      <h5 className="text-sm font-medium">
                                        {verificationResults[selectedBundle.id].valid ? 'Valid Signature' : 'Invalid Signature'}
                                      </h5>
                                      {verificationResults[selectedBundle.id].requestId && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Request ID: {verificationResults[selectedBundle.id].requestId}
                                        </p>
                                      )}
                                      {verificationResults[selectedBundle.id].error && (
                                        <p className="text-sm text-red-700 mt-1">
                                          {verificationResults[selectedBundle.id].error}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Hashes */}
                        <div>
                          <h3 className="text-md font-medium text-[#111111] mb-3">Hashes</h3>
                          <div className="space-y-4">
                            <div>
                              <dt className="text-sm font-medium text-[#4B4B4B] flex items-center">
                                Input Hash
                                <button
                                  onClick={() => copyToClipboard(selectedBundle.inputHash)}
                                  className="ml-2 text-[#2F80ED] hover:text-[#2F80ED]/80"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </dt>
                              <dd className="mt-1 text-sm text-[#111111] font-mono bg-gray-50 p-3 rounded-md break-all">
                                {selectedBundle.inputHash}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-[#4B4B4B] flex items-center">
                                Output Hash
                                <button
                                  onClick={() => copyToClipboard(selectedBundle.outputHash)}
                                  className="ml-2 text-[#2F80ED] hover:text-[#2F80ED]/80"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </dt>
                              <dd className="mt-1 text-sm text-[#111111] font-mono bg-gray-50 p-3 rounded-md break-all">
                                {selectedBundle.outputHash}
                              </dd>
                            </div>
                          </div>
                        </div>

                        {/* Evidence JSON */}
                        <div>
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleSection('evidence')}
                          >
                            <h3 className="text-md font-medium text-[#111111]">Evidence JSON</h3>
                            {expandedSections['evidence'] ?
                              <ChevronDown className="h-5 w-5 text-gray-400" /> :
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            }
                          </div>
                          {expandedSections['evidence'] && (
                            <div className="mt-2">
                              <div className="bg-gray-50 p-4 rounded-md">
                                <pre className="text-sm text-[#111111] overflow-x-auto max-h-96">
                                  {JSON.stringify(selectedBundle.evidence, null, 2)}
                                </pre>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => copyToClipboard(JSON.stringify(selectedBundle.evidence, null, 2))}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[#111111] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F80ED]"
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy JSON
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}