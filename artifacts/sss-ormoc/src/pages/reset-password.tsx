import { useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const API_BASE = "";

function GeometricBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a1a3f]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(8,185,255,0.18),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-25 mix-blend-screen"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(0,200,255,0.35) 0 2px, transparent 2px), radial-gradient(circle at center, rgba(255,255,255,0.12) 0 1px, transparent 1px)",
          backgroundSize: "90px 90px, 36px 36px",
          backgroundPosition: "0 0, 18px 18px",
        }}
      />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(135deg, transparent 46%, rgba(0,200,255,0.22) 47%, rgba(0,200,255,0.22) 49%, transparent 50%), linear-gradient(45deg, transparent 46%, rgba(255,255,255,0.12) 47%, rgba(255,255,255,0.12) 49%, transparent 50%)",
          backgroundSize: "120px 120px",
        }}
      />
      <div className="absolute top-8 left-8 h-24 w-24 rounded-full border border-white/10 bg-white/5" />
      <div className="absolute top-24 right-16 h-36 w-36 rounded-3xl border border-cyan-300/10 bg-cyan-300/5 rotate-12" />
      <div className="absolute bottom-14 left-12 h-28 w-28 rounded-2xl border border-white/10 bg-white/5 -rotate-12" />
      <div className="absolute bottom-20 right-8 h-20 w-20 rounded-full border border-cyan-300/20 bg-cyan-300/10" />
    </div>
  );
}

export default function ResetPassword() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isInvalidToken = !token;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[44%] flex-col text-white">
        <GeometricBackground />
        <div className="relative z-10 flex h-full flex-col justify-between px-10 py-10 xl:px-14">
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-sm">
              <img src="/sss-logo.png" alt="SSS Logo" className="h-20 w-20 object-contain" />
            </div>
            <p className="mb-2 text-xs font-semibold tracking-[0.35em] text-white/70 uppercase">
              SSS ORMOC BRANCH
            </p>
            <h1 className="max-w-sm text-4xl font-extrabold leading-tight xl:text-5xl">
              SSS Ormoc Branch Innovation
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
              Digital R-1/R-1A Repository and Dashboard
            </p>
          </div>
          <p className="relative z-10 text-center text-xs text-white/45">
            AB 2026. All rights reserved. Tenshi Inc.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center px-6 py-10 lg:w-[56%]">
        <div className="w-full max-w-md space-y-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Password updated!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
              <Button asChild className="w-full h-11">
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          ) : isInvalidToken ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Invalid reset link</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This reset link is missing or invalid. Please request a new one.
                </p>
              </div>
              <Button asChild className="w-full h-11">
                <Link href="/forgot-password">Request new link</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Set new password</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>

              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{" "}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
                <Separator />
                <p className="text-xs text-muted-foreground">AB 2026. All rights reserved. Tenshi Inc.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
