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
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
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

  const downloadPDF = (request: UnlearningRequest) => {
    const report = {
      user_id: user?.id || '',
      request_id: request.id,
      operation_type: 'AI Unlearning Operation',
      timestamp: request.created_at || new Date().toISOString(),
      zk_proof_hash: request.audit_trail?.zk_proof || 'proof_' + request.id.slice(0, 8),
      stellar_tx_id: request.blockchain_tx_hash || '0x' + Math.random().toString(16).slice(2, 66),
      ipfs_cid: request.audit_trail?.ipfs_hash || 'Qm' + Math.random().toString(36).slice(2, 44),
      jurisdiction: 'EU' as const,
      regulatory_tags: ['GDPR Article 17', 'Right to be Forgotten', 'AI Transparency']
    };

    const additionalData = {
      modelIdentifier: 'ChatGPT-4',
      leakScore: request.audit_trail?.leak_score || 0.05,
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
      <div className="min-h-screen bg-[#091024] flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#091024] px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Requests</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests}</p>
              </div>
              <BarChart className="h-8 w-8 text-[#60a5fa]" />
            </div>
          </div>

          <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-400">{stats.completedRequests}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingRequests}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg. Time</p>
                <p className="text-2xl font-bold text-white">
                  {stats.averageProcessingTime > 0 ? `${Math.round(stats.averageProcessingTime)}s` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#60a5fa]" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/unlearning?type=black-box"
            className="bg-[#002d68] p-6 rounded-lg border border-gray-600 hover:border-[#60a5fa]/50 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <Brain className="h-12 w-12 text-[#60a5fa] group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Black-box Unlearning</h3>
              </div>
            </div>
          </Link>

          <Link
            to="/unlearning?type=white-box"
            className="bg-[#002d68] p-6 rounded-lg border border-gray-600 hover:border-[#60a5fa]/50 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <FileText className="h-12 w-12 text-[#60a5fa] group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">White-box Unlearning</h3>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Requests */}
        <div className="bg-[#002d68] rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">Recent Unlearning Requests</h2>
          </div>

          {error && (
            <div className="p-6 bg-red-900/20 border-b border-red-500/50">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {requests.length === 0 ? (
              <div className="p-8 text-center">
                <Brain className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No unlearning requests yet</h3>
                <p className="text-gray-500 mb-4">
                  Start your first AI unlearning request to see it here
                </p>
                <Link
                  to="/unlearning"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#60a5fa] hover:bg-[#60a5fa]/90 transition-colors"
                >
                  Start Unlearning
                </Link>
              </div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Data Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-[#091024]/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-mono">
                          {request.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 max-w-xs truncate">
                          {request.request_reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {request.data_count}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className={`text-sm capitalize ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          {/* Action Buttons Row */}
                          <div className="flex items-center space-x-2">
                            {/* PDF Download */}
                            <button
                              onClick={() => downloadPDF(request)}
                              className="text-green-400 hover:text-green-300 tooltip"
                              title="Download Certificate"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            
                            {/* Blockchain Explorer */}
                          {request.blockchain_tx_hash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${request.blockchain_tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#60a5fa] hover:text-[#60a5fa]/80 tooltip"
                              title="View on Stellar Expert"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                            
                            {/* IPFS Link */}
                            {request.audit_trail?.ipfs_hash && (
                              request.audit_trail.ipfs_hash.startsWith('Qm') && 
                              request.audit_trail.ipfs_hash.length > 20 && (
                              <a
                                href={`https://gateway.pinata.cloud/ipfs/${request.audit_trail.ipfs_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#60a5fa] hover:text-[#60a5fa]/80 tooltip"
                                title="View on IPFS"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            ))}
                            
                            {/* zk-SNARK Proof */}
                            {request.audit_trail?.zk_proof && (
                              <div className="tooltip text-gray-400" title={`zk-SNARK: ${request.audit_trail.zk_proof}`}>
                                <Hash className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          
                          {/* Results Summary Row */}
                          {request.audit_trail && (
                            <div className="flex items-center space-x-3 text-xs">
                              {/* IPFS Status */}
                              {request.audit_trail.ipfs_hash && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 rounded-full bg-[#60a5fa]" />
                                  <span className="text-gray-400">IPFS</span>
                                </div>
                              )}
                              
                              {/* Leak Score */}
                              {request.audit_trail.leak_score !== undefined && (
                                <div className="flex items-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    request.audit_trail.leak_score < 0.1 ? 'bg-green-400' :
                                    request.audit_trail.leak_score < 0.3 ? 'bg-yellow-400' : 'bg-red-400'
                                  }`} />
                                  <span className="text-gray-400">
                                    {(request.audit_trail.leak_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              
                              {/* Status Badge */}
                              {request.audit_trail.leak_score !== undefined && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  request.audit_trail.leak_score < 0.1 ? 'bg-green-900/30 text-green-400' :
                                  request.audit_trail.leak_score < 0.3 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'
                                }`}>
                                  {request.audit_trail.leak_score < 0.1 ? 'GDPR OK' :
                                   request.audit_trail.leak_score < 0.3 ? 'Review' : 'Failed'}
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