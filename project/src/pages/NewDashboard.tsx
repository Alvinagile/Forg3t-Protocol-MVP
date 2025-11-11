import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { ComplianceDashboard } from '../components/dashboard/modules/ComplianceDashboard';
import { ValidatorDashboard } from '../components/dashboard/modules/ValidatorDashboard';
import { EnterpriseDashboard } from '../components/dashboard/modules/EnterpriseDashboard';
import { TokenDashboard } from '../components/dashboard/modules/TokenDashboard';
import { ProofExplorer } from '../components/dashboard/modules/ProofExplorer';
import { RegulatoryDashboard } from '../components/dashboard/modules/RegulatoryDashboard';
import { DeveloperDashboard } from '../components/dashboard/modules/DeveloperDashboard';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Brain, Shield, Building, Coins, Gavel, Code } from 'lucide-react';

function DashboardRoute() {
  const { module } = useParams();
  const navigate = useNavigate();
  
  // Function to handle card clicks
  const handleCardClick = (path: string) => {
    navigate(path);
  };
  
  switch (module) {
    case 'compliance':
      return <ComplianceDashboard />;
    case 'validator':
      return <ValidatorDashboard />;
    case 'enterprise':
      return <EnterpriseDashboard />;
    case 'token':
      return <TokenDashboard />;
    case 'explorer':
      return <ProofExplorer />;
    case 'regulatory':
      return <RegulatoryDashboard />;
    case 'developer':
      return <DeveloperDashboard />;
    default:
      return (
        <div className="py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                Forg3t Protocol Dashboard
              </h1>
              <p className="mt-2 text-gray-400">
                Provable AI Unlearning Platform
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="bg-[#002d68] rounded-lg border border-gray-600 p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to Your Dashboard</h2>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  Select a dashboard component from the sidebar or click below to monitor your AI unlearning operations, 
                  compliance status, and blockchain-verified proofs.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  <div 
                    className="bg-[#091024] p-6 rounded-lg border border-gray-600 hover:border-[#60a5fa]/50 transition-all duration-300 group cursor-pointer"
                    onClick={() => handleCardClick('/dash/compliance')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#60a5fa]/10 p-3 rounded-full mb-4 group-hover:bg-[#60a5fa]/20 transition-colors">
                        <Shield className="h-8 w-8 text-[#60a5fa]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Compliance Dashboard</h3>
                      <p className="text-gray-400 text-sm">
                        Real-time unlearning status, proof verification, and downloadable reports
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className="bg-[#091024] p-6 rounded-lg border border-gray-600 hover:border-[#60a5fa]/50 transition-all duration-300 group cursor-pointer"
                    onClick={() => handleCardClick('/dash/validator')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#60a5fa]/10 p-3 rounded-full mb-4 group-hover:bg-[#60a5fa]/20 transition-colors">
                        <Brain className="h-8 w-8 text-[#60a5fa]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Validator Dashboard</h3>
                      <p className="text-gray-400 text-sm">
                        Staking, proof queue, rewards, and performance metrics
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className="bg-[#091024] p-6 rounded-lg border border-gray-600 hover:border-[#60a5fa]/50 transition-all duration-300 group cursor-pointer"
                    onClick={() => handleCardClick('/dash/enterprise')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#60a5fa]/10 p-3 rounded-full mb-4 group-hover:bg-[#60a5fa]/20 transition-colors">
                        <Building className="h-8 w-8 text-[#60a5fa]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Enterprise Dashboard</h3>
                      <p className="text-gray-400 text-sm">
                        Model integrations, token usage, and audit certificate generator
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className="bg-[#091024] p-6 rounded-lg border border-gray-600 hover:border-[#60a5fa]/50 transition-all duration-300 group cursor-pointer"
                    onClick={() => handleCardClick('/dash/token')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#60a5fa]/10 p-3 rounded-full mb-4 group-hover:bg-[#60a5fa]/20 transition-colors">
                        <Coins className="h-8 w-8 text-[#60a5fa]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Token Dashboard</h3>
                      <p className="text-gray-400 text-sm">
                        Manage your wallet, staking, and token transactions
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className="bg-[#091024] p-6 rounded-lg border border-gray-600 hover:border-[#60a5fa]/50 transition-all duration-300 group cursor-pointer"
                    onClick={() => handleCardClick('/dash/regulatory')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#60a5fa]/10 p-3 rounded-full mb-4 group-hover:bg-[#60a5fa]/20 transition-colors">
                        <Gavel className="h-8 w-8 text-[#60a5fa]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Regulatory Dashboard</h3>
                      <p className="text-gray-400 text-sm">
                        Monitor compliance status, risks, and upcoming regulatory changes
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className="bg-[#091024] p-6 rounded-lg border border-gray-600 hover:border-[#60a5fa]/50 transition-all duration-300 group cursor-pointer"
                    onClick={() => handleCardClick('/dash/developer')}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-[#60a5fa]/10 p-3 rounded-full mb-4 group-hover:bg-[#60a5fa]/20 transition-colors">
                        <Code className="h-8 w-8 text-[#60a5fa]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Developer Dashboard</h3>
                      <p className="text-gray-400 text-sm">
                        API keys, webhooks, and SDK documentation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  }
}

export function NewDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardRoute />} />
        <Route path="/:module" element={<DashboardRoute />} />
      </Routes>
    </DashboardLayout>
  );
}