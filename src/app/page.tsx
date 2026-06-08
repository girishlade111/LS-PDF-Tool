'use client';

import React, { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react';
import {
  FileText,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  Globe,
  Clock,
  Menu,
  X,
  ArrowUp,
  Users,
  CheckCircle2,
  Upload,
  Settings2,
  Play,
  Download,
  Wrench,
  Star,
  Search,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavStore } from '@/store/nav-store';
import { useFileStore } from '@/store/file-store';
import { tools, categories, getToolById } from '@/lib/tools';
import { Separator } from '@/components/ui/separator';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { RecentHistory } from '@/components/shared/recent-history';
import { ThemeToggle } from '@/components/shared/theme-toggle';

// Lazy load tool components
const MergePDFTool = lazy(() =>
  import('@/tools/merge-pdf').then((m) => ({ default: m.MergePDFTool }))
);
const SplitPDFTool = lazy(() =>
  import('@/tools/split-pdf').then((m) => ({ default: m.SplitPDFTool }))
);
const CompressPDFTool = lazy(() =>
  import('@/tools/compress-pdf').then((m) => ({ default: m.CompressPDFTool }))
);
const RotatePDFTool = lazy(() =>
  import('@/tools/rotate-pdf').then((m) => ({ default: m.RotatePDFTool }))
);
const PDFToJPGTool = lazy(() =>
  import('@/tools/pdf-to-jpg').then((m) => ({ default: m.PDFToJPGTool }))
);
const JPGToPDFTool = lazy(() =>
  import('@/tools/jpg-to-pdf').then((m) => ({ default: m.JPGToPDFTool }))
);
const WatermarkPDFTool = lazy(() =>
  import('@/tools/watermark-pdf').then((m) => ({ default: m.WatermarkPDFTool }))
);
const ProtectPDFTool = lazy(() =>
  import('@/tools/protect-pdf').then((m) => ({ default: m.ProtectPDFTool }))
);
const OrganizePDFTool = lazy(() =>
  import('@/tools/organize-pdf').then((m) => ({ default: m.OrganizePDFTool }))
);
const PDFToTextTool = lazy(() =>
  import('@/tools/pdf-to-text').then((m) => ({ default: m.PDFToTextTool }))
);
const PageNumbersTool = lazy(() =>
  import('@/tools/page-numbers').then((m) => ({ default: m.PageNumbersTool }))
);
const ExtractPagesTool = lazy(() =>
  import('@/tools/extract-pages').then((m) => ({ default: m.ExtractPagesTool }))
);
const EditMetadataTool = lazy(() =>
  import('@/tools/edit-metadata').then((m) => ({ default: m.EditMetadataTool }))
);
const DeletePagesTool = lazy(() =>
  import('@/tools/delete-pages').then((m) => ({ default: m.DeletePagesTool }))
);
const PDFToPNGTool = lazy(() =>
  import('@/tools/pdf-to-png').then((m) => ({ default: m.PDFToPNGTool }))
);
const FlattenPDFTool = lazy(() =>
  import('@/tools/flatten-pdf').then((m) => ({ default: m.FlattenPDFTool }))
);
const CropPDFTool = lazy(() =>
  import('@/tools/crop-pdf').then((m) => ({ default: m.CropPDFTool }))
);

const toolComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  merge: MergePDFTool,
  split: SplitPDFTool,
  compress: CompressPDFTool,
  rotate: RotatePDFTool,
  'pdf-to-jpg': PDFToJPGTool,
  'jpg-to-pdf': JPGToPDFTool,
  watermark: WatermarkPDFTool,
  protect: ProtectPDFTool,
  organize: OrganizePDFTool,
  'pdf-to-text': PDFToTextTool,
  'page-numbers': PageNumbersTool,
  'extract-pages': ExtractPagesTool,
  'edit-metadata': EditMetadataTool,
  'delete-pages': DeletePagesTool,
  'pdf-to-png': PDFToPNGTool,
  'flatten': FlattenPDFTool,
  'crop-pdf': CropPDFTool,
};

function ToolLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading tool...</p>
      </div>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────

