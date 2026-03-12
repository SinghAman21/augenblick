import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import CreateSession from "./pages/CreateSession.tsx";
import SessionWorkspace from "./pages/SessionWorkspace.tsx";
import IdeaDetail from "./pages/IdeaDetail.tsx";
import AIPage from "./pages/AIPage.tsx";
import Profile from "./pages/Profile.tsx";
import SettingsPage from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/session/create" element={<CreateSession />} />
          <Route path="/session/:sessionId" element={<SessionWorkspace />} />
          <Route path="/session/:sessionId/ideas/:ideaId" element={<IdeaDetail />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
