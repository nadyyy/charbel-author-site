import { useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Link } from "wouter";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { state } = useCart();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/books", label: "Books" },
    { href: "/accessories", label: "Accessories" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
   

  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo/logo-white.png"
              alt="Charbel Abdallah logo"
              className="h-13 w-auto md:h-16"
            />
            <div className="flex flex-col leading-tight">
              <span className="serif-title text-xl md:text-2xl text-black">
                Charbel
              </span>
              <span className="serif-title text-xl md:text-2xl text-[#d4af37]">
                Abdallah
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="sans-body text-sm font-medium text-black hover:text-[#d4af37] transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative hover:text-[#d4af37] transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {state.items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#d4af37] text-black text-[10px] font-medium rounded-full px-1.5 leading-none">
                  {state.items.length}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:text-[#d4af37]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-3 text-sm font-medium text-black hover:text-[#d4af37]"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="block py-3 text-sm font-medium text-black hover:text-[#d4af37]"
            >
              Cart {state.items.length > 0 && `(${state.items.length})`}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
