import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: Boolean(session),
    signInWithPassword: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUpWithPassword: (email: string, password: string) =>
      supabase.auth.signUp({ email, password }),
    resetPasswordForEmail: (email: string) =>
      supabase.auth.resetPasswordForEmail(email),
    signOut: () => supabase.auth.signOut(),
  };
}
