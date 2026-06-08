'use client';

import React, { useEffect, lazy, Suspense } from 'react';
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

function Header() {
  const { currentPage, goHome } = useNavStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={goHome}
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
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={goHome}
            >
              {cat.name}
            </Button>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => {
                  goHome();
                  setMobileMenuOpen(false);
                }}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
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
    </footer>
  );
}

function FooterLink({ id, children }: { id: string; children: React.ReactNode }) {
  const { navigate } = useNavStore();
  return (
    <button
      onClick={() => navigate(id as any)}
      className="hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection() {
  const { navigate } = useNavStore();

  return (
    <section className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-red-500/5 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute -bottom-10 left-1/2 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center py-16 sm:py-20 px-4">
        <Badge variant="secondary" className="mb-6 px-3 py-1 text-xs">
          <Sparkles className="h-3 w-3 mr-1.5" />
          100% Browser-Based — Your Files Never Leave Your Device
        </Badge>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
          Every PDF Tool You{' '}
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
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
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/20"
            onClick={() => navigate('merge')}
          >
            Get Started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => {
              document.getElementById('tools-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Browse All Tools
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span>100% Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" />
            <span>Lightning Fast</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span>Works Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
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

  return (
    <section id="tools-grid" className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      {categories.map((category) => {
        const categoryTools = tools.filter((t) => t.category === category.id);
        if (categoryTools.length === 0) return null;

        return (
          <div key={category.id} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-semibold">{category.name}</h2>
              <Badge variant="outline" className="text-xs">
                {category.description}
              </Badge>
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
                    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-muted">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-2.5 rounded-xl ${tool.bgColor} transition-colors shrink-0`}
                          >
                            <Icon className={`h-5 w-5 ${tool.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-sm">{tool.name}</h3>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
      <RecentHistory />
      <ToolsGrid />

      {/* Feature section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-2xl border bg-gradient-to-br from-muted/50 to-muted/20 p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why Choose PDF Tools?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Private & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Files are processed entirely in your browser. Nothing is uploaded to any server.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold">Instant Results</h3>
              <p className="text-sm text-muted-foreground">
                No waiting for uploads or downloads. Process files instantly on your device.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Works Everywhere</h3>
              <p className="text-sm text-muted-foreground">
                Use on any device with a modern browser. Desktop, tablet, or mobile.
              </p>
            </div>
          </div>
        </div>
      </section>
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
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <ToolPageRouter />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
