import { useEffect } from 'react';

export function EnvDebug() {
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (url) {
      console.log('URL length:', url.length);
    }
    if (key) {
      console.log('Key length:', key.length);
    }
  }, []);

  return null;
}