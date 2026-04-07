import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo === 'hr') {
      sessionStorage.setItem('mockRole', 'hr_manager');
      window.location.href = '/org/dashboard';
    }
    if (demo === 'employee') {
      sessionStorage.setItem('mockRole', 'employee');
      window.location.href = '/employee/profile';
    }
  }, []);

  useEffect(() => {
    const state = location.state as { oauthError?: string } | null;
    if (state?.oauthError) {
      setErrorMsg(state.oauthError);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Supabase did not return an OAuth redirect URL. Check provider settings and redirect URLs.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: normalizedPassword,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          navigate(role === 'employee' ? '/employee/profile' : '/org/dashboard');
        } else {
          setErrorMsg('Registration successful. Please sign in if you are not redirected automatically.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
          navigate(profile?.role === 'employee' ? '/employee/profile' : '/org/dashboard');
        }
      }
    } catch (err: any) {
      if (err?.code === 'user_already_exists') {
        setErrorMsg('This email is already registered. Please sign in instead.');
        setIsSignUp(false);
      } else if (err?.code === 'invalid_credentials') {
        setErrorMsg('Invalid email or password. Please try again.');
      } else {
        setErrorMsg(err?.message || 'An error occurred during authentication');
      }

      if (
        err?.message?.includes('fetch') ||
        err?.message?.includes('URL') ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('placeholder')
      ) {
        setErrorMsg('Supabase is not connected. Launching demo mode...');
        setTimeout(() => {
          sessionStorage.setItem('mockRole', role);
          window.location.href = role === 'employee' ? '/employee/profile' : '/org/dashboard';
        }, 1200);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#0d0e14] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#f0a500]/12 blur-3xl" />
        <div className="absolute right-[-8rem] top-[1rem] h-[26rem] w-[26rem] rounded-full bg-[#00d4aa]/12 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[30%] h-[22rem] w-[22rem] rounded-full bg-[#7c6af7]/14 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-[1320px] items-center gap-10 px-4 py-8 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#7c6af7] font-black text-[#0d0e14]">
              SS
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">SkillSync</div>
              <div className="text-sm text-white/60">Premium workforce intelligence</div>
            </div>
          </Link>

          <div className="mt-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/25 bg-[#00d4aa]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">
              <Sparkles className="h-3.5 w-3.5" />
              Unified Control Room
            </div>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-[-0.04em]">
              Design smarter teams,
              <span className="block bg-gradient-to-r from-white via-[#00d4aa] to-[#f0a500] bg-clip-text text-transparent">
                hiring, and growth paths.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/65">
              Move from workforce visibility to action with one platform for project allocation, resume intelligence, and employee development.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <InfoCard title="Organization mode" text="Dashboards, project allocator, resume screening, and staffing insights." />
            <InfoCard title="Employee mode" text="Skill radar, learning path, project history, and role-goal planning." />
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00d4aa]">
                {isSignUp ? 'Create account' : 'Welcome back'}
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
                {isSignUp ? 'Launch your workspace' : 'Sign in to SkillSync'}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {isSignUp
                  ? 'Create an account to explore the organization and employee experiences.'
                  : 'Use Google or email to enter the workforce intelligence platform.'}
              </p>
            </div>
            <Link to="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
              Back Home
            </Link>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              {errorMsg}
            </div>
          )}

          {!isSignUp && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Continue with Google
              </button>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <div className="text-xs uppercase tracking-[0.24em] text-white/40">or</div>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form className="space-y-4" onSubmit={handleAuth}>
            {isSignUp && (
              <Field label="Full Name">
                <input
                  required
                  type="text"
                  className="w-full rounded-2xl border border-white/10 bg-[#13141c]/90 px-4 py-3 text-white outline-none transition focus:border-[#00d4aa]/50"
                  placeholder="Asritha"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>
            )}

            <Field label="Email">
              <input
                required
                type="email"
                className="w-full rounded-2xl border border-white/10 bg-[#13141c]/90 px-4 py-3 text-white outline-none transition focus:border-[#00d4aa]/50"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password">
              <input
                required
                type="password"
                className="w-full rounded-2xl border border-white/10 bg-[#13141c]/90 px-4 py-3 text-white outline-none transition focus:border-[#00d4aa]/50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {isSignUp && (
              <Field label="Role">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-[#13141c]/90 px-4 py-3 text-white outline-none transition focus:border-[#00d4aa]/50"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="employee">Employee</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="org_admin">Org Admin</option>
                </select>
              </Field>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00d4aa] to-[#7c6af7] px-5 py-3 font-semibold text-[#0d0e14] transition hover:translate-y-[-1px] disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isSignUp ? 'Create Workspace' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              className="font-semibold text-[#00d4aa] transition hover:text-white"
              onClick={() => {
                setIsSignUp((value) => !value);
                setErrorMsg('');
              }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
            <div className="flex gap-2">
              <Link to="/login?demo=hr" className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
                Demo Org
              </Link>
              <Link to="/login?demo=employee" className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
                Demo Employee
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/78">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="text-lg font-bold">{title}</div>
      <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
    </div>
  );
}
