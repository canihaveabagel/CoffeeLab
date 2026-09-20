import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/notebook" component={Notebook} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster theme="light" position="top-right" />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
