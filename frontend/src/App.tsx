import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@clerk/react";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CreateSession from "./pages/CreateSession.tsx";
import SessionWorkspace from "./pages/SessionWorkspace.tsx";
import IdeaDetail from "./pages/IdeaDetail.tsx";
import AIPage from "./pages/AIPage.tsx";
import Profile from "./pages/Profile.tsx";
import SettingsPage from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import SignInPage from "./pages/SignInPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";

const queryClient = new QueryClient();

/** Redirects unauthenticated users to /sign-in */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null; // wait for Clerk to initialise
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/session/create" element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
          <Route path="/session/:sessionId" element={<ProtectedRoute><SessionWorkspace /></ProtectedRoute>} />
          <Route path="/session/:sessionId/ideas/:ideaId" element={<ProtectedRoute><IdeaDetail /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
