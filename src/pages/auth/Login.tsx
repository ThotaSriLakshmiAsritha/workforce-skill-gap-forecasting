import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // If sign up is successful, create their profile manually 
        // (In production, usually done via Postgres Triggers on auth.users)
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            email: email,
            role: role
          });
          
          if (profileError) {
             console.error('Error creating profile manually:', profileError);
          }
        }
        
        // After signup without email confirmation enabled, sometimes it signs in automatically
        if (data.session) {
           navigate(role === 'employee' ? '/employee' : '/org');
        } else {
           setErrorMsg('Registration successful! Please sign in if not redirected automatically.');
           setIsSignUp(false);
        }

      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        // Profile fetching is handled in ProtectedRoute, but we can proactively route
        if (data.user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
          if (profile) {
             navigate(profile.role === 'employee' ? '/employee' : '/org');
          } else {
             // Fallback
             navigate('/');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication');
      
      // Fallback for demonstration if Supabase is NOT connected
      if (err.message?.includes('fetch') || err.message?.includes('URL') || err.message?.includes('Failed to fetch') || err.message?.includes('placeholder')) {
        setErrorMsg('Supabase is not connected. Starting full Demo Mode...');
        setTimeout(() => {
           sessionStorage.setItem('mockRole', role);
           window.location.href = role === 'employee' ? '/employee' : '/org';
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-md border">
        <div className="text-center mb-8">
           <h2 className="text-3xl font-bold text-primary mb-2">SkillSync AI</h2>
           <p className="text-muted-foreground">{isSignUp ? 'Create your account' : 'Sign in to your account'}</p>
        </div>

        {errorMsg && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md mb-6 text-sm">
            {errorMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleAuth}>
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input 
                required
                type="text" 
                className="w-full p-2.5 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none transition" 
                placeholder="John Doe" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              required
              type="email" 
              className="w-full p-2.5 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none transition" 
              placeholder="name@company.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              required
              type="password" 
              className="w-full p-2.5 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none transition" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1">Role (For Demo Purposes)</label>
              <select 
                className="w-full p-2.5 border rounded-md bg-background focus:ring-2 focus:ring-primary/50 outline-none transition"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="hr_manager">HR Manager (Dashboard)</option>
              </select>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-md font-bold mt-6 shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground mr-1">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button 
            type="button"
            className="text-primary font-semibold hover:underline"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
