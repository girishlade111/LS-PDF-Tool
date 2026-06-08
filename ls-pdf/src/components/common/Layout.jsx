import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* pt-16 ensures content starts below the fixed 4rem (16) header */}
      <main className="flex-grow pt-16 bg-surface">
        {children}
      </main>
      <Footer />
    </div>
  );
}
