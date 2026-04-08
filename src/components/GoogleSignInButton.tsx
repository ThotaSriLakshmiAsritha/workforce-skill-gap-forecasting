import { useState } from 'react';
import { signInWithGoogle } from '../lib/auth';

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to continue with Google.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        onClick={() => {
          void handleClick();
        }}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-brand-bg transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <GoogleIcon className="h-5 w-5" />
        {loading ? 'Redirecting...' : 'Continue with Google'}
      </button>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.49-1.85 4.36-5.27 4.36-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.81 0 3.02.77 3.71 1.44l2.53-2.46C16.82 4.2 14.74 3.3 12.17 3.3 7.23 3.3 3.25 7.34 3.25 12.53s3.98 9.23 8.92 9.23c5.14 0 8.54-3.61 8.54-8.69 0-.58-.06-1.02-.16-1.98Z"
        fill="#FFFFFF"
      />
      <path d="M6.35 14.02 5.8 16.1l-2.04.04A9.16 9.16 0 0 1 3.25 12.53c0-1.35.3-2.64.83-3.8l1.82.34.8 1.81a5.52 5.52 0 0 0-.35 1.95c0 .41.05.81.14 1.19Z" fill="#A3A3A3" />
      <path d="M12.17 21.76c2.42 0 4.45-.79 5.93-2.15l-2.74-2.25c-.73.52-1.67.88-3.19.88-2.97 0-5.5-2.02-6.4-4.77l-2.59 1.99c1.45 3.74 5.06 6.3 8.99 6.3Z" fill="#5C5C5C" />
      <path d="M18.22 5.66 15.6 8.22c-.9-.84-2.13-1.54-3.43-1.54-2.97 0-5.5 2.02-6.4 4.77L3.18 9.46c1.45-3.74 5.06-6.16 8.99-6.16 2.57 0 4.65.9 6.05 2.36Z" fill="#2E2E2E" />
    </svg>
  );
}
