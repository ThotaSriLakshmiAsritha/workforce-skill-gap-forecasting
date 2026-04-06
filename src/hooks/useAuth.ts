import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'hr_manager' | 'org_admin';
  department?: string;
  job_title?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo Mock Fallback handling
    const mockRole = sessionStorage.getItem('mockRole');
    if (mockRole) {
      setUser({ id: 'mock-user-123', email: 'demo@skillsync.com' } as User);
      setProfile({
        id: 'mock-user-123',
        full_name: 'Demo ' + (mockRole === 'employee' ? 'Employee' : 'HR Manager'),
        email: 'demo@skillsync.com',
        role: mockRole as any,
        department: 'Engineering'
      });
      setLoading(false);
      return;
    }

    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } catch(e) {
      console.warn("Supabase auth error. Simulating unauthenticated state.");
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch(e) {
      console.warn("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    sessionStorage.removeItem('mockRole');
    supabase.auth.signOut();
    window.location.href = '/login';
  };

  return { user, profile, loading, signOut };
}
