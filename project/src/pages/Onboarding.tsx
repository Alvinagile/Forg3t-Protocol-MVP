import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Users, Building, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function Onboarding() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<'individual' | 'enterprise'>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!user) {
      setError('No user session found. Please sign in again.');
      navigate('/signin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ensure user profile exists
      const { error: profileError } = await (supabase as any)
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          package_type: selectedPackage
        })
        .select()
        .single();

      if (profileError && profileError.code !== '23505') {
        // Don't fail the process for profile creation issues
      }

      // Update auth metadata
      if ('updateUser' in supabase.auth) {
        const { error: authError } = await (supabase.auth as any).updateUser({
          data: { package_type: selectedPackage }
        });

        if (authError) {
          // Don't fail the process for metadata update failure
        }
      }

      navigate('/dash');
      
    } catch (error) {
      console.error('💥 Onboarding failed:', error);
      setError(error instanceof Error ? error.message : 'Onboarding failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#091024] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-4xl font-bold text-white">
            Welcome to Forg3t Protocol
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Choose your package to get started with cryptographically verified AI unlearning
          </p>
          
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center space-x-2 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Individual Package */}
          <div
            className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPackage === 'individual'
                ? 'border-[#60a5fa] bg-[#60a5fa]/10'
                : 'border-gray-600 bg-[#002d68] hover:border-[#60a5fa]/50'
            }`}
            onClick={() => setSelectedPackage('individual')}
          >
            {selectedPackage === 'individual' && (
              <div className="absolute top-4 right-4">
                <Check className="h-6 w-6 text-[#60a5fa]" />
              </div>
            )}
            
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-8 w-8 text-[#60a5fa]" />
              <div>
                <h3 className="text-xl font-bold text-white">Individual</h3>
                <p className="text-[#60a5fa] font-semibold">Free</p>
              </div>
            </div>

            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>5 unlearning requests per month</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Black-box unlearning (ChatGPT)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>zk-SNARK proofs</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Compliance certificates</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>IPFS storage</span>
              </li>
            </ul>
          </div>

          {/* Enterprise Package */}
          <div
            className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPackage === 'enterprise'
                ? 'border-[#60a5fa] bg-[#60a5fa]/10'
                : 'border-gray-600 bg-[#002d68] hover:border-[#60a5fa]/50'
            }`}
            onClick={() => setSelectedPackage('enterprise')}
          >
            {selectedPackage === 'enterprise' && (
              <div className="absolute top-4 right-4">
                <Check className="h-6 w-6 text-[#60a5fa]" />
              </div>
            )}
            
            <div className="flex items-center space-x-3 mb-4">
              <Building className="h-8 w-8 text-[#60a5fa]" />
              <div>
                <h3 className="text-xl font-bold text-white">Enterprise</h3>
                <p className="text-[#60a5fa] font-semibold">Free (Beta)</p>
              </div>
            </div>

            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Unlimited requests</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Black-box & White-box unlearning</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Advanced zk-SNARK proofs</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Regulatory compliance suite</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-400" />
                <span>Custom integrations</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="px-8 py-3 bg-[#60a5fa] text-white font-semibold rounded-lg hover:bg-[#60a5fa]/90 focus:outline-none focus:ring-2 focus:ring-[#60a5fa] focus:ring-offset-2 focus:ring-offset-[#091024] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}