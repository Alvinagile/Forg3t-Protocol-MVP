import React, { useState } from 'react';
import { 
  Code, 
  Key, 
  Webhook, 
  BarChart, 
  Copy, 
  Eye, 
  Filter,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used: string | null;
  permissions: string[];
  status: 'active' | 'disabled';
}

interface WebhookLog {
  id: string;
  event_type: string;
  url: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  response_code: number | null;
  payload_size: number;
}

interface SdkDocumentation {
  id: string;
  name: string;
  version: string;
  language: string;
  downloads: number;
  last_updated: string;
}

const mockApiKeys: ApiKey[] = [
  {
    id: 'key_1234567890',
    name: 'Production API Key',
    key: 'fgt_prod_abcdefghijklmnopqrstuvwxyz123456',
    created_at: '2025-10-15T14:30:00Z',
    last_used: '2025-10-20T09:15:00Z',
    permissions: ['read', 'write', 'unlearn'],
    status: 'active'
  },
  {
    id: 'key_0987654321',
    name: 'Development API Key',
    key: 'fgt_dev_abcdefghijklmnopqrstuvwxyz789012',
    created_at: '2025-10-10T09:15:00Z',
    last_used: '2025-10-19T16:45:00Z',
    permissions: ['read', 'write'],
    status: 'active'
  },
  {
    id: 'key_1357924680',
    name: 'Testing API Key',
    key: 'fgt_test_abcdefghijklmnopqrstuvwxyz345678',
    created_at: '2025-10-05T11:20:00Z',
    last_used: null,
    permissions: ['read'],
    status: 'disabled'
  }
];

const mockWebhookLogs: WebhookLog[] = [
  {
    id: 'log_1234567890',
    event_type: 'unlearning.completed',
    url: 'https://api.example.com/webhooks/unlearning',
    status: 'success',
    timestamp: '2025-10-20T14:30:00Z',
    response_code: 200,
    payload_size: 1247
  },
  {
    id: 'log_0987654321',
    event_type: 'proof.verified',
    url: 'https://api.example.com/webhooks/proofs',
    status: 'success',
    timestamp: '2025-10-20T13:45:00Z',
    response_code: 200,
    payload_size: 856
  },
  {
    id: 'log_1357924680',
    event_type: 'unlearning.failed',
    url: 'https://api.example.com/webhooks/unlearning',
    status: 'failed',
    timestamp: '2025-10-20T12:30:00Z',
    response_code: 500,
    payload_size: 923
  },
  {
    id: 'log_2468135790',
    event_type: 'certificate.generated',
    url: 'https://api.example.com/webhooks/certificates',
    status: 'pending',
    timestamp: '2025-10-20T11:15:00Z',
    response_code: null,
    payload_size: 2105
  }
];

const mockSdkDocs: SdkDocumentation[] = [
  {
    id: 'sdk_1234567890',
    name: 'JavaScript SDK',
    version: 'v2.1.4',
    language: 'JavaScript',
    downloads: 12478,
    last_updated: '2025-10-18T09:30:00Z'
  },
  {
    id: 'sdk_0987654321',
    name: 'Python SDK',
    version: 'v1.8.2',
    language: 'Python',
    downloads: 8756,
    last_updated: '2025-10-15T14:20:00Z'
  },
  {
    id: 'sdk_1357924680',
    name: 'Java SDK',
    version: 'v3.0.1',
    language: 'Java',
    downloads: 5432,
    last_updated: '2025-10-12T11:45:00Z'
  },
  {
    id: 'sdk_2468135790',
    name: 'Go SDK',
    version: 'v1.2.7',
    language: 'Go',
    downloads: 3210,
    last_updated: '2025-10-10T16:30:00Z'
  }
];

