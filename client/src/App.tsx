import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useScrollToTop } from "@/hooks/useScrollToTop";

import Home from "@/pages/Home";
import Books from "@/pages/Books";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Cart from "@/pages/Cart";
import NotFound from "@/pages/NotFound";

function AppRoutes() {
  useScrollToTop();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books" element={<Books />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />

          <div className="flex flex-col min-h-screen bg-white text-black">
            <Navigation />
            <main className="flex-1">
              <AppRoutes />
            </main>
            <Footer />
          </div>

        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
