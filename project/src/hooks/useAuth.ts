import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isRealSupabaseClient = 'from' in supabase;
    
    if (isRealSupabaseClient) {
      const realSupabase: any = supabase;
      
      realSupabase.auth.getSession().then((result: any) => {
        const session = result?.data?.session;
        setUser(session?.user ?? null);
        setLoading(false);
      }).catch((error: any) => {
        console.error('Error getting session:', error);
        setUser(null);
        setLoading(false);
      });

      const { data: { subscription } } = realSupabase.auth.onAuthStateChange(
        (_event: any, session: any) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  return { user, loading };
}