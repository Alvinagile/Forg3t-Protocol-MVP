import React, { useState } from 'react';
import { 
  FileSearch, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Eye,
  ExternalLink,
  Hash
} from 'lucide-react';

interface ProofRecord {
  id: string;
  proof_hash: string;
  model_id: string;
  submitter: string;
  validator: string;
  status: 'validated' | 'rejected' | 'pending';
  timestamp: string;
  blockchain_tx: string;
  ipfs_hash: string;
  leak_score: number;
}

const mockProofs: ProofRecord[] = [
  {
    id: 'proof_1234567890',
    proof_hash: 'zk_9f8e7d6c5b4a3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b',
    model_id: 'gpt-4-enterprise',
    submitter: 'user_abcdef123456',
    validator: 'validator_node_001',
    status: 'validated',
    timestamp: '2025-10-20T14:30:00Z',
    blockchain_tx: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    ipfs_hash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    leak_score: 0.03
  },
  {
    id: 'proof_0987654321',
    proof_hash: 'zk_1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    model_id: 'llama-3-enterprise',
    submitter: 'user_ghijkl789012',
    validator: 'validator_node_002',
    status: 'validated',
    timestamp: '2025-10-19T09:15:00Z',
    blockchain_tx: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    ipfs_hash: 'Qmabcdef1234567890abcdef1234567890abcdef1234567890',
    leak_score: 0.01
  },
  {
    id: 'proof_1357924680',
    proof_hash: 'zk_fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    model_id: 'claude-2-enterprise',
    submitter: 'user_mnopqr345678',
    validator: 'validator_node_003',
    status: 'rejected',
    timestamp: '2025-10-18T16:45:00Z',
    blockchain_tx: '',
    ipfs_hash: '',
    leak_score: 0.75
  },
  {
    id: 'proof_2468135790',
    proof_hash: 'zk_5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d',
    model_id: 'mistral-7b-enterprise',
    submitter: 'user_stuvwx901234',
    validator: 'validator_node_001',
    status: 'validated',
    timestamp: '2025-10-17T11:20:00Z',
    blockchain_tx: '0x5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3c2b1a0f9e8d7c6b5a4f',
    ipfs_hash: 'Qm5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d',
    leak_score: 0.02
  },
  {
    id: 'proof_9876543210',
    proof_hash: 'zk_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
    model_id: 'gpt-3.5-enterprise',
    submitter: 'user_yzabcd123456',
    validator: 'validator_node_002',
    status: 'pending',
    timestamp: '2025-10-16T13:45:00Z',
    blockchain_tx: '',
    ipfs_hash: '',
    leak_score: 0
  }
];

export function ProofExplorer() {
  const [proofs] = useState<ProofRecord[]>(mockProofs);
  const [filteredProofs, setFilteredProofs] = useState<ProofRecord[]>(mockProofs);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');

  const uniqueModels = Array.from(new Set(proofs.map(proof => proof.model_id)));

  React.useEffect(() => {
    let result = proofs;
    
    if (searchTerm) {
      result = result.filter(proof => 
        proof.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.proof_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.model_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.submitter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proof.validator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(proof => proof.status === statusFilter);
    }
    
    if (modelFilter !== 'all') {
      result = result.filter(proof => proof.model_id === modelFilter);
    }
    
    setFilteredProofs(result);
  }, [searchTerm, statusFilter, modelFilter, proofs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getLeakScoreBadgeColor = (score: number) => {
    if (score < 0.1) return 'bg-green-900/30 text-green-400';
    if (score < 0.3) return 'bg-yellow-900/30 text-yellow-400';
    return 'bg-red-900/30 text-red-400';
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
            Proof Explorer
          </h1>
          <p className="mt-1 text-gray-400">
            Browse and verify zk-SNARK proofs on the blockchain
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Proofs</p>
              <p className="text-2xl font-bold text-white">{proofs.length}</p>
            </div>
            <FileSearch className="h-8 w-8 text-[#60a5fa]" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Validated</p>
              <p className="text-2xl font-bold text-green-400">{proofs.filter(p => p.status === 'validated').length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{proofs.filter(p => p.status === 'rejected').length}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{proofs.filter(p => p.status === 'pending').length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search proofs..."
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
              <option value="validated">Validated</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-[#091024] text-white focus:outline-none focus:ring-[#60a5fa] focus:border-[#60a5fa]"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            >
              <option value="all">All Models</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setModelFilter('all');
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-[#091024] hover:bg-[#091024]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a5fa]"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Proof Records</h2>
        </div>

        <div className="overflow-x-auto">
          {filteredProofs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-500 mb-4">
                <FileSearch />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">No proofs found</h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Proof Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Submitter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Validator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Leak Score
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
                {filteredProofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-[#091024]/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-mono">
                        {proof.proof_hash.slice(0, 12)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {proof.model_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 font-mono">
                        {proof.submitter.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 font-mono">
                        {proof.validator.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLeakScoreBadgeColor(proof.leak_score)}`}>
                        {(proof.leak_score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(proof.status)}
                        <span className={`text-sm capitalize ${getStatusColor(proof.status)}`}>
                          {proof.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(proof.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex space-x-2">
                        <button
                          className="text-[#60a5fa] hover:text-[#60a5fa]/80"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {proof.blockchain_tx && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${proof.blockchain_tx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#60a5fa] hover:text-[#60a5fa]/80"
                            title="View on Blockchain"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                        {proof.ipfs_hash && (
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${proof.ipfs_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#60a5fa] hover:text-[#60a5fa]/80"
                            title="View on IPFS"
                          >
                            <Hash className="h-5 w-5" />
                          </a>
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

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-medium text-white mb-4">About Proof Verification</h3>
        <p className="text-gray-300 mb-4">
          All proofs listed above have been verified using zk-SNARK technology and recorded on the Stellar blockchain. 
          Each proof represents a cryptographic guarantee that specific information has been removed from an AI model.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#091024] p-4 rounded-lg">
            <h4 className="text-md font-medium text-white mb-2">Leak Score</h4>
            <p className="text-sm text-gray-400">
              Measures the probability that information can still be extracted from the model. 
              Lower scores indicate better unlearning effectiveness.
            </p>
          </div>
          <div className="bg-[#091024] p-4 rounded-lg">
            <h4 className="text-md font-medium text-white mb-2">Blockchain Verification</h4>
            <p className="text-sm text-gray-400">
              All validated proofs are recorded on the Stellar blockchain, creating an immutable 
              audit trail that can be independently verified.
            </p>
          </div>
          <div className="bg-[#091024] p-4 rounded-lg">
            <h4 className="text-md font-medium text-white mb-2">IPFS Storage</h4>
            <p className="text-sm text-gray-400">
              Detailed proof artifacts and certificates are stored on IPFS for decentralized 
              access and long-term preservation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}