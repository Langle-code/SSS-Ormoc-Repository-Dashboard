import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function GeometricBackground() {
  const shapes = useMemo(
    () => [
      "top-8 left-8 h-24 w-24 rounded-full border border-white/10 bg-white/5",
      "top-24 right-16 h-36 w-36 rounded-3xl border border-cyan-300/10 bg-cyan-300/5 rotate-12",
      "bottom-14 left-12 h-28 w-28 rounded-2xl border border-white/10 bg-white/5 -rotate-12",
      "bottom-20 right-8 h-20 w-20 rounded-full border border-cyan-300/20 bg-cyan-300/10",
      "top-1/2 left-1/3 h-44 w-44 rounded-full border border-white/5 bg-white/5 blur-2xl",
    ],
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a1a3f]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(8,185,255,0.18),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_55%)]" />
      <div className="absolute inset-0 opacity-25 mix-blend-screen" style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage:
          "radial-gradient(circle at center, rgba(0,200,255,0.35) 0 2px, transparent 2px), radial-gradient(circle at center, rgba(255,255,255,0.12) 0 1px, transparent 1px)",
        backgroundSize: "90px 90px, 36px 36px",
        backgroundPosition: "0 0, 18px 18px",
      }} />
      <div className="absolute inset-0 opacity-35" style={{
        backgroundImage:
          "linear-gradient(135deg, transparent 46%, rgba(0,200,255,0.22) 47%, rgba(0,200,255,0.22) 49%, transparent 50%), linear-gradient(45deg, transparent 46%, rgba(255,255,255,0.12) 47%, rgba(255,255,255,0.12) 49%, transparent 50%)",
        backgroundSize: "120px 120px",
      }} />
      {shapes.map((shape) => (
        <div key={shape} className={`absolute ${shape}`} />
      ))}
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent via-white/10 to-white/20 opacity-20" />
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values);
    } catch {
      // handled in context
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden overflow-hidden lg:flex lg:w-[44%] flex-col text-white">
        <GeometricBackground />
        <div className="relative z-10 flex h-full flex-col justify-between px-10 py-10 xl:px-14">
          <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-black/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
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
            <div className="mt-10 flex items-center gap-4 text-cyan-200/80">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-200/60" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-10 w-10 rounded-lg border border-cyan-200/20 bg-white/8 backdrop-blur-sm" />
                <div className="h-10 w-10 rotate-12 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm" />
                <div className="h-10 w-10 rounded-md border border-cyan-200/20 bg-cyan-300/10 backdrop-blur-sm" />
              </div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-200/60" />
            </div>
          </div>
          <p className="relative z-10 text-center text-xs text-white/45">
            AB 2026. All rights reserved. Tenshi Inc.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-10 lg:w-[56%]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Email</FormLabel>
                    <FormControl>
                      <Input placeholder="juan@sss.gov.ph" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="h-11 w-full rounded-lg text-base shadow-lg" disabled={form.formState.isSubmitting} data-testid="button-login">
                {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline" data-testid="link-register">
              Create one
            </Link>
          </p>

          <div className="space-y-4 text-center">
            <Separator />
            <p className="text-xs text-muted-foreground">AB 2026. All rights reserved. Tenshi Inc.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
