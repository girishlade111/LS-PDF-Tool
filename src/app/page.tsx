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
  Gift,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Droplets,
  PenTool,
  Minimize2,
  Merge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavStore } from '@/store/nav-store';
import { useFileStore } from '@/store/file-store';
import { tools, categories, getToolById } from '@/lib/tools';
import { Separator } from '@/components/ui/separator';
import { ErrorBoundary as LegacyErrorBoundary } from '@/components/shared/error-boundary';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ToolErrorFallback } from '@/components/common/ToolErrorFallback';
import { RecentHistory } from '@/components/common/RecentHistory';
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
const UnlockPDFTool = lazy(() =>
  import('@/tools/unlock-pdf').then((m) => ({ default: m.UnlockPDFTool }))
);
const RepairPDFTool = lazy(() =>
  import('@/tools/repair-pdf').then((m) => ({ default: m.RepairPDFTool }))
);
const RedactPDFTool = lazy(() =>
  import('@/tools/redact-pdf').then((m) => ({ default: m.RedactPDFTool }))
);
const ComparePDFTool = lazy(() =>
  import('@/tools/compare-pdf').then((m) => ({ default: m.ComparePDFTool }))
);
const RearrangePDFTool = lazy(() =>
  import('@/tools/rearrange-pdf').then((m) => ({ default: m.RearrangePDFTool }))
);
const PDFToHTMLTool = lazy(() =>
  import('@/tools/pdf-to-html').then((m) => ({ default: m.PDFToHTMLTool }))
);
const SignPDFTool = lazy(() =>
  import('@/tools/sign-pdf').then((m) => ({ default: m.SignPDFTool }))
);
const PDFToMarkdownTool = lazy(() =>
  import('@/tools/pdf-to-markdown').then((m) => ({ default: m.PDFToMarkdownTool }))
);
const OCRPDFTool = lazy(() =>
  import('@/tools/ocr-pdf').then((m) => ({ default: m.OCRPDFTool }))
);
const SummarizePDFTool = lazy(() =>
  import('@/tools/summarize-pdf').then((m) => ({ default: m.SummarizePDFTool }))
);
const FillFormTool = lazy(() =>
  import('@/tools/fill-form').then((m) => ({ default: m.FillFormTool }))
);
const PDFToDOCXTool = lazy(() =>
  import('@/tools/pdf-to-docx').then((m) => ({ default: m.PDFToDOCXTool }))
);
const ViewPDFTool = lazy(() =>
  import('@/tools/view-pdf').then((m) => ({ default: m.ViewPDFTool }))
);
const HeaderFooterTool = lazy(() =>
  import('@/tools/header-footer').then((m) => ({ default: m.HeaderFooterTool }))
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
  'unlock': UnlockPDFTool,
  'repair': RepairPDFTool,
  'redact': RedactPDFTool,
  'compare': ComparePDFTool,
  'rearrange': RearrangePDFTool,
  'pdf-to-html': PDFToHTMLTool,
  'sign': SignPDFTool,
  'pdf-to-markdown': PDFToMarkdownTool,
  'ocr-pdf': OCRPDFTool,
  'summarize-pdf': SummarizePDFTool,
  'fill-form': FillFormTool,
  'pdf-to-docx': PDFToDOCXTool,
  'view-pdf': ViewPDFTool,
  'header-footer': HeaderFooterTool,
};

