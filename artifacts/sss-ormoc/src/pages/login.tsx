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
    } catch (error) {
      // Error handled by AuthContext
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-900 opacity-90 z-0"></div>
        
        {/* Background Pattern/Image */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay z-0" 
             style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1577415124269-3187ca0ee0be?auto=format&fit=crop&q=80&w=2000")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-primary font-bold text-xl">
              SSS
            </div>
            <h1 className="text-2xl font-bold">Ormoc Branch</h1>
          </div>
          <div className="mt-20">
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Digital R-1/R-1A Repository <br/> and Dashboard
            </h2>
            <p className="text-lg text-primary-foreground/80 max-w-md">
              Internal government document management system. Securely upload, verify, and track employer registration forms.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 mt-auto pt-10">
          <p className="text-sm text-primary-foreground/60">
            AB 2026. All rights reserved. Tenshi Inc.
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email and password to access the dashboard
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
