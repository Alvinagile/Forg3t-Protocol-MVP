import React, { useState } from 'react';
import { 
  Coins, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Send,
  Plus,
  Filter,
  Search
} from 'lucide-react';

interface WalletBalance {
  token: string;
  balance: number;
  value_usd: number;
  change_24h: number;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'stake' | 'unstake' | 'reward';
  token: string;
  amount: number;
  value_usd: number;
  from: string;
  to: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

interface StakingInfo {
  total_staked: number;
  rewards_earned: number;
  apr: number;
  validator: string;
  unstaking: number;
}

const mockWalletBalances: WalletBalance[] = [
  {
    token: 'FGT',
    balance: 1250.75,
    value_usd: 2501.50,
    change_24h: 5.2
  },
  {
    token: 'XLM',
    balance: 5000.00,
    value_usd: 1250.00,
    change_24h: -1.3
  },
  {
    token: 'USDC',
    balance: 2500.00,
    value_usd: 2500.00,
    change_24h: 0.1
  }
];

const mockTransactions: Transaction[] = [
  {
    id: 'tx_1234567890',
    type: 'receive',
    token: 'FGT',
    amount: 42.5,
    value_usd: 85.00,
    from: 'validator_node_001',
    to: 'wallet_abcdef123456',
    timestamp: '2025-10-20T14:30:00Z',
    status: 'completed'
  },
  {
    id: 'tx_0987654321',
    type: 'stake',
    token: 'FGT',
    amount: 500.0,
    value_usd: 1000.00,
    from: 'wallet_abcdef123456',
    to: 'staking_contract',
    timestamp: '2025-10-19T09:15:00Z',
    status: 'completed'
  },
  {
    id: 'tx_1357924680',
    type: 'send',
    token: 'XLM',
    amount: 1000.0,
    value_usd: 250.00,
    from: 'wallet_abcdef123456',
    to: 'wallet_ghijkl789012',
    timestamp: '2025-10-18T16:45:00Z',
    status: 'completed'
  },
  {
    id: 'tx_2468135790',
    type: 'reward',
    token: 'FGT',
    amount: 12.75,
    value_usd: 25.50,
    from: 'validator_node_002',
    to: 'wallet_abcdef123456',
    timestamp: '2025-10-17T11:20:00Z',
    status: 'completed'
  }
];

const mockStakingInfo: StakingInfo = {
  total_staked: 1250.0,
  rewards_earned: 63.25,
  apr: 12.5,
  validator: 'validator_node_001',
  unstaking: 250.0
};

export function TokenDashboard() {
  const [walletBalances] = useState<WalletBalance[]>(mockWalletBalances);
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [stakingInfo] = useState<StakingInfo>(mockStakingInfo);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const totalValue = walletBalances.reduce((sum, wallet) => sum + wallet.value_usd, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUp className="h-4 w-4 text-red-400" />;
      case 'receive':
        return <ArrowDown className="h-4 w-4 text-green-400" />;
      case 'stake':
        return <Plus className="h-4 w-4 text-blue-400" />;
      case 'unstake':
        return <ArrowDown className="h-4 w-4 text-yellow-400" />;
      case 'reward':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      default:
        return <Coins className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'send':
        return 'text-red-400';
      case 'receive':
        return 'text-green-400';
      case 'stake':
        return 'text-blue-400';
      case 'unstake':
        return 'text-yellow-400';
      case 'reward':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'failed':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
            Token Dashboard
          </h1>
          <p className="mt-1 text-gray-400">
            Manage your wallet, staking, and token transactions
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#60a5fa] hover:bg-[#60a5fa]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a5fa]"
          >
            <Send className="-ml-1 mr-2 h-5 w-5" />
            Send Tokens
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Stake FGT
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-white">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <Wallet className="h-12 w-12 text-[#60a5fa]" />
        </div>
        
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {walletBalances.map((wallet) => (
            <div key={wallet.token} className="bg-[#091024] p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{wallet.token}</p>
                  <p className="text-xl font-bold text-white">{wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className={`flex items-center ${wallet.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {wallet.change_24h >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span className="text-sm font-medium">{Math.abs(wallet.change_24h).toFixed(2)}%</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-400">${wallet.value_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staking Information */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#002d68] rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">Staking Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#091024] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Staked</p>
                <p className="text-2xl font-bold text-white">{stakingInfo.total_staked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FGT</p>
                <p className="mt-1 text-sm text-gray-400">${(stakingInfo.total_staked * 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-[#091024] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Rewards Earned</p>
                <p className="text-2xl font-bold text-green-400">{stakingInfo.rewards_earned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FGT</p>
                <p className="mt-1 text-sm text-gray-400">${(stakingInfo.rewards_earned * 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-[#091024] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">APR</p>
                <p className="text-2xl font-bold text-white">{stakingInfo.apr}%</p>
                <p className="mt-1 text-sm text-gray-400">Validator: {stakingInfo.validator}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Staking Progress</span>
                <span className="text-gray-400 text-sm">{stakingInfo.total_staked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 10,000 FGT</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full" 
                  style={{ width: `${Math.min((stakingInfo.total_staked / 10000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            {stakingInfo.unstaking > 0 && (
              <div className="mt-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/50">
                <div className="flex justify-between">
                  <span className="text-yellow-400">Unstaking in progress</span>
                  <span className="text-yellow-400 font-medium">{stakingInfo.unstaking.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FGT</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#002d68] rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            <button className="w-full flex items-center justify-between p-4 bg-[#091024] rounded-lg hover:bg-[#091024]/80 transition-colors">
              <div className="flex items-center">
                <Plus className="h-5 w-5 text-green-400 mr-3" />
                <span className="text-white">Stake FGT</span>
              </div>
              <ArrowUp className="h-5 w-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-[#091024] rounded-lg hover:bg-[#091024]/80 transition-colors">
              <div className="flex items-center">
                <ArrowDown className="h-5 w-5 text-yellow-400 mr-3" />
                <span className="text-white">Unstake FGT</span>
              </div>
              <ArrowUp className="h-5 w-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-[#091024] rounded-lg hover:bg-[#091024]/80 transition-colors">
              <div className="flex items-center">
                <Send className="h-5 w-5 text-blue-400 mr-3" />
                <span className="text-white">Send Tokens</span>
              </div>
              <ArrowUp className="h-5 w-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-[#091024] rounded-lg hover:bg-[#091024]/80 transition-colors">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-400 mr-3" />
                <span className="text-white">View Rewards</span>
              </div>
              <ArrowUp className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-white">Transaction History</h2>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search transactions..."
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
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="send">Send</option>
                  <option value="receive">Receive</option>
                  <option value="stake">Stake</option>
                  <option value="unstake">Unstake</option>
                  <option value="reward">Reward</option>
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
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-[#091024]/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white font-mono">
                      {transaction.id.slice(0, 8)}...
                    </div>
                    <div className="text-sm text-gray-400">
                      {transaction.from === 'wallet_abcdef123456' ? 'To: ' : 'From: '}
                      {transaction.to === 'wallet_abcdef123456' ? transaction.from.slice(0, 8) : transaction.to.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(transaction.type)}
                      <span className={`ml-2 text-sm capitalize ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transaction.token}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    ${transaction.value_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}