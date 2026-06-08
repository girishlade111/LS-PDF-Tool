'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useNavStore } from '@/store/nav-store';

interface LegalLayoutProps {
  title: string;
  description?: string;
  lastUpdated?: string;
  effectiveDate?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Shared layout component for legal/informational pages.
 * Provides a consistent header, footer, and styling across all such pages.
 */
export function LegalLayout({
  title,
  description,
  lastUpdated,
  effectiveDate,
  children,
  icon,
}: LegalLayoutProps) {
  const { goHome } = useNavStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md shadow-sm">
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

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goHome}
              className="hidden sm:flex gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Tools
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goHome}
              className="sm:hidden"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Page Header */}
          <div className="mb-8 sm:mb-10 animate-page-enter">
            <div className="flex items-start gap-4 mb-4">
              {icon && (
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white shrink-0 shadow-lg shadow-red-500/20">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                  {title}
                </h1>
                {description && (
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {(lastUpdated || effectiveDate) && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                {lastUpdated && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last updated: {lastUpdated}</span>
                  </div>
                )}
                {effectiveDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Effective: {effectiveDate}</span>
                  </div>
                )}
              </div>
            )}

            <Separator className="mt-6" />
          </div>

          {/* Content */}
          <article className="prose prose-slate dark:prose-invert max-w-none animate-page-enter" style={{ animationDelay: '100ms' }}>
            {children}
          </article>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Related Pages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RelatedLink href="/about" title="About Us" description="Learn more about our mission and team" />
              <RelatedLink href="/privacy" title="Privacy Policy" description="How we protect your data and privacy" />
              <RelatedLink href="/terms" title="Terms & Conditions" description="The legal terms for using our service" />
              <RelatedLink href="/contact" title="Contact Us" description="Get in touch with our support team" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} PDF Tools. All processing runs locally in your browser.</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RelatedLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col p-4 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all duration-200"
    >
      <span className="font-medium text-sm group-hover:text-primary transition-colors">
        {title}
      </span>
      <span className="text-xs text-muted-foreground mt-1">
        {description}
      </span>
    </Link>
  );
}

/**
 * Reusable section component for legal page content.
 */
export function LegalSection({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="mb-8 sm:mb-10">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground">
        {title}
      </h2>
      <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export function LegalSubsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">
        {title}
      </h3>
      <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 sm:pl-6 space-y-2 marker:text-primary">
      {items.map((item, index) => (
        <li key={index} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LegalCallout({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warning' | 'success';
  children: React.ReactNode;
}) {
  const styles = {
    info: 'border-blue-500/30 bg-blue-500/5 text-blue-900 dark:text-blue-200',
    warning: 'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200',
    success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200',
  };

  return (
    <div className={`my-4 p-4 rounded-lg border ${styles[type]}`}>
      {children}
    </div>
  );
}
