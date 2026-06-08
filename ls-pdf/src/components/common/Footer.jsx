import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-text text-white mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-center md:text-left">
            <p className="font-medium">© 2025 LS PDF by LadeStack</p>
            <a
              href="https://ladestack.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center md:justify-start gap-1 text-muted hover:text-white transition-colors mt-1"
            >
              ladestack.in
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4" aria-label="Footer links">
            <Link
              to="/#tools"
              className="text-muted hover:text-white transition-colors"
            >
              All Tools
            </Link>
            <a
              href="#"
              className="text-muted hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
          </nav>

          <div className="text-center md:text-right">
            <p className="text-muted font-medium">
              100% Free. No Login. No Limits.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}