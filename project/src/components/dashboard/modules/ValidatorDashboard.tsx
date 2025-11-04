import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Coins,
  BarChart,
  Filter,
  Search,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface ProofValidation {
  id: string;
  proof_hash: string;
  model_id: string;
  submitter: string;
  status: 'pending' | 'validating' | 'validated' | 'rejected';
  reward_amount: number;
  submitted_at: string;
  validated_at: string | null;
  validator_node: string;
}

interface ValidatorStats {
  total_validated: number;
  success_rate: number;
  total_rewards: number;
  pending_validations: number;
  active_validators: number;
  avg_validation_time: number;
}

const mockValidations: ProofValidation[] = [
  {
    id: 'val_1234567890',
    proof_hash: 'zk_9f8e7d6c5b4a3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b',
    model_id: 'gpt-4-enterprise',
    submitter: 'user_abcdef123456',
    status: 'validated',
    reward_amount: 42.5,
    submitted_at: '2025-10-15T14:30:00Z',
    validated_at: '2025-10-15T14:32:15Z',
    validator_node: 'validator_node_001'
  },
  {
    id: 'val_0987654321',
    proof_hash: 'zk_1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    model_id: 'llama-3-enterprise',
    submitter: 'user_ghijkl789012',
    status: 'validating',
    reward_amount: 38.0,
    submitted_at: '2025-10-18T09:15:00Z',
    validated_at: null,
    validator_node: 'validator_node_001'
  },
  {
    id: 'val_1357924680',
    proof_hash: 'zk_fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    model_id: 'claude-2-enterprise',
    submitter: 'user_mnopqr345678',
    status: 'pending',
    reward_amount: 45.2,
    submitted_at: '2025-10-20T16:45:00Z',
    validated_at: null,
    validator_node: 'validator_node_001'
  },
  {
    id: 'val_2468135790',
    proof_hash: 'zk_5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d',
    model_id: 'mistral-7b-enterprise',
    submitter: 'user_stuvwx901234',
    status: 'rejected',
    reward_amount: 0,
    submitted_at: '2025-10-21T11:20:00Z',
    validated_at: '2025-10-21T11:22:30Z',
    validator_node: 'validator_node_001'
  }
];

const mockStats: ValidatorStats = {
  total_validated: 1247,
  success_rate: 98.7,
  total_rewards: 52834.6,
  pending_validations: 12,
  active_validators: 42,
  avg_validation_time: 127
};

export function ValidatorDashboard() {
  const [validations, setValidations] = useState<ProofValidation[]>(mockValidations);
  const [stats, setStats] = useState<ValidatorStats>(mockStats);
  const [filteredValidations, setFilteredValidations] = useState<ProofValidation[]>(mockValidations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isValidatorActive, setIsValidatorActive] = useState(true);

  useEffect(() => {
    let result = validations;
    
    if (searchTerm) {
      result = result.filter(validation => 
        validation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validation.proof_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validation.model_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        validation.submitter.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(validation => validation.status === statusFilter);
    }
    
    setFilteredValidations(result);
  }, [searchTerm, statusFilter, validations]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'validating':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
        return 'text-green-400';
      case 'validating':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const toggleValidatorStatus = () => {
    setIsValidatorActive(!isValidatorActive);
  };

  const processValidation = (id: string) => {
    setValidations(prev => prev.map(validation => 
      validation.id === id 
        ? { ...validation, status: 'validating' } 
        : validation
    ));
    
    setTimeout(() => {
      setValidations(prev => prev.map(validation => 
        validation.id === id 
          ? { 
              ...validation, 
              status: Math.random() > 0.1 ? 'validated' : 'rejected',
              validated_at: new Date().toISOString()
            } 
          : validation
      ));
      
      setStats(prev => {
        const validation = validations.find(v => v.id === id);
        if (!validation) return prev;
        
        const isSuccess = Math.random() > 0.1;
        const newTotalValidated = prev.total_validated + (isSuccess ? 1 : 0);
        const newSuccessRate = ((prev.total_validated + (isSuccess ? 1 : 0)) / (prev.total_validated + 1)) * 100;
        const newTotalRewards = prev.total_rewards + (isSuccess ? validation.reward_amount : 0);
        const newPendingValidations = prev.pending_validations - 1;
        
        return {
          ...prev,
          total_validated: newTotalValidated,
          success_rate: parseFloat(newSuccessRate.toFixed(1)),
          total_rewards: parseFloat(newTotalRewards.toFixed(1)),
          pending_validations: Math.max(0, newPendingValidations)
        };
      });
    }, 3000);
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
            Validator Dashboard
          </h1>
          <p className="mt-1 text-gray-400">
            Manage proof validations, staking, and rewards
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={toggleValidatorStatus}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isValidatorActive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a5fa]`}
          >
            {isValidatorActive ? (
              <>
                <Pause className="-ml-1 mr-2 h-5 w-5" />
                Pause Validator
              </>
            ) : (
              <>
                <Play className="-ml-1 mr-2 h-5 w-5" />
                Start Validator
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Validated</p>
              <p className="text-2xl font-bold text-white">{stats.total_validated}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">{stats.success_rate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-[#60a5fa]" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Rewards</p>
              <p className="text-2xl font-bold text-white">{stats.total_rewards.toFixed(2)} FGT</p>
            </div>
            <Coins className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Validator Node Status</h3>
            <p className="mt-1 text-sm text-gray-400">
              {isValidatorActive 
                ? 'Validator is actively processing proofs' 
                : 'Validator is paused'}
            </p>
          </div>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${isValidatorActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium text-white capitalize">
              {isValidatorActive ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#091024] p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Pending Validations</p>
            <p className="text-xl font-bold text-white">{stats.pending_validations}</p>
          </div>
          <div className="bg-[#091024] p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Active Validators</p>
            <p className="text-xl font-bold text-white">{stats.active_validators}</p>
          </div>
          <div className="bg-[#091024] p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Avg. Validation Time</p>
            <p className="text-xl font-bold text-white">{stats.avg_validation_time}s</p>
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
                placeholder="Search validations..."
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
                <option value="validating">Validating</option>
                <option value="validated">Validated</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Proof Validation Queue</h2>
        </div>

        <div className="overflow-x-auto">
          {filteredValidations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-500 mb-4">
                <Shield />
              </div>
              <h3 className="text-lg font-medium text-gray-400 mb-2">No validations found</h3>
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
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredValidations.map((validation) => (
                  <tr key={validation.id} className="hover:bg-[#091024]/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-mono">
                        {validation.proof_hash.slice(0, 12)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {validation.model_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 font-mono">
                        {validation.submitter.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {validation.reward_amount} FGT
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(validation.status)}
                        <span className={`text-sm capitalize ${getStatusColor(validation.status)}`}>
                          {validation.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {new Date(validation.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {validation.status === 'pending' && (
                          <button
                            onClick={() => processValidation(validation.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-[#60a5fa] hover:bg-[#60a5fa]/80 focus:outline-none"
                          >
                            <Play className="-ml-1 mr-1 h-4 w-4" />
                            Process
                          </button>
                        )}
                        {validation.status === 'rejected' && (
                          <button
                            onClick={() => processValidation(validation.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-[#60a5fa] hover:bg-[#60a5fa]/80 focus:outline-none"
                          >
                            <RotateCcw className="-ml-1 mr-1 h-4 w-4" />
                            Retry
                          </button>
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