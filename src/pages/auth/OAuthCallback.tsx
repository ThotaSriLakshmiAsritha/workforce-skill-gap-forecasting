import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState('Preparing sign-in...');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        if (!cancelled) setStatus('Checking existing session...');

        const { data: existingSession } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'Timed out while checking your session.'
        );
        const existingUserId = existingSession.session?.user?.id;
        if (existingUserId) {
          if (!cancelled) setStatus('Session found. Loading your profile...');
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', existingUserId)
            .maybeSingle();

          if (!cancelled) {
            navigate((profile?.role ?? 'employee') === 'employee' ? '/employee' : '/org', { replace: true });
          }
          return;
        }

        const url = new URL(window.location.href);
        if (!cancelled) setStatus('Reading Google callback response...');

        // Also handle providers that return params in the hash fragment (#)
        const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
        const code = url.searchParams.get('code') || hashParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam =
          url.searchParams.get('error_description') ||
          url.searchParams.get('error') ||
          hashParams.get('error_description') ||
          hashParams.get('error');

        // Some providers (or older Supabase settings) return tokens in the hash instead of a code.
        if (!code && accessToken) {
          if (!cancelled) setStatus('Finalizing session from returned token...');
          const { error: setSessionError } = await withTimeout(
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken ?? '',
            }),
            10000,
            'Timed out while saving your Google session.'
          );
          if (setSessionError) throw setSessionError;

          const { data: sessionData } = await withTimeout(
            supabase.auth.getSession(),
            8000,
            'Timed out while reading your saved session.'
          );
          const userId = sessionData.session?.user?.id;
          const fallbackRole =
            (sessionData.session?.user?.user_metadata?.role as string | undefined) ?? 'employee';

          if (!cancelled) {
            setStatus('Loading your profile...');
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userId ?? '')
              .maybeSingle();
            const role = profile?.role ?? fallbackRole;
            navigate(role === 'employee' ? '/employee' : '/org', { replace: true });
          }
          return;
        }

        if (!code) {
          console.error('OAuth callback missing code', {
            href: window.location.href,
            query: url.search,
            hash: url.hash,
            errorParam
          });
          setError(
            errorParam
              ? `Google sign-in returned an error: ${errorParam}`
              : 'We could not complete Google sign-in (missing code). Please start again.'
          );
          return;
        }

        // Supabase stores the PKCE code_verifier in localStorage during sign-in.
        // If it is missing, the exchange will fail with a vague error. Surface a clear message instead.
        let pkceKey: string | null = null;
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
          if (supabaseUrl) {
            const projectRef = new URL(supabaseUrl).host.split('.')[0];
            pkceKey = `sb-${projectRef}-auth-token-code-verifier`;
          }
        } catch (_) {
          // ignore parsing errors; fall back to exchange error handling
        }
        if (pkceKey && !localStorage.getItem(pkceKey)) {
          throw new Error('Your login session expired before Google returned. Please start sign-in again.');
        }

        // For OAuth PKCE flows, Supabase redirects back with a `code` param.
        // Exchange that auth code for a session and store it in the client.
        if (!cancelled) setStatus('Exchanging Google code for your session...');
        const { error: exchangeError } = await withTimeout(
          supabase.auth.exchangeCodeForSession(code),
          10000,
          'Timed out while exchanging the Google sign-in code.'
        );
        if (exchangeError) throw exchangeError;

        if (!cancelled) setStatus('Confirming session...');
        const { data: sessionData } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'Timed out while confirming your session.'
        );
        const userId = sessionData.session?.user?.id;
        if (!userId) throw new Error('No session after OAuth callback');

        if (!cancelled) setStatus('Loading your profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        const role = profile?.role ?? 'employee';

        if (!cancelled) {
          navigate(role === 'employee' ? '/employee' : '/org', { replace: true });
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError(e?.message || 'OAuth callback failed');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-md border text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">Signing you in...</h2>
        <p className="text-muted-foreground mb-6">Finishing Google authentication.</p>
        {error ? (
          <div className="space-y-3">
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md text-sm">
              {error}
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => navigate('/login', { replace: true })}
            >
              Return to login
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {status}
            </div>
            <div className="text-xs text-muted-foreground break-all">
              {window.location.pathname}
              {window.location.search}
              {window.location.hash}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
