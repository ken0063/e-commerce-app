import { supabase } from './client'

// Ensures a profile row exists for the given user. Safe to call multiple times.
async function ensureProfileForUser(userId: string, email: string | null) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: email ?? undefined }, { onConflict: 'id' })
  if (error) throw error
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  // App-side profile creation (safe to skip if you use a DB trigger)
  const user = data.user
  if (user?.id) {
    await ensureProfileForUser(user.id, user.email as string | null)
  }

  return data
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// Starts an OAuth sign-in/sign-up flow. The user is redirected to the provider and
// then back to redirectTo (defaults to window.location.origin or a provided path).
export async function signInWithOAuth(
  provider: 'google' | 'github' | 'apple',
  options?: { redirectPath?: string },
) {
  const base = typeof window !== 'undefined' ? window.location.origin : undefined
  const redirectTo = base && options?.redirectPath ? `${base}${options.redirectPath}` : base

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })
  if (error) throw error
  return data
}

// Call this on your OAuth callback page to finalize the session and ensure profile.
export async function handlePostAuth() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  const user = data.user
  if (user?.id) {
    await ensureProfileForUser(user.id, user.email as string | null)
  }
  return user ?? null
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

// Subscribe to auth state changes. Ensures profile on SIGNED_IN automatically.
export function onAuthChanges(
  cb: (event: string, session: import('@supabase/supabase-js').Session | null) => void,
) {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.id) {
      try {
        await ensureProfileForUser(session.user.id, session.user.email as string | null)
      } catch (error) {
        console.error(error)
      }
    }
    cb(event, session)
  })
  // return an unsubscribe function for convenience
  return () => data.subscription.unsubscribe()
}
