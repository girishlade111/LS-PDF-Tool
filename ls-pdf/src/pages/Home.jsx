import React from 'react';
import { Lock, Zap, BadgeCheck } from 'lucide-react';

export default function Home() {
  const handleScrollToTools = (e) => {
    e.preventDefault();
    const toolsSection = document.getElementById('tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full bg-surface py-16 px-4">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          
          <h1 className="text-3xl md:text-5xl font-bold text-text mb-6">
            Every PDF Tool You Need — <span className="text-primary">100% Free</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl">
            Merge, split, compress, convert and more. No login required. Works in your browser.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto mb-16">
            <a
              href="#tools"
              onClick={handleScrollToTools}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              Try All Tools
            </a>
            <div className="flex-1 border-2 border-muted/20 text-muted font-medium py-3 px-6 rounded-lg flex items-center justify-center cursor-default bg-white/50">
              No Sign-up Needed
            </div>
          </div>

          {/* Trust Badges */}
          <div className="w-full overflow-x-auto pb-4 -mb-4">
            <div className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-6 min-w-max px-2">
              <div className="flex items-center gap-2 text-sm font-medium text-text bg-white px-4 py-2 rounded-full shadow-sm border border-muted/10">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <span>100% Private — Files never leave your browser</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-text bg-white px-4 py-2 rounded-full shadow-sm border border-muted/10">
                <Zap className="w-4 h-4 text-[#EAB308] shrink-0" />
                <span>Instant Processing</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-text bg-white px-4 py-2 rounded-full shadow-sm border border-muted/10">
                <BadgeCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Always Free</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Tools Section Placeholder (to be built next) */}
      <section id="tools" className="py-16 px-4 min-h-[400px]">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted">Tools grid will go here...</p>
        </div>
      </section>
    </div>
  );
}
