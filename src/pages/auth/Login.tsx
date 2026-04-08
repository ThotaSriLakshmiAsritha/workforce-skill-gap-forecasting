import { Link, Navigate } from 'react-router-dom';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-bg text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-7rem] top-[-5rem] h-72 w-72 rounded-full bg-brand-textTer/16 blur-3xl" />
        <div className="absolute right-[-8rem] top-[3rem] h-[26rem] w-[26rem] rounded-full bg-brand-textPri/14 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
          <Link to="/" className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-textPri">
            SkillSync
          </Link>
          <h1 className="mt-5 text-4xl font-black tracking-[-0.03em]">Sign in to your workspace</h1>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Use your Google account to securely access organization and employee dashboards.
          </p>
          <div className="mt-8">
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    </div>
  );
}
