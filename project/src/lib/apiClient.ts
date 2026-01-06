/**
 * Centralized API client for the dashboard application
 * Handles API base URL resolution with fallback to same-origin
 */

/**
 * Get the base URL for API calls
 * 
 * Resolution order:
 * 1. VITE_API_BASE_URL environment variable
 * 2. Same-origin (relative paths) for production/preview
 * 3. Default to localhost:3000 for development
 * 
 * @returns The base URL for API calls
 */
export function getApiBaseUrl(): string {
  // Check for explicit API base URL in environment variables
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // For production/preview builds, use same-origin (relative paths)
  // This works for both Vite dev server proxy and preview server
  if (import.meta.env.PROD || import.meta.env.VITE_NODE_ENV === 'production') {
    return '';
  }

  // Fallback to localhost:3000 for development
  return 'http://localhost:3000';
}

/**
 * Get the dashboard backend URL for proxy calls
 * 
 * Resolution order:
 * 1. VITE_DASHBOARD_BACKEND_URL environment variable
 * 2. Same-origin (relative paths) for production/preview
 * 3. Default to localhost:4000 for development
 * 
 * @returns The dashboard backend URL for proxy calls
 */
export function getDashboardBackendUrl(): string {
  // Check for explicit dashboard backend URL in environment variables
  if (import.meta.env.VITE_DASHBOARD_BACKEND_URL) {
    return import.meta.env.VITE_DASHBOARD_BACKEND_URL;
  }

  // For production/preview builds, use same-origin (relative paths)
  if (import.meta.env.PROD || import.meta.env.VITE_NODE_ENV === 'production') {
    return '';
  }

  // Fallback to localhost:4000 for development
  return 'http://localhost:4000';
}

/**
 * Create a standardized fetch request to the control plane API
 * 
 * @param path - The API endpoint path (e.g., '/api/v1/projects')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Promise resolving to the fetch response
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  
  // In development, use the Vite proxy path
  if (!import.meta.env.VITE_API_BASE_URL && (import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development')) {
    // Use proxy path for development
    const proxyPath = `/api${path}`;
    return fetch(proxyPath, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
  
  // In production or when VITE_API_BASE_URL is set, use the full URL
  const url = baseUrl + (path.startsWith('/') ? path : `/${path}`);
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Create a standardized fetch request to the dashboard backend proxy
 * 
 * @param path - The API endpoint path (e.g., '/api/v1/onboarding/create')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Promise resolving to the fetch response
 */
export async function dashboardBackendFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getDashboardBackendUrl();
  
  // In development, use the Vite proxy path
  if (!import.meta.env.VITE_DASHBOARD_BACKEND_URL && (import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development')) {
    // Use proxy path for development
    const proxyPath = `/dashboard-api${path}`;
    return fetch(proxyPath, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
  
  // In production or when VITE_DASHBOARD_BACKEND_URL is set, use the full URL
  const url = baseUrl + (path.startsWith('/') ? path : `/${path}`);
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Check if the API is reachable
 * 
 * @returns Promise resolving to true if API is reachable, false otherwise
 */
export async function isApiReachable(): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    // Use a simple HEAD request to check if the API is reachable
    const response = await fetch(`${baseUrl}/health`, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('API connectivity check failed:', error);
    return false;
  }
}

/**
 * Check if the dashboard backend is reachable
 * 
 * @returns Promise resolving to true if dashboard backend is reachable, false otherwise
 */
export async function isDashboardBackendReachable(): Promise<boolean> {
  try {
    const baseUrl = getDashboardBackendUrl();
    // Use a simple HEAD request to check if the dashboard backend is reachable
    const response = await fetch(`${baseUrl}/health`, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Dashboard backend connectivity check failed:', error);
    return false;
  }
}