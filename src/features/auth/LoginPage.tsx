import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";

type Mode = "sign-in" | "sign-up";

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithPassword, signUpWithPassword, resetPasswordForEmail } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error: authError } =
        mode === "sign-in"
          ? await signInWithPassword(email, password)
          : await signUpWithPassword(email, password);

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (mode === "sign-in") {
        toast.success("Signed in successfully.");
        navigate("/", { replace: true });
        return;
      }

      // Supabase requires email confirmation before a session is issued, so
      // sign-up never logs the user in directly here.
      if (data.session) {
        toast.success("Account created and signed in.");
        navigate("/", { replace: true });
      } else {
        toast.success("Account created! Check your email to confirm your address before signing in.");
        setMode("sign-in");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Enter your email above first, then click 'Forgot password'.");
      return;
    }
    const { error: resetError } = await resetPasswordForEmail(email);
    if (resetError) {
      toast.error(resetError.message);
    } else {
      toast.success("Password reset email sent. Check your inbox.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold">ReachDesk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Import. Organize. Reach out.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          >
            {mode === "sign-in" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
          <button
            type="button"
            className="text-muted-foreground underline-offset-2 hover:underline"
            onClick={handleForgotPassword}
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}
