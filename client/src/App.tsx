import { Route, Switch } from "wouter";

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
import Accessories from "@/pages/Accessories";
import NotFound from "@/pages/NotFound";

function AppRoutes() {
  useScrollToTop();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/books" component={Books} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/cart" component={Cart} />
      <Route path="/accessories" component={Accessories} />

      {/* catch-all */}
      <Route component={NotFound} />
    </Switch>
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
