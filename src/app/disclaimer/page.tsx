import type { Metadata } from 'next';
import { AlertTriangle, FileText } from 'lucide-react';
import { LegalLayout, LegalSection, LegalSubsection, LegalList, LegalCallout } from '@/components/shared/legal-layout';

export const metadata: Metadata = {
  title: 'Disclaimer — LS PDF Tools',
  description: 'Important disclaimers about the use of LS PDF Tools. Read this before using our service.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function DisclaimerPage() {
  return (
    <LegalLayout
      title="Disclaimer"
      description="Important notices and limitations regarding the use of LS PDF Tools."
      lastUpdated="June 1, 2026"
      effectiveDate="June 1, 2026"
      icon={<AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7" />}
    >
      <LegalCallout type="warning">
        <p className="text-sm">
          <strong>Please read this disclaimer carefully.</strong> By using LS PDF Tools, you acknowledge
          and agree to the terms outlined below. If you do not agree, please discontinue use of the
          Service.
        </p>
      </LegalCallout>

      <LegalSection title="1. General Disclaimer" id="general">
        <p>
          The information, tools, and services provided by <strong>LS PDF Tools</strong> (&ldquo;the
          Service&rdquo;) are made available on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo;
          basis. To the fullest extent permitted by law, LS PDF Tools expressly disclaims all warranties,
          representations, guarantees, and conditions of any kind, whether express, implied, statutory, or
          otherwise, including but not limited to:
        </p>
        <LegalList
          items={[
            'Warranties of merchantability, fitness for a particular purpose, and non-infringement',
            'Warranties that the Service will be uninterrupted, error-free, secure, or free from viruses or harmful components',
            'Warranties as to the accuracy, reliability, timeliness, or completeness of any content',
            'Warranties that defects will be corrected or that the Service will meet your requirements',
            'Any warranties arising from course of dealing, course of performance, or usage of trade',
          ]}
        />
      </LegalSection>


