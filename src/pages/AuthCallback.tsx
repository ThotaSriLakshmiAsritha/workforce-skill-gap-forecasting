import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

    const handleAuthCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        const code = searchParams.get('code') ?? hashParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        const { data: existingSessionData } = await supabase.auth.getSession();
        if (existingSessionData.session) {
          navigate('/dashboard', { replace: true });
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          navigate('/dashboard', { replace: true });
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          navigate('/dashboard', { replace: true });
          return;
        }

        throw new Error('Missing OAuth callback parameters (code or session tokens).');
      } catch (error: unknown) {
        console.error('OAuth callback failed.', error);
        navigate('/login', { replace: true });
      }
    };

    void handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-brand-textPri" aria-label="Authenticating" />
        <p className="text-sm text-white/70">Completing sign-in...</p>
      </div>
    </div>
  );
}