function ToolLoader() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Skeleton breadcrumb bar */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        <div className="h-3 w-3 rounded bg-muted/50 animate-pulse" />
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      </div>

      {/* Skeleton icon + title */}
      <div className="flex items-center gap-4 p-6 rounded-2xl border bg-card">
        <div className="h-12 w-12 rounded-xl bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded bg-muted/70 animate-pulse" />
        </div>
      </div>

      {/* Skeleton dropzone area */}
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/15 p-8 sm:p-10 space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-muted animate-pulse" />
        </div>
        <div className="flex justify-center">
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex justify-center">
          <div className="h-4 w-48 rounded bg-muted/70 animate-pulse" />
        </div>
      </div>

      {/* Skeleton action button */}
      <div className="flex justify-center pt-2">
        <div className="h-10 w-40 rounded-lg bg-muted animate-pulse" />
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

        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {/* Search button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-muted-foreground border-dashed shrink-0"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <div className="w-px h-5 bg-border mx-1 shrink-0" />
          <ThemeToggle />
          <div className="w-px h-5 bg-border mx-1 shrink-0" />
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                size="sm"
                className={`shrink-0 ${selectedCategory === cat.id ? '' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
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
      {/* Newsletter strip */}
      <div className="bg-gradient-to-r from-red-500/5 via-orange-500/5 to-amber-500/5 dark:from-red-500/10 dark:via-orange-500/10 dark:to-amber-500/10 border-b">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Mail className="h-4 w-4 text-red-500" />
                <h4 className="font-semibold text-sm">Stay Updated</h4>
              </div>
              <p className="text-xs text-muted-foreground max-w-sm">Get tips on PDF management and be the first to know about new tools.</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="h-9 text-sm max-w-[240px] bg-background/80"
              />
              <Button size="sm" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shrink-0">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
      description: 'Select from 31+ tools: merge, split, compress, rotate, watermark, and more.',
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
              {/* Connecting arrow between steps (visible on sm+) */}
              {index > 0 && (
                <div className="hidden sm:flex items-center absolute top-1/2 -translate-y-1/2 z-0" style={{ left: `${(index * 50) + 8}%`, width: '34%' }}>
                  <div className="w-full border-t-2 border-red-300 dark:border-red-700/50 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1">
                      <ArrowRight className="h-3.5 w-3.5 text-red-400 dark:text-red-600/70" />
                    </div>
                  </div>
                </div>
              )}
              <div
                className={`relative z-10 flex-1 flex flex-col items-center text-center px-4 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Glow effect behind step number */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-20 w-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 blur-xl" />
                {/* Gradient number circle */}
                <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white text-3xl font-bold shadow-lg shadow-red-500/20 mb-4">
                  {step.number}
                </div>
                {/* Icon below the number */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 dark:bg-muted/30 mb-3">
                  <Icon className="h-5 w-5 text-red-500 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-[280px]">{step.description}</p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────

function StatItem({ target, suffix, label, icon: Icon, startAnimating }: {
  target: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
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
      <div className="flex items-center justify-center gap-2 mb-1">
        <Icon className="h-5 w-5 text-red-500/70 dark:text-orange-400/70" />
        <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          {count}{suffix}
        </div>
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
    { target: 31, suffix: '+', label: 'PDF Tools', icon: Wrench },
    { target: 100, suffix: '%', label: 'Free Forever', icon: Gift },
    { target: 0, suffix: '', label: 'Data Uploads', icon: Shield },
    { target: 50, suffix: 'K+', label: 'Happy Users', icon: Users },
  ];

  return (
    <section ref={sectionRef} className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm relative overflow-hidden before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-br before:from-red-500/20 before:via-orange-500/10 before:to-amber-500/20 before:-z-10 before:pointer-events-none">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 sm:gap-0 relative">
          {statDefs.map((stat, index) => (
            <React.Fragment key={stat.label}>
              <StatItem
                target={stat.target}
                suffix={stat.suffix}
                label={stat.label}
                icon={stat.icon}
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
  const [searchCategory, setSearchCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Category tabs for search filtering
  const searchTabs = [
    { id: null, label: 'All' },
    ...categories.map((c) => ({ id: c.id as string | null, label: c.name })),
  ];

  const filteredTools = (() => {
    let result = query.trim()
      ? tools.filter((t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase())
        )
      : tools;
    if (searchCategory) {
      result = result.filter((t) => t.category === searchCategory);
    }
    return result;
  })();

  // Reset state when dialog opens (derived from open prop change)
  if (open && !prevOpen) {
    setPrevOpen(true);
    setQuery('');
    setSelectedIndex(0);
    setSearchCategory(null);
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

  // Load recent searches when dialog opens (derived state, not in effect)
  if (open && !prevOpen) {
    try {
      const stored = localStorage.getItem('pdf-tools-recent-searches');
      if (stored) {
        const parsed = JSON.parse(stored).slice(0, 5);
        if (JSON.stringify(parsed) !== JSON.stringify(recentSearches)) {
          setRecentSearches(parsed);
        }
      }
    } catch {
      // ignore
    }
  }

  // Derive selectedIndex reset from query change
  const effectiveSelectedIndex = Math.min(selectedIndex, Math.max(filteredTools.length - 1, 0));

  const handleSelect = (toolId: string) => {
    navigate(toolId as Parameters<typeof navigate>[0]);
    onClose();
    // Save to recent searches
    try {
      const tool = tools.find((t) => t.id === toolId);
      if (tool) {
        const stored = localStorage.getItem('pdf-tools-recent-searches');
        const existing: string[] = stored ? JSON.parse(stored) : [];
        const updated = [tool.name, ...existing.filter((n) => n !== tool.name)].slice(0, 5);
        localStorage.setItem('pdf-tools-recent-searches', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
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
      <div className="fixed left-1/2 top-[5%] sm:top-[15%] -translate-x-1/2 z-[101] w-full max-w-full sm:max-w-lg">
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

          {/* Category tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto scrollbar-thin">
            {searchTabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => { setSearchCategory(tab.id); setSelectedIndex(0); }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
                  searchCategory === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto p-2">
            {filteredTools.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                  <Search className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No tools found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Try a different search term or category
                </p>
              </div>
            ) : (
              filteredTools.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleSelect(tool.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100 animate-stagger-fade-in ${
                      index === effectiveSelectedIndex
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                    style={{ animationDelay: `${index * 40}ms` }}
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

          {/* Recent searches section */}
          {recentSearches.length > 0 && !query.trim() && (
            <div className="border-t px-4 py-2.5">
              <div className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">
                Recent
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((search) => {
                  const tool = tools.find((t) => t.name === search);
                  if (!tool) return null;
                  const RIcon = tool.icon;
                  return (
                    <button
                      key={search}
                      onClick={() => handleSelect(tool.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
                    >
                      <RIcon className="h-3 w-3" />
                      {search}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/25 animate-pulse-glow"
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
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !localStorage.getItem('pdf-tools-onboarding-dismissed');
      } catch {
        return false;
      }
    }
    return false;
  });

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem('pdf-tools-onboarding-dismissed', 'true');
    } catch {
      // ignore
    }
  }, []);

  const activeCategories = selectedCategory
    ? categories.filter((c) => c.id === selectedCategory)
    : categories;

  return (
    <section id="tools-grid" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      {/* Onboarding banner for first-time users */}
      {showOnboarding && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30 p-3 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-lg shrink-0">👋</span>
          <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
            <span className="font-medium">New here?</span> Start with <strong>Merge PDF</strong> to combine multiple files, or use <strong>Compress PDF</strong> to reduce file size.
          </p>
          <button
            onClick={dismissOnboarding}
            className="shrink-0 p-1 rounded-md hover:bg-amber-200/50 dark:hover:bg-amber-800/30 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </button>
        </div>
      )}
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
              {category.id === 'convert' && (
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] px-1.5 py-0 h-4 border-0 gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </Badge>
              )}
              {category.id === 'optimize' && (
                <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] px-1.5 py-0 h-4 border-0 gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </Badge>
              )}
              <Badge variant="outline" className="text-xs shrink-0">
                {category.description}
              </Badge>
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-500">
              {categoryTools.map((tool) => {
                const Icon = tool.icon;
                const isNewTool = ['view-pdf', 'header-footer'].includes(tool.id);
                const isAITool = ['pdf-to-markdown', 'ocr-pdf', 'summarize-pdf', 'pdf-to-docx'].includes(tool.id);
                const categoryLabel = categories.find((c) => c.id === tool.category)?.name || tool.category;
                return (
                  <a
                    key={tool.id}
                    href={`#${tool.id}`}
                    className="block no-underline"
                  >
                    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:shadow-primary/5 border-border/60 relative overflow-hidden before:absolute before:inset-0 before:rounded-lg before:p-[1px] before:bg-gradient-to-br before:from-red-500/0 before:via-orange-500/0 before:to-amber-500/0 hover:before:from-red-500/30 hover:before:via-orange-500/20 hover:before:to-amber-500/30 before:transition-all before:duration-500 before:-z-10 before:pointer-events-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] active:scale-[0.98] h-full">
                      {/* Colored left border */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${tool.bgColor} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                      {/* Gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-card to-muted/10" />
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Category badge at top-right */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted/80 dark:bg-muted/50 text-muted-foreground backdrop-blur-sm">
                          {categoryLabel}
                        </span>
                      </div>
                      <CardContent className="p-5 relative">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-2.5 rounded-xl ${tool.bgColor} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:animate-icon-glow shrink-0`}
                          >
                            <Icon className={`h-5 w-5 ${tool.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-base relative">
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
                                {/* New badge for newest tools */}
                                {isNewTool && (
                                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-1.5 py-0 h-4 border-0">
                                    New
                                  </Badge>
                                )}
                                {isAITool && (
                                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] px-1.5 py-0 h-4 border-0 gap-0.5">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    AI
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

// ─── Why Choose Counter ─────────────────────────────────────────────────────────

function WhyChooseCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 1200;
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
  }, [isVisible, target]);

  return (
    <div ref={ref} className="text-xs font-semibold text-primary/80 mt-1">
      {count}{suffix}
    </div>
  );
}

// ─── Featured Tools Section ────────────────────────────────────────────────────

function FeaturedToolsSection() {
  const { navigate } = useNavStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const featuredTools = [
    {
      id: 'view-pdf',
      name: 'View PDF',
      description: 'View and navigate PDF pages with zoom',
      icon: Eye,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    },
    {
      id: 'merge',
      name: 'Merge PDF',
      description: 'Combine multiple PDFs into one',
      icon: Merge,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      description: 'Reduce file size while keeping quality',
      icon: Minimize2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      id: 'pdf-to-text',
      name: 'PDF to Text',
      description: 'Extract text content from PDF',
      icon: FileText,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    },
    {
      id: 'watermark',
      name: 'Watermark',
      description: 'Add text or image watermark',
      icon: Droplets,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    },
    {
      id: 'sign',
      name: 'Sign PDF',
      description: 'Add digital signature to PDF',
      icon: PenTool,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 280;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-12">
      {/* Gradient background strip */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-500/[0.03] via-orange-500/[0.05] to-amber-500/[0.03] dark:from-red-500/[0.05] dark:via-orange-500/[0.08] dark:to-amber-500/[0.05]" />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold">Featured Tools</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Quick access to popular tools</p>
        </div>
        {/* Desktop arrow navigation */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="featured-scroll flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {featuredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className="group flex-shrink-0 w-[250px] rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => navigate(tool.id as Parameters<typeof navigate>[0])}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(tool.id as Parameters<typeof navigate>[0]);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${tool.bgColor} group-hover:scale-105 transition-transform duration-200 shrink-0`}>
                  <Icon className={`h-5 w-5 ${tool.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tool.description}</p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs gap-1 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(tool.id as Parameters<typeof navigate>[0]);
                  }}
                >
                  Try Now
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────

function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedToolsSection />
      <HowItWorksSection />
      <ToolsGrid />
      <RecentHistory />

      {/* Feature section - "Why Choose PDF Tools?" with glass-morphism */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border bg-gradient-to-br from-muted/50 to-muted/20 p-8 sm:p-10 relative overflow-hidden">
          {/* Animated background particles/shapes */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[10%] left-[15%] h-6 w-6 rounded-full bg-green-500/10 animate-float" />
            <div className="absolute top-[30%] right-[20%] h-4 w-4 rounded-full bg-amber-500/10 animate-float-delay-1" />
            <div className="absolute bottom-[20%] left-[30%] h-5 w-5 rounded-full bg-blue-500/10 animate-float-delay-2" />
            <div className="absolute top-[50%] right-[10%] h-3 w-3 rounded-full bg-red-500/10 animate-float-delay-3" />
            <div className="absolute bottom-[40%] left-[8%] h-4 w-4 rounded-full bg-orange-500/8 animate-float" style={{ animationDuration: '5s' }} />
            <div className="absolute top-[15%] right-[40%] h-5 w-5 rounded-full bg-emerald-500/8 animate-float-delay-2" style={{ animationDuration: '7s' }} />
          </div>
          {/* Background decorative glow */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br from-red-500/5 to-orange-500/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-gradient-to-br from-green-500/5 to-emerald-500/5 blur-3xl" />

          <h2 className="text-2xl font-bold text-center mb-8 relative">
            Why Choose PDF Tools?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Connecting dotted lines between cards (visible on sm+) */}
            <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 z-0" style={{ left: '33%', width: '34%' }}>
              <div className="w-full border-t-2 border-dashed border-green-300/40 dark:border-green-700/30" />
            </div>
            <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 z-0" style={{ left: '66%', width: '34%' }}>
              <div className="w-full border-t-2 border-dashed border-amber-300/40 dark:border-amber-700/30" />
            </div>

            {/* Private & Secure card - glass-morphism with gradient border */}
            <div className="text-center space-y-3 p-6 rounded-xl bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/50 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg hover:shadow-green-500/5 hover:scale-[1.02] hover:rotate-1 transition-all duration-300 group relative z-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 group-hover:from-green-200 group-hover:to-emerald-200 dark:group-hover:from-green-900/60 dark:group-hover:to-emerald-900/60 transition-colors duration-300">
                <Shield className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold">Private & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Files are processed entirely in your browser. Nothing is uploaded to any server.
              </p>
              <WhyChooseCounter target={0} suffix=" Data Uploads" />
            </div>

            {/* Instant Results card */}
            <div className="text-center space-y-3 p-6 rounded-xl bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/5 hover:scale-[1.02] hover:-rotate-1 transition-all duration-300 group relative z-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 group-hover:from-amber-200 group-hover:to-yellow-200 dark:group-hover:from-amber-900/60 dark:group-hover:to-yellow-900/60 transition-colors duration-300">
                <Zap className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold">Instant Results</h3>
              <p className="text-sm text-muted-foreground">
                No waiting for uploads or downloads. Process files instantly on your device.
              </p>
              <WhyChooseCounter target={100} suffix="% Client-Side" />
            </div>

            {/* Works Everywhere card */}
            <div className="text-center space-y-3 p-6 rounded-xl bg-background/50 dark:bg-background/30 backdrop-blur-sm border border-border/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:shadow-blue-500/5 hover:scale-[1.02] hover:rotate-1 transition-all duration-300 group relative z-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-900/60 dark:group-hover:to-indigo-900/60 transition-colors duration-300">
                <Globe className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold">Works Everywhere</h3>
              <p className="text-sm text-muted-foreground">
                Use on any device with a modern browser. Desktop, tablet, or mobile.
              </p>
              <WhyChooseCounter target={29} suffix="+ Tools" />
            </div>
          </div>
        </div>
      </section>

      <StatsSection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`border-b last:border-b-0 transition-colors duration-200 ${
        isOpen
          ? 'bg-muted/30 dark:bg-muted/20'
          : 'hover:bg-muted/10 dark:hover:bg-muted/5'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 sm:px-6 py-4 text-left group"
        aria-expanded={isOpen}
      >
        <span className={`text-sm sm:text-base font-medium transition-colors duration-200 pr-4 ${
          isOpen ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'
        }`}>
          {question}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-primary' : 'group-hover:text-foreground'
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-4 sm:px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: 'Is my data safe?',
      answer: 'Yes! All file processing happens entirely in your browser. Your files never leave your device. For AI-powered tools (OCR, PDF to Markdown), only page images are sent to our AI service — your original files stay local.',
    },
    {
      question: 'What are AI-powered tools?',
      answer: 'AI-powered tools like OCR PDF, PDF to Markdown, and PDF to DOCX use advanced AI models to analyze your document pages. These tools can extract text from scanned documents, convert PDFs to structured Markdown format, and create editable Word documents with high accuracy.',
    },
    {
      question: 'How do I merge multiple PDFs?',
      answer: 'Simply open the Merge PDF tool, drag and drop your PDF files, rearrange them in the order you want, and click "Merge PDFs". Your merged file will be ready for download instantly — no upload needed.',
    },
    {
      question: 'Can I use these tools offline?',
      answer: 'Most tools work entirely offline in your browser since they process files locally. AI-powered tools (OCR, PDF to Markdown) require an internet connection to communicate with our AI service.',
    },
    {
      question: "What's the maximum file size?",
      answer: 'We support files up to 100MB. For best performance, we recommend files under 50MB.',
    },
    {
      question: 'Is there a limit on how many files I can process?',
      answer: 'No limits! Process as many files as you need, completely free. No registration or account required.',
    },
  ];

  return (
    <section className="bg-muted/20 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mt-2">Everything you need to know about PDF Tools</p>
        </div>
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
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
    return (
      <div key="home" className="animate-in fade-in slide-in-from-left-2 duration-300">
        <HomePage />
      </div>
    );
  }

  const ToolComponent = toolComponents[currentPage];

  if (!ToolComponent) {
    return (
      <div key="home" className="animate-in fade-in slide-in-from-left-2 duration-300">
        <HomePage />
      </div>
    );
  }

  // The ErrorBoundary `key` is the current page id so navigating to a new
  // tool remounts the boundary and clears any previously-captured error.
  // Header & Footer live above the boundary in `Home`, so they stay
  // visible even if a tool crashes.
  return (
    <div key={currentPage} className="mx-auto max-w-3xl px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-right-2 duration-300">
      <ErrorBoundary
        key={currentPage}
        fallback={<ToolErrorFallback />}
      >
        <Suspense fallback={<ToolLoader />}>
          <ToolComponent />
        </Suspense>
      </ErrorBoundary>
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
