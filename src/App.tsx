import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import V2Index from "./pages/V2Index";
import Auth from "./pages/Auth";
import Voices from "./pages/Voices";
import SignStudio from "./pages/SignStudio";
import StoryWall from "./pages/StoryWall";
import Press from "./pages/Press";
import Pulse from "./pages/Pulse";
import Engage from "./pages/Engage";
import Methods from "./pages/Methods";
import AdvisoryBoard from "./pages/AdvisoryBoard";
import ModerationDashboard from "./pages/ModerationDashboard";
import PersonalDashboard from "./pages/PersonalDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/voices" element={<Voices />} />
              <Route path="/story-wall" element={<StoryWall />} />
              <Route path="/studio/signs" element={<SignStudio />} />
              <Route path="/press" element={<Press />} />
              <Route path="/pulse" element={<Pulse />} />
              <Route path="/engage" element={<Engage />} />
              <Route path="/v2" element={<V2Index />} />
              <Route path="/methods-v1.0" element={<Methods />} />
              <Route path="/advisory-board" element={<AdvisoryBoard />} />
              <Route path="/moderation" element={<ModerationDashboard />} />
              <Route path="/dashboard" element={<PersonalDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
