import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  package_type: 'individual' | 'enterprise' | 'validator' | 'regulator' | 'admin';
  created_at: string;
  updated_at: string;
}

export class UserService {
  static async ensureUserProfile(userId: string, email: string, packageType: 'individual' | 'enterprise' | 'validator' | 'regulator' | 'admin' = 'admin'): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      console.log(`Ensuring user profile exists for: ${userId}`);
      
      const { data: existingUser, error: selectError } = await (supabase as any).from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!selectError && existingUser) {
        console.log('User profile already exists');
        return { success: true, user: existingUser };
      }

      console.log('Creating new user profile');
      const { data: newUser, error: insertError } = await (supabase as any).from('users')
        .insert({
          id: userId,
          email: email,
          package_type: packageType
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create user profile', insertError);
        
        if (insertError.code === '23505') {
          const { data: fetchedUser, error: fetchError } = await (supabase as any).from('users')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (!fetchError && fetchedUser) {
            console.log('User profile found after duplicate error');
            return { success: true, user: fetchedUser };
          }
        }
        
        return { 
          success: false, 
          error: `Failed to create user profile: ${insertError.message}` 
        };
      }

      console.log('User profile created successfully');
      return { success: true, user: newUser };

    } catch (error) {
      console.error('Error in ensureUserProfile', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'package_type'>>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      console.log(`Updating user profile: ${userId}`);
      
      const { data: updatedUser, error } = await (supabase as any).from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update user profile', error);
        return { 
          success: false, 
          error: `Failed to update profile: ${error.message}` 
        };
      }

      console.log('User profile updated successfully');
      return { success: true, user: updatedUser };

    } catch (error) {
      console.error('Error in updateUserProfile', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getUserProfile(userId: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const { data: user, error } = await (supabase as any).from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'User profile not found' };
        }
        
        console.error('Failed to get user profile', error);
        return { 
          success: false, 
          error: `Failed to get profile: ${error.message}` 
        };
      }

      // For development/testing, override package_type to 'admin' to show all dashboard features
      if (user) {
        user.package_type = 'admin';
      }

      return { success: true, user };

    } catch (error) {
      console.error('Error in getUserProfile', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}