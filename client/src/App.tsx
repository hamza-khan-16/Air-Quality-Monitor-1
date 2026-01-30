import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import LiveMonitor from "@/pages/LiveMonitor";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LiveMonitor} />
      <Route path="/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="font-body selection:bg-primary/20">
        <Router />
        <Navigation />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
