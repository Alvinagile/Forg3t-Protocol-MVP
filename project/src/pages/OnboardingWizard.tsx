import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Building, Users, Shield, FileText, Zap, Key, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { dashboardBackendFetch, isDashboardBackendReachable, getDashboardBackendUrl } from '../lib/apiClient';

// Types for our onboarding flow

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const exchangeSession = async (accessToken: string) => {
  const response = await dashboardBackendFetch('/api/v1/auth/exchange-session', {
    method: 'POST',
    body: JSON.stringify({ accessToken })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to exchange session: ${errorData.error?.message || response.statusText}`);
  }

  return await response.json();
};

const createTenantAndProject = async (tenantName: string, projectName: string) => {
  const response = await dashboardBackendFetch('/api/v1/onboarding/create', {
    method: 'POST',
    body: JSON.stringify({
      tenantName: tenantName.trim(),
      projectName: projectName.trim()
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create tenant/project: ${errorData.error?.message || response.statusText}`);
  }

  return await response.json();
};

export function OnboardingWizard() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [tenantName, setTenantName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Create Organization',
      description: 'Set up your organization to start using Forg3t Protocol',
      icon: <Building className="h-6 w-6" />
    },
    {
      id: 2,
      title: 'Create Project',
      description: 'Set up your first project for AI unlearning operations',
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 3,
      title: 'Generate API Key',
      description: 'Create your first API key for integration',
      icon: <Key className="h-6 w-6" />
    },
    {
      id: 4,
      title: 'Complete Setup',
      description: 'Review your setup and get started',
      icon: <CheckCircle className="h-6 w-6" />
    }
  ];

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user || !supabase) return;

      try {
        const isRealSupabaseClient = supabase && 'from' in supabase;
        if (!isRealSupabaseClient) {
          return;
        }

        const realSupabase: any = supabase;

        // Check if user has a profile with tenant_id
        const { data: profile, error: profileError } = await realSupabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (!profileError && profile) {
          // Check if user has any memberships (tenant associations)
          const { data: memberships } = await realSupabase
            .from('memberships')
            .select('tenant_id')
            .eq('user_id', user.id);

          if (memberships && memberships.length > 0) {
            // User already has a tenant, redirect to dashboard
            navigate('/dash');
          }
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    };

    checkUserProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (tenantName && !projectName) {
      setProjectName(`${tenantName} Project`);
    }
  }, [tenantName, projectName]);

  const handleNext = async () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - redirect to dashboard
      navigate('/dash');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateOrganization = async () => {
    if (!user) {
      setError('No user session found. Please sign in again.');
      navigate('/signin');
      return;
    }

    if (!tenantName.trim()) {
      setError('Please enter an organization name.');
      return;
    }

    if (!projectName.trim()) {
      setError('Please enter a project name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if dashboard backend is reachable before proceeding
      const isBackendReachable = await isDashboardBackendReachable();
      if (!isBackendReachable) {
        const backendUrl = getDashboardBackendUrl();
        throw new Error(`Dashboard backend is unreachable at ${backendUrl}. Please ensure the dashboard backend service is running.`);
      }

      // Exchange session with dashboard backend
      // Safely access access_token from user object
      const accessToken = (user as any)?.access_token || (user as any)?.session?.access_token;
      if (!accessToken) {
        throw new Error('No access token found in user object');
      }

      await exchangeSession(accessToken);

      // Create tenant and project via dashboard backend
      const result = await createTenantAndProject(tenantName, projectName);

      const { tenant, apiKey: generatedApiKey } = result;

      // Store API key for display in next step
      setApiKey(generatedApiKey);

      // Store active tenant in localStorage
      localStorage.setItem('activeTenantId', tenant.id);
      localStorage.setItem('activeTenantName', tenant.name);

      // Move to next step
      handleNext();
    } catch (error) {
      console.error('💥 Onboarding failed:', error);
      setError(error instanceof Error ? error.message : 'Onboarding failed');
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-[#2F80ED] flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F3</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#111111] mb-4">
            Welcome to Forg3t Protocol
          </h1>
          <p className="text-lg text-[#4B4B4B] max-w-2xl mx-auto">
            Let's set up your organization and get you started with enterprise-grade AI unlearning operations
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
            <div
              className="absolute top-1/2 left-0 h-1 bg-[#2F80ED] -translate-y-1/2 z-10 transition-all duration-300"
              style={{ width: `${(currentStep - 1) * 33.33}%` }}
            ></div>

            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center z-20">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors ${currentStep >= step.id
                    ? 'bg-[#2F80ED] border-[#2F80ED] text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-[#111111]' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Wizard Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center space-x-3 mb-8">
                <div className="bg-[#2F80ED] p-2 rounded-lg text-white">
                  {steps[currentStep - 1]?.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#111111]">
                    {steps[currentStep - 1]?.title}
                  </h2>
                  <p className="text-[#4B4B4B]">
                    {steps[currentStep - 1]?.description}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Step 1: Create Organization */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="tenantName" className="block text-sm font-medium text-[#111111] mb-2">
                        Organization Name
                      </label>
                      <input
                        id="tenantName"
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="Enter your organization name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent transition-shadow"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="projectName" className="block text-sm font-medium text-[#111111] mb-2">
                        Project Name
                      </label>
                      <input
                        id="projectName"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter your project name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:border-transparent transition-shadow"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Create Project (same as step 1 in this flow) */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-[#2F80ED] p-1 rounded-full flex-shrink-0">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[#111111]">Organization Created</h3>
                          <p className="text-sm text-[#4B4B4B] mt-1">
                            Your organization "{tenantName}" has been successfully created.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-[#2F80ED] p-1 rounded-full flex-shrink-0">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[#111111]">Project Created</h3>
                          <p className="text-sm text-[#4B4B4B] mt-1">
                            Your project "{projectName}" has been successfully created.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Generate API Key */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-[#2F80ED] p-1 rounded-full flex-shrink-0">
                          <Key className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[#111111]">API Key Generated</h3>
                          <p className="text-sm text-[#4B4B4B] mt-1">
                            Here's your API key for integrating with Forg3t Protocol:
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono bg-gray-100 px-3 py-2 rounded flex-1 mr-2 overflow-x-auto">
                          {apiKey}
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          {success ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-yellow-500 p-1 rounded-full flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[#111111]">Important</h3>
                          <p className="text-sm text-[#4B4B4B] mt-1">
                            Store this API key securely. You won't be able to view it again.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Complete Setup */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#111111] mb-2">
                        Setup Complete!
                      </h3>
                      <p className="text-[#4B4B4B] max-w-md mx-auto">
                        Your organization is ready to use Forg3t Protocol's AI unlearning operations system.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-[#111111] mb-4">Next Steps</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start space-x-3">
                          <div className="bg-[#2F80ED] p-1 rounded-full flex-shrink-0 mt-1">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                          <span className="text-sm text-[#4B4B4B]">
                            Explore the dashboard to familiarize yourself with the interface
                          </span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="bg-[#2F80ED] p-1 rounded-full flex-shrink-0 mt-1">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                          <span className="text-sm text-[#4B4B4B]">
                            Integrate the API key into your application
                          </span>
                        </li>
                        <li className="flex items-start space-x-3">
                          <div className="bg-[#2F80ED] p-1 rounded-full flex-shrink-0 mt-1">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                          <span className="text-sm text-[#4B4B4B]">
                            Start submitting unlearning requests
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {currentStep > 1 && currentStep < 4 && (
                    <button
                      onClick={handlePrevious}
                      disabled={loading}
                      className="px-6 py-3 bg-white text-[#111111] font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-white transition-colors"
                    >
                      Back
                    </button>
                  )}

                  {currentStep < 4 ? (
                    <button
                      onClick={currentStep === 1 ? handleCreateOrganization : handleNext}
                      disabled={
                        loading ||
                        (currentStep === 1 && (!tenantName.trim() || !projectName.trim()))
                      }
                      className="flex-1 px-6 py-3 bg-[#2F80ED] text-white font-semibold rounded-lg hover:bg-[#2F80ED]/90 focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {currentStep === 1 ? 'Creating...' : 'Next'}
                        </>
                      ) : (
                        currentStep === 1 ? 'Create Organization' : 'Continue'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex-1 px-6 py-3 bg-[#2F80ED] text-white font-semibold rounded-lg hover:bg-[#2F80ED]/90 focus:outline-none focus:ring-2 focus:ring-[#2F80ED] focus:ring-offset-2 focus:ring-offset-white transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-[#111111] mb-4">What you'll get</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Shield className="h-5 w-5 text-[#2F80ED]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#111111]">Enterprise Security</h4>
                    <p className="text-sm text-[#4B4B4B] mt-1">Dedicated tenant space with full isolation</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Users className="h-5 w-5 text-[#2F80ED]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#111111]">Team Management</h4>
                    <p className="text-sm text-[#4B4B4B] mt-1">Invite team members and assign roles</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Zap className="h-5 w-5 text-[#2F80ED]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#111111]">API Access</h4>
                    <p className="text-sm text-[#4B4B4B] mt-1">Secure API keys for integration</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <FileText className="h-5 w-5 text-[#2F80ED]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#111111]">Audit Trail</h4>
                    <p className="text-sm text-[#4B4B4B] mt-1">Full compliance reporting and logs</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#2F80ED] to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Need Help?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Our team is here to help you get started with Forg3t Protocol
              </p>
              <a
                href="mailto:support@forg3t.com"
                className="inline-block text-white font-medium underline hover:no-underline"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}