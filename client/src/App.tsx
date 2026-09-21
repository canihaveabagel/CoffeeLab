import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import ImportContacts from "./pages/ImportContacts";
import CoffeeChat from "./pages/CoffeeChat";
import Outreach from "./pages/Outreach";
import Recommendations from "./pages/Recommendations";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import Notebook from "./pages/Notebook";
import { trpc } from "./lib/trpc";

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: profile, isLoading } = trpc.user.getProfile.useQuery(
    undefined,
    { retry: false }
  );
  const needsOnboarding = Boolean(
    profile &&
      (!profile.onboardingCompleted ||
        !profile.school ||
        !profile.recruitingSeason ||
        !profile.recruitingRegion)
  );

  useEffect(() => {
    if (isLoading || !needsOnboarding) return;
    if (location !== "/onboarding") setLocation("/onboarding");
  }, [isLoading, location, needsOnboarding, setLocation]);

  if (location !== "/onboarding" && (isLoading || needsOnboarding)) {
    return (
      <div className="flex h-screen items-center justify-center paper-bg">
        <p className="font-mono text-sm text-[var(--color-ink-muted)]">
          Preparing your workspace…
        </p>
      </div>
    );
  }
  return children;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/contacts/:id" component={ContactDetail} />
      <Route path="/import" component={ImportContacts} />
      <Route path="/coffee-chat" component={CoffeeChat} />
      <Route path="/coffee-chat/:id" component={CoffeeChat} />
      <Route path="/outreach" component={Outreach} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/settings" component={Settings} />
      <Route path="/notebook" component={Notebook} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function WorkspaceShell() {
  const [location] = useLocation();
  if (location === "/onboarding") return <Onboarding />;

  return (
    <DashboardLayout>
      <Router />
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster theme="light" position="top-right" />
            <OnboardingGate>
              <WorkspaceShell />
            </OnboardingGate>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
