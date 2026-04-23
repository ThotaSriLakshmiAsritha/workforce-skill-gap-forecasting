import { Link, Navigate } from 'react-router-dom';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultWorkspaceRoute } from '../../lib/workspaceRoutes';
import { Sparkles, TrendingUp, Users, Shield } from 'lucide-react';

export default function Login() {
  const { user, profile, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={getDefaultWorkspaceRoute(profile?.role)} replace />;
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex"
      style={{ background: 'rgb(var(--brand-bg))' }}
    >
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {/* Green gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a4d2e 0%, #2d6946 40%, #3d8a5c 80%, #4daa78 100%)',
          }}
        />
        {/* Blob shapes */}
        <div
          className="blob-orb absolute top-[-10%] right-[-10%] h-[500px] w-[500px] opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-5%] left-[-5%] h-[350px] w-[350px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            borderRadius: '58% 42% 41% 59% / 49% 62% 38% 51%',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 font-bold text-sm backdrop-blur-sm">
              SS
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/70">SkillSync</div>
              <div className="text-sm font-bold text-white leading-tight">Workforce Intelligence</div>
            </div>
          </Link>

          {/* Hero text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 mb-6 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Platform
            </div>
            <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-white mb-4">
              Elevate Your<br />Workforce
            </h1>
            <p className="text-lg text-white/75 max-w-sm leading-8">
              One command center for staffing, skills intelligence, and employee growth.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: TrendingUp, label: '94% Match Rate' },
              { icon: Users, label: '128 Employees' },
              { icon: Shield, label: 'Secure & Private' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right sign-in panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent font-bold text-sm text-white">
              SS
            </div>
            <div className="text-sm font-bold text-brand-textPri">SkillSync</div>
          </div>

          <div className="surface-card rounded-2xl p-8 shadow-card">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.26em] text-brand-textTer">
              Welcome back
            </div>
            <h1 className="text-3xl font-black text-brand-textPri mb-2">
              Sign in to your workspace
            </h1>
            <p className="text-sm text-brand-textSec leading-7 mb-8">
              Use your Google account to securely access organization and employee dashboards.
            </p>

            <GoogleSignInButton />

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-brand-border" />
              <span className="text-xs text-brand-textTer">secure sign-in</span>
              <div className="flex-1 h-px bg-brand-border" />
            </div>

            <p className="mt-4 text-center text-xs text-brand-textTer leading-6">
              By signing in, you agree to SkillSync's terms of service.
              Your data is encrypted and never shared.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-brand-textSec hover:text-brand-textPri transition-colors"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
