import React, { useState } from 'react';
import { 
  Building, 
  BarChart, 
  TrendingUp, 
  Coins,
  Download,
  Plus,
  Settings,
  Filter,
  Search,
  Play,
  Eye
} from 'lucide-react';
import { PDFGenerator } from '../../../lib/pdfGenerator';

interface ModelIntegration {
  id: string;
  name: string;
  type: 'OpenAI' | 'Anthropic' | 'HuggingFace' | 'Custom';
  status: 'active' | 'inactive' | 'error';
  last_sync: string;
  data_points: number;
  unlearning_operations: number;
}

interface TokenUsage {
  date: string;
  tokens_used: number;
  cost: number;
  operations: number;
}

interface AuditCertificate {
  id: string;
  model_id: string;
  request_id: string;
  generated_at: string;
  status: 'completed' | 'pending' | 'failed';
  ipfs_hash: string;
}

const mockIntegrations: ModelIntegration[] = [
  {
    id: 'int_1234567890',
    name: 'GPT-4 Enterprise',
    type: 'OpenAI',
    status: 'active',
    last_sync: '2025-10-20T14:30:00Z',
    data_points: 1247,
    unlearning_operations: 32
  },
  {
    id: 'int_0987654321',
    name: 'Claude 2 Enterprise',
    type: 'Anthropic',
    status: 'active',
    last_sync: '2025-10-19T09:15:00Z',
    data_points: 842,
    unlearning_operations: 18
  },
  {
    id: 'int_1357924680',
    name: 'Llama 3 Enterprise',
    type: 'HuggingFace',
    status: 'inactive',
    last_sync: '2025-10-18T16:45:00Z',
    data_points: 0,
    unlearning_operations: 0
  },
  {
    id: 'int_2468135790',
    name: 'Custom Model API',
    type: 'Custom',
    status: 'error',
    last_sync: '2025-10-20T11:20:00Z',
    data_points: 563,
    unlearning_operations: 7
  }
];

const mockTokenUsage: TokenUsage[] = [
  { date: '2025-10-15', tokens_used: 125000, cost: 12.50, operations: 5 },
  { date: '2025-10-16', tokens_used: 98000, cost: 9.80, operations: 3 },
  { date: '2025-10-17', tokens_used: 156000, cost: 15.60, operations: 7 },
  { date: '2025-10-18', tokens_used: 75000, cost: 7.50, operations: 2 },
  { date: '2025-10-19', tokens_used: 210000, cost: 21.00, operations: 9 },
  { date: '2025-10-20', tokens_used: 187000, cost: 18.70, operations: 8 }
];

const mockCertificates: AuditCertificate[] = [
  {
    id: 'cert_1234567890',
    model_id: 'gpt-4-enterprise',
    request_id: 'req_abcdef123456',
    generated_at: '2025-10-20T14:30:00Z',
    status: 'completed',
    ipfs_hash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
  },
  {
    id: 'cert_0987654321',
    model_id: 'claude-2-enterprise',
    request_id: 'req_ghijkl789012',
    generated_at: '2025-10-19T09:15:00Z',
    status: 'completed',
    ipfs_hash: 'Qmabcdef1234567890abcdef1234567890abcdef1234567890'
  },
  {
    id: 'cert_1357924680',
    model_id: 'llama-3-enterprise',
    request_id: 'req_mnopqr345678',
    generated_at: '2025-10-18T16:45:00Z',
    status: 'pending',
    ipfs_hash: ''
  }
];

export function EnterpriseDashboard() {
  const [integrations] = useState<ModelIntegration[]>(mockIntegrations);
  const [tokenUsage] = useState<TokenUsage[]>(mockTokenUsage);
  const [certificates] = useState<AuditCertificate[]>(mockCertificates);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const totalDataPoints = integrations.reduce((sum, integration) => sum + integration.data_points, 0);
  const totalOperations = integrations.reduce((sum, integration) => sum + integration.unlearning_operations, 0);
  const totalTokens = tokenUsage.reduce((sum, usage) => sum + usage.tokens_used, 0);
  const totalCost = tokenUsage.reduce((sum, usage) => sum + usage.cost, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'inactive':
        return 'text-gray-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-400';
      case 'inactive':
        return 'bg-gray-900/30 text-gray-400';
      case 'error':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  const downloadCertificate = (certificate: AuditCertificate) => {
    const report = {
      user_id: 'user_enterprise',
      request_id: certificate.request_id,
      operation_type: 'AI Unlearning Operation',
      timestamp: certificate.generated_at,
      zk_proof_hash: 'zk_' + certificate.id.slice(0, 64),
      bnb_tx_id: '0x' + Math.random().toString(16).slice(2, 66),
      ipfs_cid: certificate.ipfs_hash || 'Qm' + Math.random().toString(36).slice(2, 44),
      jurisdiction: 'EU' as const,
      regulatory_tags: ['GDPR Article 17', 'Right to be Forgotten', 'AI Transparency']
    };

    const additionalData = {
      modelIdentifier: certificate.model_id,
      leakScore: Math.random() * 0.1,
      unlearningType: 'Enterprise API Integration',
      targetInfo: 'Enterprise Data Removal'
    };

    try {
      const blob = PDFGenerator.generateComplianceCertificate(report, additionalData);
      PDFGenerator.downloadPDF(blob, `audit-certificate-${certificate.id.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const viewCertificate = (certificate: AuditCertificate) => {
    alert(`Viewing certificate for ${certificate.model_id}\nRequest ID: ${certificate.request_id}\nStatus: ${certificate.status}`);
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
            Enterprise Dashboard
          </h1>
          <p className="mt-1 text-gray-400">
            Manage model integrations, token usage, and audit certificates
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#60a5fa] hover:bg-[#60a5fa]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a5fa]"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Integration
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Data Points</p>
              <p className="text-2xl font-bold text-white">{totalDataPoints.toLocaleString()}</p>
            </div>
            <BarChart className="h-8 w-8 text-[#60a5fa]" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unlearning Operations</p>
              <p className="text-2xl font-bold text-white">{totalOperations}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tokens Used (30d)</p>
              <p className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</p>
            </div>
            <Coins className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Cost (30d)</p>
              <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
            </div>
            <Coins className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-white">Model Integrations</h2>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search integrations..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Data Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Operations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {integrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-[#091024]/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{integration.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{integration.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(integration.status)}`}>
                      {integration.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {integration.data_points.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {integration.unlearning_operations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(integration.last_sync).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <button className="text-[#60a5fa] hover:text-[#60a5fa]/80">
                      <Settings className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#002d68] rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">Token Usage (Last 7 Days)</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {tokenUsage.slice(-7).map((usage, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>{new Date(usage.date).toLocaleDateString()}</span>
                    <span>{usage.tokens_used.toLocaleString()} tokens</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-[#60a5fa] h-2 rounded-full" 
                      style={{ width: `${(usage.tokens_used / Math.max(...tokenUsage.map(u => u.tokens_used))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#002d68] rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">Recent Audit Certificates</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {certificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-[#091024]/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {certificate.model_id}
                      </div>
                      <div className="text-sm text-gray-400 font-mono">
                        {certificate.request_id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(certificate.generated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        certificate.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                        certificate.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {certificate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewCertificate(certificate)}
                          className="text-[#60a5fa] hover:text-[#60a5fa]/80"
                          title="View Certificate"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {certificate.status === 'completed' && (
                          <button
                            onClick={() => downloadCertificate(certificate)}
                            className="text-green-400 hover:text-green-300"
                            title="Download Certificate"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}