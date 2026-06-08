import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Menu, X } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-muted/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl" aria-label="LS PDF Home">
            <FileText size={24} className="text-primary" aria-hidden="true" />
            <span>LS PDF</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8" role="navigation" aria-label="Main navigation">
            <Link to="/" className="text-sm font-medium text-text hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/#tools" className="text-sm font-medium text-text hover:text-primary transition-colors">
              All Tools
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center px-3 py-1 text-xs font-semibold text-green-700 bg-green-50 rounded-full">
              Free & No Login Required
            </span>

            <button
              className="md:hidden p-2 rounded-lg text-text hover:bg-muted/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-muted/20 animate-slide-down">
            <nav className="flex flex-col gap-2" role="navigation" aria-label="Mobile navigation">
              <Link
                to="/"
                className="px-3 py-2 text-sm font-medium text-text hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/#tools"
                className="px-3 py-2 text-sm font-medium text-text hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                All Tools
              </Link>
            </nav>
          </div>
        )}

      </div>
      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </header>
  );
}