import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useListJurisdictions } from "@workspace/api-client-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState, useMemo } from "react";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "account_officer"]),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const { data: jurisdictionData } = useListJurisdictions();
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", name: "", role: "account_officer" },
  });

  const allJurisdictions = useMemo(() => {
    if (!jurisdictionData?.categories) return [];
    return jurisdictionData.categories.flatMap((cat) => cat.items);
  }, [jurisdictionData]);

  const role = form.watch("role");

  const addJurisdiction = (value: string) => {
    if (value === "All Jurisdictions") {
      setSelectedJurisdictions(["All Jurisdictions"]);
    } else if (!selectedJurisdictions.includes(value)) {
      setSelectedJurisdictions((prev) =>
        prev.filter((j) => j !== "All Jurisdictions").concat(value)
      );
    }
  };

  const removeJurisdiction = (value: string) => {
    setSelectedJurisdictions((prev) => prev.filter((j) => j !== value));
  };

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    const jurisdictions = selectedJurisdictions.length > 0 ? selectedJurisdictions : [];
    try {
      await registerUser({ ...values, jurisdictions });
    } catch {
      // handled by auth context
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
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

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill in the details below to get started
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Dela Cruz" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Min. 6 characters" {...field} data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="account_officer">Account Officer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-sm font-medium leading-none">Jurisdictions</label>
                <Select onValueChange={addJurisdiction}>
                  <SelectTrigger className="mt-2" data-testid="select-jurisdiction">
                    <SelectValue placeholder="Select jurisdictions..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {role === "admin" && (
                      <SelectItem value="All Jurisdictions">All Jurisdictions</SelectItem>
                    )}
                    {jurisdictionData?.categories?.map((cat) => (
                      <div key={cat.category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {cat.category}
                        </div>
                        {cat.items.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                {selectedJurisdictions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedJurisdictions.map((j) => (
                      <Badge key={j} variant="secondary" className="gap-1">
                        {j}
                        <button type="button" onClick={() => removeJurisdiction(j)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting} data-testid="button-register">
                {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
