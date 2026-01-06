import { supabase } from './supabase';

/**
 * Check if the current user has admin privileges
 * @returns Promise<boolean> True if user has admin privileges, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('Supabase is not configured');
      return false;
    }
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Check if user has admin or owner role in tenant_members table
    const { data: membership, error } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .single();
    
    if (error || !membership) {
      return false;
    }
    
    return membership.role === 'admin' || membership.role === 'owner';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Admin route guard middleware
 * @param redirectTo Path to redirect if user is not admin
 * @returns Promise<void>
 */
export async function requireAdmin(redirectTo: string = '/unauthorized'): Promise<void> {
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    // Redirect to unauthorized page or home page
    window.location.href = redirectTo;
  }
}