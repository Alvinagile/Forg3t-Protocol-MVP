import { useEffect, useState } from 'react';

export function EnvChecker() {
  const [envData, setEnvData] = useState<any>({});

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setEnvData({
      url,
      keyPresent: !!key,
      keyLength: key ? key.length : 0,
      allKeys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
    });
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      background: 'yellow', 
      padding: '10px', 
      zIndex: 9999,
      maxWidth: '300px',
      fontSize: '12px'
    }}>
      <h3>Env Checker</h3>
      <pre>{JSON.stringify(envData, null, 2)}</pre>
    </div>
  );
}