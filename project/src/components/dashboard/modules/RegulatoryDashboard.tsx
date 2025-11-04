import React, { useState } from 'react';
import { 
  Gavel, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  MapPin,
  Filter,
  Search,
  Bell,
  Calendar,
  FileText
} from 'lucide-react';

interface ComplianceIssue {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'at_risk' | 'non_compliant' | 'under_review';
  last_updated: string;
  deadline: string;
  related_regulations: string[];
}

interface UpcomingRegulation {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  effective_date: string;
  impact: 'low' | 'medium' | 'high';
  affected_entities: string[];
}

interface RiskVisualization {
  region: string;
  compliance_score: number;
  risk_level: 'low' | 'medium' | 'high';
  issues_count: number;
  regulations_count: number;
}

const mockComplianceIssues: ComplianceIssue[] = [
  {
    id: 'issue_1234567890',
    title: 'GDPR Article 17 Compliance for EU Operations',
    description: 'Ensure all EU-based AI models implement proper right to erasure mechanisms',
    jurisdiction: 'EU',
    severity: 'high',
    status: 'at_risk',
    last_updated: '2025-10-20T14:30:00Z',
    deadline: '2025-12-31T23:59:59Z',
    related_regulations: ['GDPR Article 17', 'AI Act Article 13']
  },
  {
    id: 'issue_0987654321',
    title: 'CCPA Data Deletion Requirements',
    description: 'Verify compliance with California Consumer Privacy Act data deletion obligations',
    jurisdiction: 'US-CA',
    severity: 'medium',
    status: 'compliant',
    last_updated: '2025-10-15T09:15:00Z',
    deadline: '2026-01-01T23:59:59Z',
    related_regulations: ['CCPA Section 1798.105']
  },
  {
    id: 'issue_1357924680',
    title: 'PIPEDA Compliance for Canadian Operations',
    description: 'Ensure personal information protection during AI unlearning processes',
    jurisdiction: 'CA',
    severity: 'medium',
    status: 'under_review',
    last_updated: '2025-10-18T16:45:00Z',
    deadline: '2025-11-30T23:59:59Z',
    related_regulations: ['PIPEDA Principle 4.8']
  },
  {
    id: 'issue_2468135790',
    title: 'LGPD Data Erasure Requirements',
    description: 'Implement proper data erasure mechanisms for Brazilian operations',
    jurisdiction: 'BR',
    severity: 'high',
    status: 'non_compliant',
    last_updated: '2025-10-10T11:20:00Z',
    deadline: '2025-10-31T23:59:59Z',
    related_regulations: ['LGPD Article 18']
  }
];

const mockUpcomingRegulations: UpcomingRegulation[] = [
  {
    id: 'reg_1234567890',
    title: 'EU AI Act - Final Implementation',
    description: 'Full enforcement of EU AI Act requirements for high-risk AI systems',
    jurisdiction: 'EU',
    effective_date: '2026-08-01T00:00:00Z',
    impact: 'high',
    affected_entities: ['AI Developers', 'Model Providers', 'Enterprises']
  },
  {
    id: 'reg_0987654321',
    title: 'UK Online Safety Bill',
    description: 'New requirements for AI systems in online platforms regarding user safety',
    jurisdiction: 'UK',
    effective_date: '2026-01-15T00:00:00Z',
    impact: 'medium',
    affected_entities: ['Social Media Platforms', 'Content Moderation AI']
  },
  {
    id: 'reg_1357924680',
    title: 'US Federal AI Bill',
    description: 'Proposed federal legislation for AI transparency and accountability',
    jurisdiction: 'US',
    effective_date: '2026-07-01T00:00:00Z',
    impact: 'high',
    affected_entities: ['Federal Contractors', 'AI Developers', 'Enterprises']
  }
];

const mockRiskVisualization: RiskVisualization[] = [
  { region: 'EU', compliance_score: 85, risk_level: 'low', issues_count: 2, regulations_count: 15 },
  { region: 'US', compliance_score: 72, risk_level: 'medium', issues_count: 3, regulations_count: 12 },
  { region: 'CA', compliance_score: 90, risk_level: 'low', issues_count: 1, regulations_count: 8 },
  { region: 'UK', compliance_score: 78, risk_level: 'medium', issues_count: 2, regulations_count: 10 },
  { region: 'BR', compliance_score: 65, risk_level: 'high', issues_count: 4, regulations_count: 7 },
  { region: 'JP', compliance_score: 88, risk_level: 'low', issues_count: 1, regulations_count: 6 }
];

