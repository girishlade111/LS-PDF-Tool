import type { Metadata } from 'next';
import { Info, Heart, Globe, Users, Zap, Shield, Code2, Sparkles, Target, Eye, Lightbulb, Award, BookOpen } from 'lucide-react';
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
          <p className="text-sm">
            <strong>To make professional-grade PDF tools accessible to everyone, with absolute respect for
            privacy and zero compromises on quality.</strong>
          </p>
        </LegalCallout>
        <p>
          We believe that essential document tools should be available to anyone with an internet connection,
          regardless of their budget, location, or technical expertise. Privacy shouldn&rsquo;t be a
          premium feature — it should be the default.
        </p>
        <p>
          Our mission drives every decision we make, from the technologies we adopt to the features we ship.
          If a feature would compromise user privacy or lock essential functionality behind a paywall, we
          won&rsquo;t build it.
        </p>
      </LegalSection>

      <LegalSection title="What Makes Us Different" id="differentiators">
        <LegalList
          items={[
            '<strong>Privacy-first by design:</strong> The vast majority of our tools run entirely in your browser. Your files never leave your device. No server uploads, no tracking, no exceptions.',
            '<strong>Truly free:</strong> No trial periods, no hidden fees, no &ldquo;premium&rdquo; tiers for basic features. Everything is free, forever.',
            '<strong>No account required:</strong> Use any tool instantly without signing up, providing an email, or creating yet another password.',
            '<strong>No watermarks:</strong> Your output files belong to you, period. We never add watermarks, logos, or any branding to your documents.',
            '<strong>No file limits:</strong> Process as many files as you need, as many times as you need, in any size your browser can handle.',
            '<strong>Modern, fast, and reliable:</strong> Built with the latest web technologies for a snappy, responsive experience on any device.',
            '<strong>Open about our technology:</strong> We use open-source libraries and are transparent about how our tools work.',
          ]}
        />
      </LegalSection>

      <LegalSection title="Our Core Values" id="values">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-6">
          <ValueCard
            icon={<Shield className="h-5 w-5" />}
            title="Privacy"
            description="Your documents are your business. We build tools that respect that."
          />
          <ValueCard
            icon={<Heart className="h-5 w-5" />}
            title="User-first"
            description="Every feature is built to solve real user problems, not to serve business metrics."
          />
          <ValueCard
            icon={<Zap className="h-5 w-5" />}
            title="Performance"
            description="Fast, responsive tools that work the way you expect them to."
          />
          <ValueCard
            icon={<Globe className="h-5 w-5" />}
            title="Accessibility"
            description="Free, browser-based tools accessible from anywhere in the world."
          />
          <ValueCard
            icon={<Code2 className="h-5 w-5" />}
            title="Transparency"
            description="Open about our technology, our data practices, and our limitations."
          />
          <ValueCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Innovation"
            description="Constantly improving and adding new tools to serve our community better."
          />
        </div>
      </LegalSection>

      <LegalSection title="Our Tools" id="tools">
        <p>
          Today, LS PDF Tools offers <strong>31+ PDF tools</strong> across multiple categories:
        </p>
        <LegalSubsection title="Convert">
          <p>
            Transform PDFs to and from various formats: JPG, PNG, DOCX, HTML, Markdown, plain text, and
            more. Use AI-powered OCR to extract text from scanned documents, or convert to editable Word
            files while preserving formatting.
          </p>
        </LegalSubsection>
        <LegalSubsection title="Organize & Optimize">
          <p>
            Merge multiple PDFs into one, split a single PDF into many, rearrange pages, extract specific
            pages, delete unwanted pages, crop, rotate, and more. Compress PDFs to reduce file size without
            sacrificing quality.
          </p>
        </LegalSubsection>
        <LegalSubsection title="Security">
          <p>
            Add password protection and encryption to sensitive documents, remove passwords from PDFs you
            own, permanently redact confidential information, and verify document integrity with our repair
            tool.
          </p>
        </LegalSubsection>
        <LegalSubsection title="Edit & Enhance">
          <p>
            Add watermarks, page numbers, headers and footers. Sign documents electronically. Fill out PDF
            forms directly in your browser. Edit document metadata. View PDFs with our built-in reader.
          </p>
        </LegalSubsection>
        <LegalSubsection title="AI-Powered">
          <p>
            Leverage the latest AI models for intelligent document processing: OCR for scanned documents,
            automatic summarization, intelligent DOCX conversion, and more. We&rsquo;re continuously
            exploring new ways to use AI to make document work easier.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="Our Commitment to Privacy" id="privacy-commitment">
        <p>
          Privacy isn&rsquo;t just a checkbox for us — it&rsquo;s the foundation of how we&rsquo;ve designed
          every tool. When you use most LS PDF Tools, here&rsquo;s what happens:
        </p>
        <LegalList
          items={[
            'Your file is loaded directly into your browser&rsquo;s memory',
            'Processing happens locally using JavaScript and WebAssembly',
            'The processed file is offered as a download directly to your computer',
            'No part of the file is ever sent to our servers or any third party',
            'When you close or refresh the page, all in-memory data is cleared',
          ]}
        />
        <p>
          For a small subset of tools that use AI (OCR, summarization, DOCX conversion), files are sent to
          our API for processing. We never store these files, never use them for training, and process them
          in real-time only. We clearly indicate when a tool requires server-side processing so you can make
          an informed decision.
        </p>
      </LegalSection>

      <LegalSection title="The Technology Behind the Tools" id="technology">
        <p>
          LS PDF Tools is built using modern, well-established web technologies:
        </p>
        <LegalList
          items={[
            '<strong>Next.js & React:</strong> For a fast, modern, server-rendered web application',
            '<strong>TypeScript:</strong> For type-safe, maintainable code',
            '<strong>PDF.js:</strong> Mozilla&rsquo;s industry-standard PDF rendering library',
            '<strong>pdf-lib:</strong> For creating, modifying, and signing PDF documents',
            '<strong>Tailwind CSS & shadcn/ui:</strong> For a beautiful, responsive, accessible interface',
            '<strong>WebAssembly:</strong> For high-performance operations like image processing and OCR',
            '<strong>Progressive Web App features:</strong> For a native-app-like experience',
          ]}
        />
        <p>
          We rely heavily on open-source libraries and are grateful to the global developer community that
          makes projects like this possible.
        </p>
      </LegalSection>

      <LegalSection title="Who Uses LS PDF Tools?" id="users">
        <p>
          Our users come from all walks of life and use LS PDF Tools in countless ways:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-6">
          <UserGroup
            icon={<BookOpen className="h-5 w-5" />}
            title="Students & Educators"
            description="Combining lecture notes, splitting chapters, reducing file sizes for submission, converting research papers to editable formats."
          />
          <UserGroup
            icon={<Users className="h-5 w-5" />}
            title="Business Professionals"
            description="Merging contracts, redacting sensitive information, signing documents on the go, optimizing PDFs for email."
          />
          <UserGroup
            icon={<Award className="h-5 w-5" />}
            title="Freelancers & Creators"
            description="Watermarking portfolios, organizing client deliverables, converting formats for different platforms."
          />
          <UserGroup
            icon={<Globe className="h-5 w-5" />}
            title="Privacy-conscious Users"
            description="Anyone who values their privacy and doesn&rsquo;t want their documents uploaded to random servers."
          />
        </div>
      </LegalSection>

      <LegalSection title="Looking to the Future" id="future">
        <p>
          We&rsquo;re continuously working to expand our toolkit and improve the user experience. Some of
          the things on our roadmap:
        </p>
        <LegalList
          items={[
            'More AI-powered features for intelligent document processing',
            'Additional file format support (e.g., ePub, RTF, ODT)',
            'Enhanced collaboration features',
            'Mobile-optimized experiences',
            'Improved accessibility and internationalization',
            'More tools based on user feedback',
          ]}
        />
        <p>
          Have a feature request or tool suggestion? We&rsquo;d love to hear from you! Reach out via our{' '}
          <a href="/contact" className="text-primary underline">Contact page</a>.
        </p>
      </LegalSection>

      <LegalSection title="Get in Touch" id="contact">
        <p>
          We&rsquo;re a small, dedicated team that genuinely cares about making document tools better for
          everyone. Whether you have feedback, found a bug, have a feature request, or just want to say
          hello, we&rsquo;d love to hear from you.
        </p>
        <p>
          Visit our <a href="/contact" className="text-primary underline">Contact page</a> to send us a
          message. We read every email and try to respond to all inquiries within 2-3 business days.
        </p>
        <LegalCallout type="success">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-sm">
              <strong>Thank you for being part of our journey.</strong> Whether you&rsquo;re a first-time
              user or a long-time fan, we&rsquo;re grateful you chose LS PDF Tools for your document needs.
            </p>
          </div>
        </LegalCallout>
      </LegalSection>
    </LegalLayout>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:border-primary/30 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10 text-red-600 dark:text-orange-400 shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-1 text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function UserGroup({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-1 text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