export function DeveloperDashboard() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [webhookLogs] = useState<WebhookLog[]>(mockWebhookLogs);
  const [sdkDocs] = useState<SdkDocumentation[]>(mockSdkDocs);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const totalApiKeys = apiKeys.length;
  const activeApiKeys = apiKeys.filter(key => key.status === 'active').length;
  const successfulWebhooks = webhookLogs.filter(log => log.status === 'success').length;
  const webhookSuccessRate = webhookLogs.length > 0 ? (successfulWebhooks / webhookLogs.length) * 100 : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const createApiKey = () => {
    if (!newKeyName.trim()) return;
    
    const newKey: ApiKey = {
      id: `key_${Math.random().toString(36).substr(2, 9)}`,
      name: newKeyName,
      key: `fgt_${Math.random().toString(36).substr(2, 32)}`,
      created_at: new Date().toISOString(),
      last_used: null,
      permissions: ['read'],
      status: 'active'
    };
    
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    setShowNewKeyForm(false);
  };

  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const toggleApiKeyStatus = (id: string) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id 
        ? { ...key, status: key.status === 'active' ? 'disabled' : 'active' } 
        : key
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getKeyStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'disabled':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getKeyStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-400';
      case 'disabled':
        return 'bg-gray-900/30 text-gray-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
            Developer Dashboard
          </h1>
          <p className="mt-1 text-gray-400">
            Manage API keys, webhooks, and access SDK documentation
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setShowNewKeyForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#60a5fa] hover:bg-[#60a5fa]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a5fa]"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Create API Key
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">API Keys</p>
              <p className="text-2xl font-bold text-white">{totalApiKeys}</p>
            </div>
            <Key className="h-8 w-8 text-[#60a5fa]" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Keys</p>
              <p className="text-2xl font-bold text-green-400">{activeApiKeys}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Webhook Success Rate</p>
              <p className="text-2xl font-bold text-white">{webhookSuccessRate.toFixed(1)}%</p>
            </div>
            <Webhook className="h-8 w-8 text-[#60a5fa]" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">SDK Downloads</p>
              <p className="text-2xl font-bold text-white">{sdkDocs.reduce((sum, sdk) => sum + sdk.downloads, 0).toLocaleString()}</p>
            </div>
            <Code className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {showNewKeyForm && (
        <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Create New API Key</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="keyName" className="block text-sm font-medium text-gray-400 mb-1">
                Key Name
              </label>
              <input
                type="text"
                id="keyName"
                className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-[#091024] text-white placeholder-gray-400 focus:outline-none focus:ring-[#60a5fa] focus:border-[#60a5fa]"
                placeholder="Enter a name for your API key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="flex items-end space-x-3">
              <button
                type="button"
                onClick={createApiKey}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                Create Key
              </button>
              <button
                type="button"
                onClick={() => setShowNewKeyForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-[#091024] hover:bg-[#091024]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a5fa]"
              >
                <XCircle className="-ml-1 mr-2 h-5 w-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-white">API Keys</h2>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search API keys..."
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
                  <option value="disabled">Disabled</option>
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-[#091024]/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{key.name}</div>
                    <div className="text-sm text-gray-400">
                      Created: {new Date(key.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-sm text-white font-mono">••••••••</span>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="ml-2 text-[#60a5fa] hover:text-[#60a5fa]/80"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.map((permission, index) => (
                        <span key={index} className="px-2 py-1 text-xs rounded bg-[#091024] text-gray-300">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getKeyStatusBadgeColor(key.status)}`}>
                      {key.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleApiKeyStatus(key.id)}
                        className={`${
                          key.status === 'active' 
                            ? 'text-yellow-400 hover:text-yellow-300' 
                            : 'text-green-400 hover:text-green-300'
                        }`}
                        title={key.status === 'active' ? 'Disable key' : 'Enable key'}
                      >
                        {key.status === 'active' ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteApiKey(key.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete key"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
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
            <h2 className="text-xl font-semibold text-white">Webhook Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {webhookLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#091024]/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{log.event_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 truncate max-w-xs">{log.url}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(log.status)}
                        <span className={`ml-2 text-sm capitalize ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {log.payload_size} bytes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#002d68] rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">SDK Documentation</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    SDK
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Downloads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {sdkDocs.map((sdk) => (
                  <tr key={sdk.id} className="hover:bg-[#091024]/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{sdk.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{sdk.language}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{sdk.version}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {sdk.downloads.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(sdk.last_updated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <div className="flex space-x-2">
                        <button className="text-[#60a5fa] hover:text-[#60a5fa]/80" title="View Documentation">
                          <Eye className="h-5 w-5" />
                        </button>
                        <button className="text-green-400 hover:text-green-300" title="Download">
                          <Code className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Developer Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#091024] p-4 rounded-lg">
            <h4 className="text-md font-medium text-white mb-2">API Documentation</h4>
            <p className="text-sm text-gray-400 mb-3">
              Comprehensive guides and reference materials for integrating with the Forg3t Protocol API.
            </p>
            <button className="text-sm text-[#60a5fa] hover:text-[#60a5fa]/80 font-medium">
              View Documentation →
            </button>
          </div>
          <div className="bg-[#091024] p-4 rounded-lg">
            <h4 className="text-md font-medium text-white mb-2">Code Examples</h4>
            <p className="text-sm text-gray-400 mb-3">
              Sample implementations and tutorials for common use cases and integration patterns.
            </p>
            <button className="text-sm text-[#60a5fa] hover:text-[#60a5fa]/80 font-medium">
              Browse Examples →
            </button>
          </div>
          <div className="bg-[#091024] p-4 rounded-lg">
            <h4 className="text-md font-medium text-white mb-2">Community Support</h4>
            <p className="text-sm text-gray-400 mb-3">
              Join our developer community, ask questions, and share your projects with other developers.
            </p>
            <button className="text-sm text-[#60a5fa] hover:text-[#60a5fa]/80 font-medium">
              Join Community →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}