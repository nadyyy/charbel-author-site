// src/components/Footer.tsx
import { Mail, Instagram, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Divider */}
        <div className="gold-divider mb-8"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
          {/* About Section */}
          <div>
            <h3 className="serif-title text-xl text-[#d4af37] mb-4">
              Charbel Abdallah
            </h3>
            <p className="sans-body text-sm text-gray-300 leading-relaxed">
              Poet and storyteller exploring identity, resilience, and the power
              of words.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="serif-title text-lg text-[#d4af37] mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-[#d4af37] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/books"
                  className="text-gray-300 hover:text-[#d4af37] transition-colors"
                >
                  Books
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-[#d4af37] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-[#d4af37] transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="text-gray-300 hover:text-[#d4af37] transition-colors"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="serif-title text-lg text-[#d4af37] mb-4">
              Get in Touch
            </h3>

            <ul className="space-y-3 text-sm">
              {/* Email */}
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#d4af37]" />
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=charbel_g_abdallah@hotmail.com&su=Contact from Website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#d4af37] transition-colors"
                >
                  charbel_g_abdallah@hotmail.com
                </a>
              </li>

              {/* Instagram */}
              <li className="flex items-center gap-3">
                <Instagram className="w-4 h-4 text-[#d4af37]" />
                <a
                  href="https://instagram.com/bycharbelabdallah"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#d4af37] transition-colors"
                >
                  @bycharbelabdallah
                </a>
              </li>

              {/* WhatsApp */}
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#d4af37]" />
                <a
                  href="https://wa.me/96176640164"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#d4af37] transition-colors"
                >
                  +961 76 640164
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="gold-divider my-8"></div>

        {/* Copyright */}
        <div className="text-center text-gray-400 text-xs">
          <p>&copy; {currentYear} Charbel Abdallah. All rights reserved.</p>
          <p className="mt-2 text-gray-500">
            Poetry that speaks, stories that remain.
          </p>
        </div>
      </div>
    </footer>
  );
}
