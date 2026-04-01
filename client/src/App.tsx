import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Topics from "./pages/Topics";
import TopicDetail from "./pages/TopicDetail";
import Practice from "./pages/Practice";
import Result from "./pages/Result";
import History from "./pages/History";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/topics" component={Topics} />
      <Route path="/topics/:id" component={TopicDetail} />
      <Route path="/practice/:id" component={Practice} />
      <Route path="/result/:ids" component={Result} />
      <Route path="/history" component={History} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
