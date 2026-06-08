import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          
          <div className="text-gray-300 text-center md:text-left font-medium">
            &copy; 2025 LS PDF by{' '}
            <a 
              href="https://ladestack.in" 
              target="_blank" 
              rel="noreferrer" 
              className="text-white hover:text-primary transition-colors"
            >
              LadeStack
            </a>
          </div>
          
          <div className="flex items-center gap-6 font-medium">
            <a href="/#tools" className="text-gray-300 hover:text-white transition-colors">
              All Tools
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>

          <div className="text-gray-400 text-center md:text-right font-medium">
            100% Free. No Login. No Limits.
          </div>
          
        </div>
      </div>
    </footer>
  );
}
