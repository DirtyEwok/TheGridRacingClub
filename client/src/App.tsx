import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Races from "@/pages/races";
import Championships from "@/pages/championships";
import Leaderboards from "@/pages/leaderboards";
import ComingSoon from "@/pages/coming-soon";
import Chat from "@/pages/chat";
import Admin from "@/pages/admin";
import AdminMemberApproval from "@/pages/admin-members";
import MemberProfile from "@/pages/member-profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Races} />
      <Route path="/races" component={Races} />
      <Route path="/championships" component={Championships} />
      <Route path="/leaderboards" component={Leaderboards} />
      <Route path="/coming-soon" component={ComingSoon} />
      <Route path="/chat" component={Chat} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/members" component={AdminMemberApproval} />
      <Route path="/members/:id/profile" component={MemberProfile} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-black text-white font-racing">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
