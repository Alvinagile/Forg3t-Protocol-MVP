import { createClient, SupabaseClient } from '@supabase/supabase-js';

type MockSupabaseClient = {
  auth: {
    signUp: Function;
    signInWithPassword: Function;
    signOut: Function;
    getUser: Function;
  };
  from?: Function;
};

let supabase: SupabaseClient | MockSupabaseClient;
let isSupabaseConfigured = false;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasValidSupabaseConfig = !!supabaseUrl && !!supabaseKey && 
  typeof supabaseUrl === 'string' && supabaseUrl.length > 0 && supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  typeof supabaseKey === 'string' && supabaseKey.length > 0;

if (hasValidSupabaseConfig) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    isSupabaseConfigured = true;
  } catch (error) {
    supabase = {
      auth: {
        signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: new Error('Supabase not configured') }),
        getUser: async () => ({ data: { user: null } })
      }
    };
  }
} else {
  supabase = {
    auth: {
      signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: new Error('Supabase not configured') }),
      getUser: async () => ({ data: { user: null } })
    }
  };
}

export const isSupabaseAvailable = () => isSupabaseConfigured;

export { supabase };

export const authService = {
  signUp: async (email: string, password: string, packageType: 'individual' | 'enterprise') => {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured for local development') };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          package_type: packageType
        },
        emailRedirectTo: undefined
      }
    });
    
    if (error) {
      return { data, error };
    }
    
    try {
      if (('from' in supabase && supabase.from) && (data.user || (data.session && data.session.user))) {
        const user = data.user || data.session?.user;
        if (user) {
          await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || email,
              package_type: packageType
            });
        }
      }
    } catch (profileError) {
    }
    
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase not configured for local development') };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase not configured for local development') };
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    if (!isSupabaseConfigured) {
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};