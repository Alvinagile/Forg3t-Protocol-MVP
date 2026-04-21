import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Users, Building, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BrandLockup } from '../components/BrandLockup';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.35),_transparent_40%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_45%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <BrandLockup />
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-950">
            Welcome to Forg3t Protocol
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Choose your operating mode to get started with cryptographically verified AI unlearning and Soroban-ready evidence flows.
          </p>

          {error && (
            <div className="mx-auto mt-4 flex max-w-md items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Individual Package */}
          <div
            className={`relative overflow-hidden rounded-[28px] border-2 p-7 transition-all ${
              selectedPackage === 'individual'
                ? 'border-sky-500 bg-sky-50 shadow-[0_24px_80px_rgba(14,165,233,0.12)]'
                : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.06)]'
            }`}
            onClick={() => setSelectedPackage('individual')}
          >
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-sky-200/40 blur-3xl" />
            {selectedPackage === 'individual' && (
              <div className="absolute top-4 right-4">
                <Check className="h-6 w-6 text-sky-600" />
              </div>
            )}
            
            <div className="relative mb-4 flex items-center space-x-3">
              <Users className="h-8 w-8 text-sky-600" />
              <div>
                <h3 className="text-xl font-bold text-slate-950">Individual</h3>
                <p className="font-semibold text-sky-700">Free</p>
              </div>
            </div>

            <p className="relative mb-5 text-sm leading-6 text-slate-600">
              Best for fast suppression requests and lightweight compliance packs.
            </p>

            <ul className="relative space-y-3 text-slate-600">
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>5 unlearning requests per month</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Black-box unlearning (ChatGPT)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>zk-SNARK proofs</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Compliance certificates</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>IPFS storage</span>
              </li>
            </ul>
          </div>

          {/* Enterprise Package */}
          <div
            className={`relative overflow-hidden rounded-[28px] border-2 p-7 transition-all ${
              selectedPackage === 'enterprise'
                ? 'border-sky-500 bg-slate-950 text-white shadow-[0_24px_80px_rgba(14,165,233,0.2)]'
                : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-[0_20px_60px_rgba(15,23,42,0.06)]'
            }`}
            onClick={() => setSelectedPackage('enterprise')}
          >
            <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-400/20 blur-3xl" />
            {selectedPackage === 'enterprise' && (
              <div className="absolute top-4 right-4">
                <Check className="h-6 w-6 text-sky-300" />
              </div>
            )}
            
            <div className="relative mb-4 flex items-center space-x-3">
              <Building className={`h-8 w-8 ${selectedPackage === 'enterprise' ? 'text-sky-300' : 'text-sky-600'}`} />
              <div>
                <h3 className={`text-xl font-bold ${selectedPackage === 'enterprise' ? 'text-white' : 'text-slate-950'}`}>Enterprise</h3>
                <p className={`font-semibold ${selectedPackage === 'enterprise' ? 'text-sky-300' : 'text-sky-700'}`}>Free (Beta)</p>
              </div>
            </div>

            <div className={`relative mb-5 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              selectedPackage === 'enterprise'
                ? 'border-sky-300/30 bg-sky-300/10 text-sky-200'
                : 'border-sky-100 bg-sky-50 text-sky-700'
            }`}>
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              For advanced operators
            </div>

            <ul className={`relative space-y-3 ${selectedPackage === 'enterprise' ? 'text-slate-200' : 'text-slate-600'}`}>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Unlimited requests</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Black-box & White-box unlearning</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Advanced zk-SNARK proofs</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Regulatory compliance suite</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Custom integrations</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="inline-flex items-center rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Continue to Dashboard'}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
