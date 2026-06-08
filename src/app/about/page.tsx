import type { Metadata } from 'next';
import { Info, Heart, Globe, Users, Zap, Shield, Code2, Sparkles, Target, Eye, Lightbulb } from 'lucide-react';
import { LegalLayout, LegalSection, LegalSubsection, LegalList, LegalCallout } from '@/components/shared/legal-layout';

export const metadata: Metadata = {
  title: 'About Us — LS PDF Tools',
  description: 'Learn about LS PDF Tools, our mission to provide free, fast, and private PDF tools that work entirely in your browser.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
  return (
    <LegalLayout
      title="About Us"
      description="Our story, mission, and the team behind LS PDF Tools."
      lastUpdated="June 1, 2026"
      icon={<Info className="h-6 w-6 sm:h-7 sm:w-7" />}
    >
      <LegalSection title="Our Story" id="story">
        <p>
          <strong>LS PDF Tools</strong> was born out of a simple frustration: needing a quick PDF tool and
          being met with paywalls, sign-up requirements, intrusive ads, and privacy concerns. Too many
          &ldquo;free&rdquo; PDF tools online come with hidden costs — your data, your patience, and
          sometimes even your files.
        </p>
        <p>
          We believed there had to be a better way. So we built LS PDF Tools as a collection of fast,
          reliable, and genuinely free PDF utilities that work <strong>entirely in your browser</strong>.
          No uploads. No accounts. No watermarks. No limits.
        </p>
        <p>
          What started as a small side project has grown into a comprehensive toolkit used by tens of
          thousands of people every month — students, professionals, freelancers, small business owners, and
          anyone who needs to work with PDFs without compromising their privacy or productivity.
        </p>
      </LegalSection>

      <LegalSection title="Our Mission" id="mission">
        <LegalCallout type="info">
          <div className="flex items-start gap-3">
            <Target className