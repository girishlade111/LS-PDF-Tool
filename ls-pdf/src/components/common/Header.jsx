import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Menu, X } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">LS PDF</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-text hover:text-primary font-medium transition-colors">
              Home
            </Link>
            <a href="/#tools" className="text-text hover:text-primary font-medium transition-colors">
              All Tools
            </a>
            <span className="bg-[#22C55E]/10 text-[#22C55E] text-xs font-bold px-3 py-1.5 rounded-full">
              Free & No Login Required
            </span>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-text hover:text-primary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-muted/20 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1 flex flex-col shadow-lg">
            <Link 
              to="/" 
              className="block px-3 py-3 text-text hover:bg-surface rounded-md font-medium" 
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <a 
              href="/#tools" 
              className="block px-3 py-3 text-text hover:bg-surface rounded-md font-medium" 
              onClick={() => setIsOpen(false)}
            >
              All Tools
            </a>
            <div className="px-3 pt-3 pb-1">
              <span className="inline-block bg-[#22C55E]/10 text-[#22C55E] text-xs font-bold px-3 py-1.5 rounded-full">
                Free & No Login Required
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
