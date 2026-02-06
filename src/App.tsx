import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WriterProvider } from "@/contexts/WriterContext";
import Index from "./pages/Index";
import StyleTest from "./pages/StyleTest";
import StyleReport from "./pages/StyleReport";
import WritingModels from "./pages/WritingModels";
import LearningPath from "./pages/LearningPath";
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
            <Route path="/style-test" element={<StyleTest />} />
            <Route path="/style-report" element={<StyleReport />} />
            <Route path="/writing-models" element={<WritingModels />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WriterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
