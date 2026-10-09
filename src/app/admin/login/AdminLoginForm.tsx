"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Welcome back, Admin");
        router.push(redirect);
        router.refresh();
      } else {
        toast.error(data.error || "Invalid password");
      }
    } catch {
      toast.error("Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <span aria-hidden className="grid size-12 place-items-center rounded-full border border-[var(--primary)] serif text-xl text-[var(--primary-fixed-dim)]">S</span>
            <span className="flex flex-col text-left">
              <span className="serif whitespace-nowrap text-xl leading-none tracking-wide">SAMSONS CAFE</span>
              <span className="mt-1 text-[9px] font-semibold tracking-[.25em] text-[var(--primary)]">ADMIN PANEL</span>
            </span>
          </Link>
          <h1 className="serif text-3xl font-semibold text-[var(--on-surface)]">Sign In</h1>
          <p className="mt-2 text-[var(--on-surface-variant)]">Enter your admin password to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--on-surface)]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-luxury w-full pr-12"
                placeholder="Enter admin password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            <span>{isLoading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--on-surface-variant)]">
          Default password: <code className="font-mono bg-[var(--surface-container-lowest)] px-1.5 py-0.5 rounded">admin123</code>
        </p>
      </div>
    </div>
  );
}