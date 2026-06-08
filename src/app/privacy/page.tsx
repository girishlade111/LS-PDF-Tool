import type { Metadata } from 'next';
import { Shield } from 'lucide-react';
import { LegalLayout, LegalSection, LegalSubsection, LegalList, LegalCallout } from '@/components/shared/legal-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy — LS PDF Tools',
  description: 'Learn how LS PDF Tools protects your privacy. Most processing happens in your browser, so your files never leave your device.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How we collect, use, and protect your information when you use LS PDF Tools."
      lastUpdated="June 1, 2026"
      effectiveDate="June 1, 2026"
      icon={<Shield className="h-6 w-6 sm:h-7 sm:w-7" />}
    >
      <LegalCallout type="success">
        <p className="text-sm">
          <strong>Your privacy is our top priority.</strong> Most of our tools process your files entirely
          in your browser — your documents never leave your device. We collect minimal data and are
          committed to being transparent about any information we do gather.
        </p>
      </LegalCallout>

      <LegalSection title="1. Introduction" id="introduction">
        <p>
          This Privacy Policy explains how LS PDF Tools (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
          collects, uses, and shares information when you use our website, applications, and services
          (collectively, the &ldquo;Service&rdquo;). We respect your privacy and are committed to protecting
          your personal data in compliance with applicable data protection laws, including the General Data
          Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other regional
          privacy regulations.
        </p>
        <p>
          By using our Service, you agree to the data practices described in this policy. If you do not agree
          with the practices described in this policy, please do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Do NOT Collect" id="not-collect">
        <p>
          Because the vast majority of LS PDF Tools&rsquo; functionality runs <strong>entirely in your
