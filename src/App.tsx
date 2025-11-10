import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";

// Eager load the main landing page
import Index from "./pages/Index";

// Lazy load all other pages for code splitting
const V2Index = lazy(() => import("./pages/V2Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Voices = lazy(() => import("./pages/Voices"));
const SignStudio = lazy(() => import("./pages/SignStudio"));
const StoryWall = lazy(() => import("./pages/StoryWall"));
const Press = lazy(() => import("./pages/Press"));
const Pulse = lazy(() => import("./pages/Pulse"));
const Engage = lazy(() => import("./pages/Engage"));
const Methods = lazy(() => import("./pages/Methods"));
const AdvisoryBoard = lazy(() => import("./pages/AdvisoryBoard"));
const ModerationDashboard = lazy(() => import("./pages/ModerationDashboard"));
const PersonalDashboard = lazy(() => import("./pages/PersonalDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
