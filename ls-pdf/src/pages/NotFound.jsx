import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold text-text mb-4">Page Not Found</h2>
      <p className="text-muted mb-8">The page or tool you are looking for doesn't exist.</p>
      <Link to="/" className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-block">
        Go Back Home
      </Link>
    </div>
  );
}
