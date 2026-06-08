import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function ToolPageLayout({
  toolName,
  description,
  icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  children
}) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-muted mb-8">
        <Link to="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2 shrink-0" />
        <span className="text-text font-medium truncate">{toolName}</span>
      </nav>

      {/* Header Block */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-10">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">{toolName}</h1>
          <p className="text-muted text-lg">{description}</p>
        </div>
      </div>

      {/* Main UI Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-muted/20 p-6 sm:p-8 mb-16">
        {children}
      </div>

      {/* How It Works Section */}
      <div className="border-t border-muted/20 pt-12">
        <h2 className="text-xl font-bold text-center text-text mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-surface border border-muted/20 flex items-center justify-center text-primary font-bold text-lg mb-4">
              1
            </div>
            <p className="text-text font-medium">Upload your file</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-surface border border-muted/20 flex items-center justify-center text-primary font-bold text-lg mb-4">
              2
            </div>
            <p className="text-text font-medium">We process it in your browser</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-surface border border-muted/20 flex items-center justify-center text-primary font-bold text-lg mb-4">
              3
            </div>
            <p className="text-text font-medium">Download your result</p>
          </div>

        </div>
      </div>
      
    </div>
  );
}
