import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WriterProvider } from "@/contexts/WriterContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StyleTest from "./pages/StyleTest";
import StyleReport from "./pages/StyleReport";
import WritingModels from "./pages/WritingModels";
import LearningPath from "./pages/LearningPath";
import CreativeWriting from "./pages/CreativeWriting";
import TeacherDashboard from "./pages/TeacherDashboard";
import FinalOutputs from "./pages/FinalOutputs";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WriterProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/style-test" element={<StyleTest />} />
            <Route path="/style-report" element={<StyleReport />} />
            <Route path="/writing-models" element={<WritingModels />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route
              path="/creative-writing"
              element={
                <ProtectedRoute requiredRole="student">
                  <CreativeWriting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher-dashboard"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/final-outputs"
              element={
                <ProtectedRoute requiredRole="student">
                  <FinalOutputs />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WriterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
