import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Brain, FileText, Clock, CheckCircle, AlertCircle, ExternalLink, TrendingUp, Download, Eye, Hash, BarChart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
import { PDFGenerator } from '../lib/pdfGenerator';
// DebugLogger import removed - using console.log instead

interface UnlearningRequest {
  id: string;
  model_id: string;
  request_reason: string;
  request_date: string;
  data_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_time_seconds: number | null;
  blockchain_tx_hash: string | null;
  audit_trail: {
    leak_score?: number;
    zk_proof?: string;
    ipfs_hash?: string;
    simulated?: boolean;
    evidence_status?: 'pending' | 'complete' | 'incomplete' | 'invalid' | 'simulated' | 'blocked';
    proof_boundary?: string;
  } | null;
  created_at: string;
  user_id: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UnlearningRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-rose-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-700';
      case 'processing':
        return 'text-amber-700';
      case 'failed':
        return 'text-rose-700';
      default:
        return 'text-gray-400';
    }
  };

  const ensureUserProfileExists = useCallback(async () => {
    if (!user || !isSupabaseAvailable()) return;

    try {
      // Type guard to ensure supabase has the required methods
      if (!('from' in supabase) || typeof supabase.from !== 'function') {
        console.warn('⚠️ Supabase client not properly configured');
        return;
      }

      const { error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (selectError && selectError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            package_type: user.user_metadata?.package_type || 'individual'
          });
          
        if (insertError && insertError.code !== '23505') {
          console.warn('⚠️ Failed to create user profile:', insertError.message);
        } else {
          console.log('✅ User profile created in dashboard');
        }
      } else if (selectError) {
        console.warn('⚠️ Error checking user profile:', selectError.message);
      } else {
        console.log('✅ User profile already exists');
      }
    } catch (error) {
      console.warn('⚠️ Error checking user profile:', error);
    }
  }, [user]);

  const fetchUnlearningRequests = useCallback(async () => {
    if (!user || !isSupabaseAvailable()) return;

    try {
      // Type guard to ensure supabase has the required methods
      if (!('from' in supabase) || typeof supabase.from !== 'function') {
        console.warn('⚠️ Supabase client not properly configured');
        return;
      }

      console.log('📊 Fetching unlearning requests for user:', user.id);
      
      const { data, error } = await supabase
        .from('unlearning_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('✅ Fetched', data?.length || 0, 'unlearning requests');
      setRequests(data || []);
    } catch (err) {
      console.error('💥 Failed to fetch requests:', err);
      setError('Failed to load unlearning requests');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    ensureUserProfileExists();
    fetchUnlearningRequests();

    // Only subscribe if user exists and Supabase is properly configured
    if (user?.id && isSupabaseAvailable()) {
      // Type guard to ensure supabase has the channel method
      if ('channel' in supabase && typeof supabase.channel === 'function') {
        const subscription = supabase
          .channel('unlearning_requests_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'unlearning_requests',
              filter: `requested_by=eq.${user.id}`
            },
            () => {
              console.log('Real-time database update received');
              fetchUnlearningRequests();
            }
          )
          .subscribe();

        return () => {
          console.log('Unsubscribing from real-time updates');
          subscription.unsubscribe();
        };
      }
    }
  }, [user, ensureUserProfileExists, fetchUnlearningRequests]);

  const verifyEvidenceReadiness = async (request: UnlearningRequest): Promise<{ ok: boolean; reason?: string }> => {
    if (request.status !== 'completed') {
      return { ok: false, reason: 'Request is not completed.' };
    }

    if (request.audit_trail?.simulated || request.audit_trail?.evidence_status === 'simulated') {
      return { ok: false, reason: 'Simulated evidence cannot be exported as compliance certificate.' };
    }

    if (!isSupabaseAvailable()) {
      return { ok: false, reason: 'Supabase is not configured for proof verification.' };
    }

    try {
      const supabaseAny = supabase as unknown as {
        functions?: {
          invoke?: (
            fn: string,
            args?: { body?: unknown }
          ) => Promise<{ data?: any; error?: { message?: string } }>;
        };
      };
      const invoke = supabaseAny.functions?.invoke;
      if (typeof invoke !== 'function') {
        return { ok: false, reason: 'Proof verification endpoint is unavailable.' };
      }

      const { data, error } = await invoke('proof', { body: { requestId: request.id } });
      if (error) {
        return { ok: false, reason: `Proof verification failed: ${error.message || 'unknown error'}` };
      }
      if (!data?.success) {
        return { ok: false, reason: data?.error || 'Proof verification returned unsuccessful result.' };
      }
      if (data?.evidence_status !== 'complete') {
        return { ok: false, reason: `Evidence status is ${data?.evidence_status || 'unknown'}, not complete.` };
      }
      if (data?.proof_boundary && data.proof_boundary !== 'suppression verified') {
        return { ok: false, reason: `Proof boundary ${data.proof_boundary} is not eligible for certificate export.` };
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'Unknown proof verification error.'
      };
    }
  };

  const downloadPDF = async (request: UnlearningRequest) => {
    const proofCheck = await verifyEvidenceReadiness(request);
    if (!proofCheck.ok) {
      alert(`Compliance certificate blocked: ${proofCheck.reason}`);
      return;
    }

    const missingFields: string[] = [];
    if (!request.audit_trail?.zk_proof) missingFields.push('zk_proof_hash');
    if (!request.blockchain_tx_hash) missingFields.push('stellar_tx_id');
    if (!request.audit_trail?.ipfs_hash) missingFields.push('ipfs_cid');
    if (request.audit_trail?.leak_score === undefined) missingFields.push('leak_score');

    if (missingFields.length > 0) {
      alert(
        `Compliance certificate blocked: evidence is incomplete.\nMissing: ${missingFields.join(', ')}`
      );
      return;
    }

    const report = {
      user_id: user?.id || '',
      request_id: request.id,
      operation_type: 'AI Unlearning Operation',
      timestamp: request.created_at || new Date().toISOString(),
      zk_proof_hash: request.audit_trail.zk_proof,
      stellar_tx_id: request.blockchain_tx_hash,
      ipfs_cid: request.audit_trail.ipfs_hash,
      jurisdiction: 'EU' as const,
      regulatory_tags: ['GDPR Article 17', 'Right to be Forgotten', 'AI Transparency']
    };

    const additionalData = {
      modelIdentifier: 'ChatGPT-4',
      leakScore: request.audit_trail.leak_score,
      unlearningType: 'Black-box Adversarial Testing',
      targetInfo: 'Confidential Information'
    };

    const pdfDataUri = PDFGenerator.generateComplianceCertificate(report, additionalData);
    PDFGenerator.downloadPDF(pdfDataUri, `unlearning-certificate-${request.id.slice(0, 8)}.pdf`);
  };

  const stats = {
    totalRequests: requests.length,
    completedRequests: requests.filter(r => r.status === 'completed').length,
    pendingRequests: requests.filter(r => r.status === 'pending' || r.status === 'processing').length,
    averageProcessingTime: requests
      .filter(r => r.processing_time_seconds)
      .reduce((acc, r) => acc + (r.processing_time_seconds || 0), 0) / 
      Math.max(requests.filter(r => r.processing_time_seconds).length, 1)
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Requests</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.totalRequests}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3">
                <BarChart className="h-6 w-6 text-slate-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">{stats.completedRequests}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="mt-2 text-3xl font-semibold text-amber-700">{stats.pendingRequests}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg. Time</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {stats.averageProcessingTime > 0 ? `${Math.round(stats.averageProcessingTime)}s` : 'N/A'}
                </p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3">
                <TrendingUp className="h-6 w-6 text-sky-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            to="/unlearning?type=blackbox"
            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors hover:border-sky-300"
          >
            <div className="flex items-center space-x-4">
              <Brain className="h-12 w-12 text-sky-600 transition-transform group-hover:scale-105" />
              <div>
                <h3 className="mb-2 text-xl font-semibold text-slate-950">Suppression</h3>
                <p className="text-sm text-slate-600">
                  Suppression without model access
                </p>
              </div>
            </div>
          </Link>

          <div className="relative rounded-xl border border-slate-200 bg-white p-6 opacity-60 shadow-sm">
            <div className="absolute right-4 top-4">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Coming Soon
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <FileText className="h-12 w-12 text-slate-400" />
              <div>
                <h3 className="mb-2 text-xl font-semibold text-slate-400">White-box Unlearning</h3>
                <p className="text-sm text-slate-400">
                  Direct model weight manipulation
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-950">Recent Suppression Requests</h2>
          </div>

          {error && (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span className="text-sm text-rose-700">{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {requests.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <Brain className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900">No suppression requests yet</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Start your first black-box suppression run to populate this workspace.
                </p>
                <Link
                  to="/unlearning?type=blackbox"
                  className="mt-5 inline-flex items-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                >
                  Start Suppression
                </Link>
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Request</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Data Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-mono text-sm text-slate-900">{request.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-sm text-slate-600">{request.request_reason}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-slate-900">{request.data_count}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className={`text-sm capitalize ${getStatusColor(request.status)}`}>{request.status}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-slate-500">{new Date(request.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => downloadPDF(request)}
                              className="text-emerald-600 transition-colors hover:text-emerald-700"
                              title="Download Certificate"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                            {request.blockchain_tx_hash && (
                              <a
                                href={`https://stellar.expert/explorer/testnet/tx/${request.blockchain_tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 transition-colors hover:text-sky-700"
                                title="View on Stellar Expert"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}

                            {request.audit_trail?.ipfs_hash &&
                              request.audit_trail.ipfs_hash.startsWith('Qm') &&
                              request.audit_trail.ipfs_hash.length > 20 && (
                                <a
                                  href={`https://gateway.pinata.cloud/ipfs/${request.audit_trail.ipfs_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-600 transition-colors hover:text-sky-700"
                                  title="View on IPFS"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              )}

                            {request.audit_trail?.zk_proof && (
                              <div className="text-slate-400" title={`zk-SNARK: ${request.audit_trail.zk_proof}`}>
                                <Hash className="h-4 w-4" />
                              </div>
                            )}
                          </div>

                          {request.audit_trail && (
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              {request.audit_trail.ipfs_hash && (
                                <div className="flex items-center space-x-1">
                                  <div className="h-2 w-2 rounded-full bg-sky-500" />
                                  <span className="text-slate-500">IPFS</span>
                                </div>
                              )}

                              {request.audit_trail.leak_score !== undefined && (
                                <div className="flex items-center space-x-1">
                                  <div
                                    className={`h-2 w-2 rounded-full ${
                                      request.audit_trail.leak_score < 0.1
                                        ? 'bg-emerald-500'
                                        : request.audit_trail.leak_score < 0.3
                                          ? 'bg-amber-500'
                                          : 'bg-rose-500'
                                    }`}
                                  />
                                  <span className="text-slate-500">
                                    {(request.audit_trail.leak_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}

                              {request.audit_trail.leak_score !== undefined && (
                                <span
                                  className={`rounded-full px-2 py-1 font-medium ${
                                    request.audit_trail.leak_score < 0.1
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : request.audit_trail.leak_score < 0.3
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-rose-50 text-rose-700'
                                  }`}
                                >
                                  {request.audit_trail.leak_score < 0.1
                                    ? 'Export ready'
                                    : request.audit_trail.leak_score < 0.3
                                      ? 'Needs review'
                                      : 'Failed'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
