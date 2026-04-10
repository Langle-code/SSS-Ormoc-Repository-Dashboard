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

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

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
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-900 z-0" />
        <div
          className="absolute inset-0 opacity-10 mix-blend-overlay z-0"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1577415124269-3187ca0ee0be?auto=format&fit=crop&q=80&w=2000")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative z-10 flex flex-col flex-1 items-center justify-center text-center px-12">
          <img
            src="/sss-logo.png"
            alt="SSS Logo"
            className="h-28 w-28 rounded-xl object-contain mb-6 shadow-lg"
          />
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">SSS</h1>
          <h2 className="text-xl font-semibold mt-1">Ormoc Branch</h2>
          <p className="mt-3 text-lg font-medium text-primary-foreground/90 leading-snug">
            SSS Digital Repository<br />and Dashboard
          </p>
        </div>

        <div className="relative z-10 pb-6 text-center">
          <p className="text-xs text-primary-foreground/50">
            AB 2026. All rights reserved. Tenshi Inc.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@sss.gov.ph" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
