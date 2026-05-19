import { createContext, useContext, useEffect, useState } from "react";
import { useLogin, useLogout, useRegister, useGetMe } from "@workspace/api-client-react";
import type { AuthUser, LoginBody, RegisterBody } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const authQueryKey = ["/api/auth/me"];

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  register: (data: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: meData, isLoading: isMeLoading, error: meError } = useGetMe({
    query: { retry: false, queryKey: authQueryKey },
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (meData) {
      setUser(meData);
    } else if (meError) {
      setUser(null);
    }
  }, [meData, meError]);

  const login = async (data: LoginBody) => {
    try {
      const response = await loginMutation.mutateAsync({ data });
      setUser(response.user);

      if (response.showSurvey && response.surveyUrl) {
        window.dispatchEvent(new CustomEvent("show-survey", { detail: response.surveyUrl }));
      }

      await queryClient.invalidateQueries({ queryKey: authQueryKey });
      setLocation("/dashboard");
      toast({ title: "Login successful" });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.data?.error || error?.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (data: RegisterBody) => {
    try {
      const result = await registerMutation.mutateAsync({ data });
      setUser(result);
      await queryClient.invalidateQueries({ queryKey: authQueryKey });
      setLocation("/dashboard");
      toast({ title: "Registration successful" });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error?.data?.error || error?.message || "An error occurred",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      queryClient.clear();
      setLocation("/login");
    } catch {
      setUser(null);
      setLocation("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: isMeLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
