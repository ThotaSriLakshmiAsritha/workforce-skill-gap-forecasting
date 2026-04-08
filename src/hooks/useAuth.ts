import { useEffect, useMemo, useState } from 'react';
import { useAuth as useAuthContext } from '../context/AuthContext';
import { signOut as signOutFromSupabase } from '../lib/auth';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'hr_manager' | 'org_admin' | 'team_lead';
  department?: string;
  job_title?: string;
  target_role?: string;
}

export function useAuth() {
  const { user, loading: authLoading } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!user?.id) {
        if (mounted) {
          setProfile(null);
          setProfileLoading(false);
        }
        return;
      }

      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, department, job_title, target_role')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (mounted) {
          setProfile((data as UserProfile | null) ?? null);
        }
      } catch (error) {
        console.error('Failed to load user profile.', error);
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const loading = authLoading || profileLoading;
  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading]);

  const signOut = async () => {
    try {
      await signOutFromSupabase();
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to sign out.', error);
    }
  };

  return { ...value, signOut };
}