export function RegulatoryDashboard() {
  const [issues] = useState<ComplianceIssue[]>(mockComplianceIssues);
  const [upcomingRegulations] = useState<UpcomingRegulation[]>(mockUpcomingRegulations);
  const [riskData] = useState<RiskVisualization[]>(mockRiskVisualization);
  const [searchTerm, setSearchTerm] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const totalIssues = issues.length;
  const atRiskIssues = issues.filter(issue => issue.status === 'at_risk' || issue.status === 'non_compliant').length;
  const compliantIssues = issues.filter(issue => issue.status === 'compliant').length;
  const avgComplianceScore = riskData.reduce((sum, region) => sum + region.compliance_score, 0) / riskData.length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/30 text-red-400';
      case 'high':
        return 'bg-red-900/30 text-red-400';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'low':
        return 'bg-green-900/30 text-green-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-400';
      case 'at_risk':
        return 'text-yellow-400';
      case 'non_compliant':
        return 'text-red-400';
      case 'under_review':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-900/30 text-green-400';
      case 'at_risk':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'non_compliant':
        return 'bg-red-900/30 text-red-400';
      case 'under_review':
        return 'bg-blue-900/30 text-blue-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskLevelBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-900/30 text-red-400';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'low':
        return 'bg-green-900/30 text-green-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
            Regulatory Dashboard
          </h1>
          <p className="mt-1 text-gray-400">
            Monitor compliance status, risks, and upcoming regulatory changes
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#60a5fa] hover:bg-[#60a5fa]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#60a5fa]"
          >
            <Bell className="-ml-1 mr-2 h-5 w-5" />
            Set Alerts
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Issues</p>
              <p className="text-2xl font-bold text-white">{totalIssues}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-[#60a5fa]" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">At Risk</p>
              <p className="text-2xl font-bold text-yellow-400">{atRiskIssues}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Compliant</p>
              <p className="text-2xl font-bold text-green-400">{compliantIssues}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-[#002d68] p-6 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Compliance</p>
              <p className="text-2xl font-bold text-white">{avgComplianceScore.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600">
        <div className="p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-white">Global Compliance Risk Visualization</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riskData.map((region) => (
              <div key={region.region} className="bg-[#091024] p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-[#60a5fa] mr-2" />
                    <h3 className="text-lg font-medium text-white">{region.region}</h3>
                  </div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelBadgeColor(region.risk_level)}`}>
                    {region.risk_level}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Compliance Score</span>
                    <span>{region.compliance_score}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        region.compliance_score >= 80 ? 'bg-green-500' :
                        region.compliance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${region.compliance_score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Issues</p>
                    <p className="text-lg font-medium text-white">{region.issues_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Regulations</p>
                    <p className="text-lg font-medium text-white">{region.regulations_count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#002d68] rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-white">Compliance Issues</h2>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search issues..."
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
                    value={jurisdictionFilter}
                    onChange={(e) => setJurisdictionFilter(e.target.value)}
                  >
                    <option value="all">All Jurisdictions</option>
                    {Array.from(new Set(issues.map(issue => issue.jurisdiction))).map(jurisdiction => (
                      <option key={jurisdiction} value={jurisdiction}>{jurisdiction}</option>
                    ))}
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
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Jurisdiction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Deadline
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-[#091024]/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{issue.title}</div>
                      <div className="text-sm text-gray-400 truncate max-w-xs">{issue.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{issue.jurisdiction}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityBadgeColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(issue.deadline).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#002d68] rounded-lg border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <h2 className="text-xl font-semibold text-white">Upcoming Regulations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Regulation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Jurisdiction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Effective Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {upcomingRegulations.map((regulation) => (
                  <tr key={regulation.id} className="hover:bg-[#091024]/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{regulation.title}</div>
                      <div className="text-sm text-gray-400 truncate max-w-xs">{regulation.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{regulation.jurisdiction}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityBadgeColor(regulation.impact)}`}>
                        {regulation.impact}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(regulation.effective_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#002d68] rounded-lg border border-gray-600 p-6">
        <h3 className="text-lg font-medium text-white mb-4">Compliance Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#091024] p-4 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
              <div>
                <h4 className="text-md font-medium text-white">Implement Regular Audits</h4>
                <p className="mt-1 text-sm text-gray-400">
                  Conduct quarterly compliance audits to identify and address potential issues before deadlines.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#091024] p-4 rounded-lg">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-[#60a5fa] mr-2 mt-0.5" />
              <div>
                <h4 className="text-md font-medium text-white">Monitor Regulatory Changes</h4>
                <p className="mt-1 text-sm text-gray-400">
                  Subscribe to regulatory updates and participate in industry working groups to stay informed.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#091024] p-4 rounded-lg">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-purple-400 mr-2 mt-0.5" />
              <div>
                <h4 className="text-md font-medium text-white">Maintain Documentation</h4>
                <p className="mt-1 text-sm text-gray-400">
                  Keep detailed records of all unlearning operations and compliance activities for audit purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}