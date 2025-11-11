import { useState, useEffect } from 'react';
import { 
  BarChart, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  Eye, 
  ExternalLink, 
  Hash,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { PDFGenerator } from '../../../lib/pdfGenerator';

interface ComplianceRequest {
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

const mockRequests: ComplianceRequest[] = [
  {
    id: 'req_1234567890',
    model_id: 'gpt-4-enterprise',
    request_reason: 'Employee departure - PII removal',
    request_date: '2025-10-15',
    data_count: 42,
    status: 'completed',
    processing_time_seconds: 187,
    blockchain_tx_hash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    audit_trail: {
      leak_score: 0.03,
      zk_proof: 'zk_9f8e7d6c5b4a3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b',
      ipfs_hash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
    },
    created_at: '2025-10-15T14:30:00Z',
    user_id: 'user_abcdef123456'
  },
  {
    id: 'req_0987654321',
    model_id: 'llama-3-enterprise',
    request_reason: 'GDPR request - Customer data removal',
    request_date: '2025-10-18',
    data_count: 15,
    status: 'processing',
    processing_time_seconds: null,
    blockchain_tx_hash: null,
    audit_trail: {
      leak_score: undefined,
      zk_proof: undefined,
      ipfs_hash: undefined
    },
    created_at: '2025-10-18T09:15:00Z',
    user_id: 'user_abcdef123456'
  },
  {
    id: 'req_1357924680',
    model_id: 'claude-2-enterprise',
    request_reason: 'Contract termination - Proprietary info',
    request_date: '2025-10-20',
    data_count: 7,
    status: 'failed',
    processing_time_seconds: 45,
    blockchain_tx_hash: null,
    audit_trail: {
      leak_score: 0.75,
      zk_proof: undefined,
      ipfs_hash: undefined
    },
    created_at: '2025-10-20T16:45:00Z',
    user_id: 'user_abcdef123456'
  }
];

export function ComplianceDashboard() {
  const [filteredRequests, setFilteredRequests] = useState<ComplianceRequest[]>(mockRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const stats = {
    totalRequests: mockRequests.length,
    completedRequests: mockRequests.filter(r => r.status === 'completed').length,
    pendingRequests: mockRequests.filter(r => r.status === 'pending' || r.status === 'processing').length,
    averageProcessingTime: mockRequests
      .filter(r => r.processing_time_seconds)
      .reduce((acc, r) => acc + (r.processing_time_seconds || 0), 0) / 
      Math.max(mockRequests.filter(r => r.processing_time_seconds).length, 1)
  };

  useEffect(() => {
    let result = mockRequests;
    
    if (searchTerm) {
      result = result.filter(request => 
        request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.model_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.request_reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(request => request.status === statusFilter);
    }
    
    setFilteredRequests(result);
  }, [searchTerm, statusFilter]);

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

  const downloadPDF = (request: ComplianceRequest) => {
    const report = {
      user_id: request.user_id,
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
      modelIdentifier: request.model_id,
      leakScore: request.audit_trail?.leak_score || 0.05,
      unlearningType: 'Black-box Adversarial Testing',
      targetInfo: request.request_reason
    };

    try {
      const blob = PDFGenerator.generateComplianceCertificate(report, additionalData);
      PDFGenerator.downloadPDF(blob, `unlearning-certificate-${request.id.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
            Compliance Dashboard
          </h1>
          <p className="mt-1 text-gray-400">
            Monitor your AI unlearning requests and compliance status
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search requests..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-[#091024] text-white placeholder-gray-400 focus:outline-none focus:ring-[#60a5fa] focus:border-[#60a5fa]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-[#091024] text-white focus:outline-none focus:ring-[#60a5fa] focus:border-[#60a5fa]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Recent Unlearning Requests</h2>
        </div>

        <div className="overflow-x-auto">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-500 mb-4">
                <BarChart />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">No requests found</h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Model
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
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-[#091024]/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-mono">
                        {request.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {request.model_id}
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadPDF(request)}
                            className="text-green-400 hover:text-green-300"
                            title="Download Certificate"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          
                          {request.blockchain_tx_hash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${request.blockchain_tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#60a5fa] hover:text-[#60a5fa]/80"
                              title="View on Stellar Expert"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          
                          {request.audit_trail?.ipfs_hash && (
                            <a
                              href={`https://gateway.pinata.cloud/ipfs/${request.audit_trail.ipfs_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#60a5fa] hover:text-[#60a5fa]/80"
                              title="View on IPFS"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          )}
                          
                          {request.audit_trail?.zk_proof && (
                            <div className="text-gray-400" title={`zk-SNARK: ${request.audit_trail.zk_proof}`}>
                              <Hash className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        
                        {request.audit_trail && (
                          <div className="flex items-center space-x-3 text-xs">
                            {request.audit_trail.ipfs_hash && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-[#60a5fa]" />
                                <span className="text-gray-400">IPFS</span>
                              </div>
                            )}
                            
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
  );
}