import { supabase } from './supabaseClient';

export async function signInWithGoogle(): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://workforce-skill-gap-forecasting.vercel.app/auth/callback',
      },
    });

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to sign in with Google.';
    throw new Error(message);
  }
}

export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to sign out.';
    throw new Error(message);
  }
}
