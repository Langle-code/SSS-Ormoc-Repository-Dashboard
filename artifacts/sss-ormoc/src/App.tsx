import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SurveyModal } from "@/components/survey-modal";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password"
import Dashboard from "@/pages/dashboard";
import Employers from "@/pages/employers";
import UploadForm from "@/pages/upload";
import VerifyDocuments from "@/pages/verify";
import UsersPage from "@/pages/users";
import LoginHistory from "@/pages/login-history";
import JurisdictionsPage from "@/pages/jurisdictions";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/employers" component={Employers} />
      <Route path="/upload" component={UploadForm} />
      <Route path="/verify" component={VerifyDocuments} />
      <Route path="/users" component={UsersPage} />
      <Route path="/login-history" component={LoginHistory} />
      <Route path="/jurisdictions" component={JurisdictionsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <SurveyModal />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