// Shared state for category filtering and search
const CategoryFilterContext = React.createContext<{
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}>({
  selectedCategory: null,
  setSelectedCategory: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
});

function Header() {
  const { currentPage, goHome } = useNavStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { selectedCategory, setSelectedCategory, setSearchOpen } = React.useContext(CategoryFilterContext);

  const handleCategoryClick = (catId: string) => {
    if (selectedCategory === catId) {
      setSelectedCategory(null); // toggle off
    } else {
      setSelectedCategory(catId);
    }
    goHome();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => { goHome(); setSelectedCategory(null); }}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight tracking-tight">
              PDF Tools
            </span>
            <span className="text-[10px] text-muted-foreground leading-none hidden sm:block">
              Free Online PDF Editor
            </span>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {/* Search button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-muted-foreground border-dashed"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <ThemeToggle />
          <div className="w-px h-5 bg-border mx-1" />
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'ghost'}
              size="sm"
              className={selectedCategory === cat.id ? '' : 'text-muted-foreground hover:text-foreground'}
              onClick={() => handleCategoryClick(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                size="sm"
                className={`w-full justify-start ${selectedCategory === cat.id ? '' : 'text-muted-foreground'}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.name}
                {selectedCategory === cat.id && ' ✓'}
              </Button>
            ))}
            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => { setSelectedCategory(null); setMobileMenuOpen(false); }}
              >
                Show All Tools
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">PDF Tools</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Free, secure, and fast PDF tools. All processing happens in your browser — your files never leave your device.
            </p>
            {/* Social proof */}
            <div className="flex items-center gap-2 pt-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Join 50,000+ users who trust PDF Tools</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Convert</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tools.filter((t) => t.category === 'convert').map((tool) => (
                <li key={tool.id}>
                  <FooterLink id={tool.id}>{tool.name}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Organize & Optimize</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tools.filter((t) => t.category === 'organize' || t.category === 'optimize').map((tool) => (
                <li key={tool.id}>
                  <FooterLink id={tool.id}>{tool.name}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Security</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {tools.filter((t) => t.category === 'security').map((tool) => (
                <li key={tool.id}>
                  <FooterLink id={tool.id}>{tool.name}</FooterLink>
                </li>
              ))}
            </ul>
            <Separator className="my-3" />
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1.5 text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Globe className="h-3.5 w-3.5" />
                <span>No Upload</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PDF Tools. All processing runs locally in your browser.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> Fast & Free
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> Private
            </span>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </footer>
  );
}

function FooterLink({ id, children }: { id: string; children: React.ReactNode }) {
  const { navigate } = useNavStore();
  return (
    <button
      onClick={() => navigate(id as Parameters<typeof navigate>[0])}
      className="hover:text-foreground hover:underline underline-offset-4 transition-all duration-200"
    >
      {children}
    </button>
  );
}

// ─── How It Works Section ─────────────────────────────────────────────────────

function HowItWorksSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: 1,
      title: 'Upload Your PDF',
      description: 'Drag & drop or click to upload your file. We support PDF, JPG, and PNG formats.',
      icon: Upload,
    },
    {
      number: 2,
      title: 'Choose Your Tool',
      description: 'Select from 15+ tools: merge, split, compress, rotate, watermark, and more.',
      icon: Wrench,
    },
    {
      number: 3,
      title: 'Download Result',
      description: 'Your processed file is ready instantly. Download with one click.',
      icon: Download,
    },
  ];

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <p className="text-muted-foreground mt-2">Three simple steps to process your PDFs</p>
      </div>

      <div className="relative flex flex-col sm:flex-row items-stretch justify-center gap-8 sm:gap-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.number}>
              {/* Connecting dotted line between steps (visible on sm+) */}
              {index > 0 && (
                <div className="hidden sm:flex items-center absolute top-1/2 -translate-y-1/2 z-0" style={{ left: `${(index * 50) + 8}%`, width: '34%' }}>
                  <div className="w-full border-t-2 border-dashed border-red-300 dark:border-red-700/50" />
                </div>
              )}
              <div
                className={`relative z-10 flex-1 flex flex-col items-center text-center px-4 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Gradient number circle */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white text-2xl font-bold shadow-lg shadow-red-500/20 mb-4">
                  {step.number}
                </div>
                {/* Icon below the number */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 dark:bg-muted/30 mb-3">
                  <Icon className="h-5 w-5 text-red-500 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">{step.description}</p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────

function StatItem({ target, suffix, label, startAnimating }: {
  target: number;
  suffix: string;
  label: string;
  startAnimating: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startAnimating) return;
    const duration = 1500;
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [startAnimating, target]);

  return (
    <div className="text-center flex-1">
      <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const statDefs = [
    { target: 15, suffix: '+', label: 'PDF Tools' },
    { target: 100, suffix: '%', label: 'Free Forever' },
    { target: 0, suffix: '', label: 'Data Uploads' },
    { target: 50, suffix: 'K+', label: 'Happy Users' },
  ];

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 sm:gap-0">
          {statDefs.map((stat, index) => (
            <React.Fragment key={stat.label}>
              <StatItem
                target={stat.target}
                suffix={stat.suffix}
                label={stat.label}
                startAnimating={isVisible}
              />
              {index < statDefs.length - 1 && (
                <div className="hidden sm:block h-8 w-px bg-border shrink-0" />
              )}
              {index < statDefs.length - 1 && index === 1 && (
                <div className="sm:hidden h-px w-16 bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials Section ────────────────────────────────────────────────────

function TestimonialsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      name: 'Alex M.',
      role: 'Freelance Designer',
      quote: 'PDF Tools saved me hours of work. The merge and compress features are incredibly fast and easy to use. No more desktop software needed!',
      initials: 'AM',
      avatarBg: 'bg-gradient-to-br from-red-500 to-orange-500',
    },
    {
      name: 'Sarah K.',
      role: 'Marketing Manager',
      quote: "I love that everything runs in the browser. No uploads, no privacy concerns. It's exactly what our team needed for quick document processing.",
      initials: 'SK',
      avatarBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
    },
    {
      name: 'David R.',
      role: 'Software Developer',
      quote: 'Clean, fast, and reliable. The watermark and page number tools are surprisingly powerful for a free browser-based app. Highly recommended.',
      initials: 'DR',
      avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    },
  ];

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Trusted by Thousands</h2>
        <p className="text-muted-foreground mt-2">See what our users say about PDF Tools</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.name}
            className={`rounded-xl border bg-card p-6 shadow-sm transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            {/* Star rating */}
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              &ldquo;{testimonial.quote}&rdquo;
            </p>

            {/* User info */}
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${testimonial.avatarBg} text-white text-xs font-bold shrink-0`}>
                {testimonial.initials}
              </div>
              <div>
                <div className="text-sm font-semibold">{testimonial.name}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────

// ─── Search Dialog ────────────────────────────────────────────────────────────

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { navigate } = useNavStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevOpen, setPrevOpen] = useState(false);

  const filteredTools = query.trim()
    ? tools.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase())
      )
    : tools;

  // Reset state when dialog opens (derived from open prop change)
  if (open && !prevOpen) {
    setPrevOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }
  if (!open && prevOpen) {
    setPrevOpen(false);
  }

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Derive selectedIndex reset from query change
  const effectiveSelectedIndex = Math.min(selectedIndex, Math.max(filteredTools.length - 1, 0));

  const handleSelect = (toolId: string) => {
    navigate(toolId as Parameters<typeof navigate>[0]);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredTools.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredTools[effectiveSelectedIndex]) {
      handleSelect(filteredTools[effectiveSelectedIndex].id);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 z-[101] w-full max-w-lg">
        <div className="mx-4 rounded-xl border bg-card shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search tools... (e.g., merge, compress, watermark)"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredTools.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No tools found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredTools.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSelect(tool.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100 ${
                      index === effectiveSelectedIndex
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${tool.bgColor} shrink-0`}>
                      <Icon className={`h-4 w-4 ${tool.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                    </div>
                    {index === effectiveSelectedIndex && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyboardShortcuts() {
  const { goHome } = useNavStore();
  const { setSearchOpen } = React.useContext(CategoryFilterContext);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape → go home or close search
      if (e.key === 'Escape') {
        goHome();
      }
      // Ctrl/Cmd+K → open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    },
    [goHome, setSearchOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Keyboard shortcut hint badge (desktop only) */}
      <div className="fixed bottom-4 left-4 z-40 hidden md:flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
        <kbd className="font-mono text-[11px]">⌘K</kbd>
        <span>Search</span>
        <span className="text-border">·</span>
        <kbd className="font-mono text-[11px]">Esc</kbd>
        <span>Home</span>
      </div>
    </>
  );
}

function HeroSection() {
  const { navigate } = useNavStore();

  return (
    <section className="relative overflow-hidden">
      {/* Background decoration with particle/dot pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-red-500/5 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute -bottom-10 left-1/2 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Floating decorative PDF page shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-[8%] animate-float">
          <div className="h-16 w-12 rounded-sm border border-red-200/30 dark:border-red-800/20 bg-gradient-to-br from-red-50/40 to-orange-50/20 dark:from-red-950/20 dark:to-orange-950/10 shadow-sm rotate-[-15deg]" />
        </div>
        <div className="absolute top-24 right-[12%] animate-float-delay-1">
          <div className="h-20 w-14 rounded-sm border border-orange-200/30 dark:border-orange-800/20 bg-gradient-to-br from-orange-50/40 to-amber-50/20 dark:from-orange-950/20 dark:to-amber-950/10 shadow-sm rotate-[12deg]" />
        </div>
        <div className="absolute bottom-20 left-[15%] animate-float-delay-2">
          <div className="h-14 w-10 rounded-sm border border-amber-200/30 dark:border-amber-800/20 bg-gradient-to-br from-amber-50/40 to-yellow-50/20 dark:from-amber-950/20 dark:to-yellow-950/10 shadow-sm rotate-[-8deg]" />
        </div>
        <div className="absolute bottom-32 right-[8%] animate-float-delay-3">
          <div className="h-18 w-12 rounded-sm border border-red-200/30 dark:border-red-800/20 bg-gradient-to-br from-red-50/40 to-orange-50/20 dark:from-red-950/20 dark:to-orange-950/10 shadow-sm rotate-[18deg]" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl text-center py-16 sm:py-20 px-4">
        <Badge variant="secondary" className="mb-6 px-3 py-1 text-xs">
          <Sparkles className="h-3 w-3 mr-1.5" />
          100% Browser-Based — Your Files Never Leave Your Device
        </Badge>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
          Every PDF Tool You{' '}
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
            Need
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Merge, split, compress, rotate, watermark, and convert your PDFs — all for free, all in your browser.
          No registration, no uploads, no limits.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/25 animate-glow"
            onClick={() => navigate('merge')}
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            onClick={() => {
              document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Browse All Tools
          </Button>
        </div>

        {/* Trust badges with hover pulse */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200 cursor-default">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Shield className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            </div>
            <span>100% Secure</span>
          </div>
          <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200 cursor-default">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span>Lightning Fast</span>
          </div>
          <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200 cursor-default">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Works Offline</span>
          </div>
          <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200 cursor-default">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <span>No Registration</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Tools Grid ────────────────────────────────────────────────────────────────

function ToolsGrid() {
  const { navigate } = useNavStore();
  const { selectedCategory, setSelectedCategory } = React.useContext(CategoryFilterContext);

  const activeCategories = selectedCategory
    ? categories.filter((c) => c.id === selectedCategory)
    : categories;

  return (
    <section id="tools-grid" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      {/* Active filter indicator */}
      {selectedCategory && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Showing:</span>
          <Badge variant="secondary" className="gap-1">
            {categories.find((c) => c.id === selectedCategory)?.name}
            <button
              onClick={() => setSelectedCategory(null)}
              className="ml-1 hover:text-destructive transition-colors"
              aria-label="Clear filter"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
      {activeCategories.map((category) => {
        const categoryTools = tools.filter((t) => t.category === category.id);
        if (categoryTools.length === 0) return null;

        return (
          <div key={category.id} className="mb-10">
            {/* Category section divider with gradient */}
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <h2 className="text-xl font-semibold shrink-0">{category.name}</h2>
              <Badge variant="outline" className="text-xs shrink-0">
                {category.description}
              </Badge>
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <a
                    key={tool.id}
                    href={`#${tool.id}`}
                    className="block no-underline"
                  >
                    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:shadow-primary/5 border-muted relative overflow-hidden">
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="p-5 relative">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-2.5 rounded-xl ${tool.bgColor} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md shrink-0`}
                          >
                            <Icon className={`h-5 w-5 ${tool.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm relative">
                                  {tool.name}
                                  {/* Animated underline on hover */}
                                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gradient-to-r from-red-500 to-orange-500 group-hover:w-full transition-all duration-300" />
                                </h3>
                                {/* Popular badge for Merge PDF */}
                                {tool.id === 'merge' && (
                                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] px-1.5 py-0 h-4 border-0">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <RecentHistory />
      <ToolsGrid />

      {/* Feature section - "Why Choose PDF Tools?" with glass-morphism */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border bg-gradient-to-br from-muted/50 to-muted/20 p-8 sm:p-10 relative overflow-hidden">
          {/* Background decorative glow */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br from-red-500/5 to-orange-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-gradient-to-br from-green-500/5 to-emerald-500/5 blur-3xl" />

          <h2 className="text-2xl font-bold text-center mb-8 relative">
            Why Choose PDF Tools?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Private & Secure card - glass-morphism with gradient border */}
            <div className="text-center space-y-3 p-6 rounded-xl bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/50 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg hover:shadow-green-500/5 hover:scale-[1.02] transition-all duration-300 group">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 group-hover:from-green-200 group-hover:to-emerald-200 dark:group-hover:from-green-900/60 dark:group-hover:to-emerald-900/60 transition-colors duration-300">
                <Shield className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold">Private & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Files are processed entirely in your browser. Nothing is uploaded to any server.
              </p>
            </div>

            {/* Instant Results card */}
            <div className="text-center space-y-3 p-6 rounded-xl bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/5 hover:scale-[1.02] transition-all duration-300 group">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 group-hover:from-amber-200 group-hover:to-yellow-200 dark:group-hover:from-amber-900/60 dark:group-hover:to-yellow-900/60 transition-colors duration-300">
                <Zap className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold">Instant Results</h3>
              <p className="text-sm text-muted-foreground">
                No waiting for uploads or downloads. Process files instantly on your device.
              </p>
            </div>

            {/* Works Everywhere card */}
            <div className="text-center space-y-3 p-6 rounded-xl bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/5 hover:scale-[1.02] transition-all duration-300 group">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-900/60 dark:group-hover:to-indigo-900/60 transition-colors duration-300">
                <Globe className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold">Works Everywhere</h3>
              <p className="text-sm text-muted-foreground">
                Use on any device with a modern browser. Desktop, tablet, or mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      <StatsSection />
      <TestimonialsSection />
    </>
  );
}

// ─── Tool Page Router ──────────────────────────────────────────────────────────

function ToolPageRouter() {
  const { currentPage } = useNavStore();
  const { resetAll } = useFileStore();

  const prevPage = React.useRef(currentPage);

  useEffect(() => {
    // Reset file store when navigating to a different tool
    if (prevPage.current !== currentPage) {
      resetAll();
      prevPage.current = currentPage;
    }
  }, [currentPage, resetAll]);

  if (currentPage === 'home') {
    return <HomePage />;
  }

  const ToolComponent = toolComponents[currentPage];

  if (!ToolComponent) {
    return <HomePage />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <Suspense fallback={<ToolLoader />}>
        <ToolComponent />
      </Suspense>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <CategoryFilterContext.Provider value={{ selectedCategory, setSelectedCategory, searchOpen, setSearchOpen }}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <ErrorBoundary>
            <ToolPageRouter />
          </ErrorBoundary>
        </main>
        <Footer />
        <KeyboardShortcuts />
        <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </CategoryFilterContext.Provider>
  );
}
