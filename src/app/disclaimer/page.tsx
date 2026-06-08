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

      <LegalSection title="2. No Professional Advice" id="no-advice">
        <p>
          The content and tools provided through LS PDF Tools are intended for general informational and
          utility purposes only. They do <strong>NOT</strong> constitute:
        </p>
        <LegalList
          items={[
            '<strong>Legal advice:</strong> Nothing on this Service should be construed as legal advice. For legal matters, consult a licensed attorney in your jurisdiction.',
            '<strong>Financial advice:</strong> We do not provide financial, investment, or tax advice. Consult a qualified financial professional.',
            '<strong>Medical advice:</strong> We are not a medical service. Do not use our tools for medical, health, or life-safety purposes without professional guidance.',
            '<strong>Professional document services:</strong> Our tools are not a substitute for professional document services like notarization or certified translation.',
            '<strong>Compliance guarantees:</strong> We do not guarantee that use of our tools will meet any specific regulatory, compliance, or industry requirements (HIPAA, GDPR, SOX, etc.).',
          ]}
        />
        <p>
          You are solely responsible for verifying that the output of our tools meets your specific
          requirements and applicable legal standards.
        </p>
      </LegalSection>

      <LegalSection title="3. AI-Generated Content Disclaimer" id="ai-content">
        <LegalCallout type="warning">
          <p className="text-sm">
            <strong>Critical Notice About AI Features:</strong> Some of our tools use artificial
            intelligence to process your documents (e.g., OCR, summarization, DOCX conversion). AI
            systems are inherently imperfect and may produce inaccurate, incomplete, or misleading
            results.
          </p>
        </LegalCallout>

        <LegalSubsection title="3.1 Accuracy of AI Output">
          <p>
            AI-generated content may contain errors, hallucinations, omissions, or fabrications. You
            acknowledge and agree that:
          </p>
          <LegalList
            items={[
              'AI output should always be reviewed and verified by a qualified human before being used for any important purpose',
              'We make no warranties about the accuracy, completeness, or reliability of any AI-generated content',
              'You assume full responsibility for any consequences resulting from the use of AI-generated content',
              'AI models may have biases, knowledge cutoffs, and limitations that affect their output',
              'We are not liable for any damages, losses, or issues caused by AI-generated content',
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="3.2 No Training on Your Data">
          <p>
            We do not use your files or data to train AI models. However, third-party AI service
            providers may have their own data handling practices. Please review their terms and privacy
            policies.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="4. File Processing & Data Disclaimer" id="file-processing">
        <p>
          While we have designed LS PDF Tools to prioritize your privacy, you acknowledge the following:
        </p>

        <LegalSubsection title="4.1 Browser-Side Processing">
          <p>
            For tools that process files entirely in your browser, processing is subject to your
            browser&rsquo;s capabilities, memory, and performance. We do not guarantee that:
          </p>
          <LegalList
            items={[
              'All file types, sizes, or formats will be supported',
              'Processing will complete successfully for all files',
              'Output files will be 100% identical to input in all cases',
              'Complex or corrupted files will be processed correctly',
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="4.2 Server-Side Processing (AI Features)">
          <p>
            For AI-powered features, files are transmitted to our servers and potentially to third-party
            AI service providers. While we implement industry-standard security measures, no method of
            transmission over the Internet is 100% secure. You acknowledge that:
          </p>
          <LegalList
            items={[
              'You are solely responsible for deciding which files to process via AI features',
              'You should not upload highly sensitive, confidential, or regulated data to AI features',
              'We are not liable for any unauthorized access or data breaches that may occur despite our security measures',
              'You should review the privacy policies of our AI service providers',
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="4.3 File Backup & Recovery">
          <p>
            We are <strong>NOT</strong> responsible for loss, corruption, or damage to your files. You
            are solely responsible for maintaining backups of your important documents. We strongly
            recommend keeping original copies of all files you process through our Service.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="5. Third-Party Services" id="third-party">
        <p>
          Our Service may integrate with or rely on third-party services, including:
        </p>
        <LegalList
          items={[
            'Hosting providers (e.g., Vercel, AWS, Cloudflare)',
            'AI service providers (e.g., OpenAI, Anthropic, Google)',
            'Analytics providers (e.g., Google Analytics, Plausible)',
            'CDN services for content delivery',
          ]}
        />
        <p>
          We are not responsible for the availability, accuracy, or practices of these third-party
          services. Their use is subject to their own terms and policies. Any reliance on third-party
          services is at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="6. External Links Disclaimer" id="external-links">
        <p>
          Our Service may contain links to external websites that are not owned or controlled by LS
          PDF Tools. We have no control over, and assume no responsibility for, the content, privacy
          practices, or accuracy of any third-party websites or services. The inclusion of any link does
          not imply endorsement or approval.
        </p>
        <p>
          We encourage you to review the terms and privacy policies of any third-party websites you
          visit.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitation of Liability" id="liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LS PDF TOOLS, ITS
          AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY:
        </p>
        <LegalList
          items={[
            'Indirect, incidental, special, consequential, exemplary, or punitive damages',
            'Loss of profits, revenue, data, use, goodwill, or other intangible losses',
            'Damages resulting from your access to, use of, or inability to access or use the Service',
            'Damages resulting from any conduct or content of any third party on or through the Service',
            'Damages resulting from unauthorized access, use, or alteration of your transmissions or content',
            'Damages resulting from errors, omissions, or inaccuracies in any content',
            'Damages resulting from any interruption or cessation of the Service',
          ]}
        />
        <p>
          In jurisdictions that do not allow the exclusion or limitation of certain damages, our
          liability will be limited to the maximum extent permitted by law. In no event shall our total
          liability exceed one hundred U.S. dollars (US$100) or the amount you have paid us, whichever
          is greater.
        </p>
      </LegalSection>

      <LegalSection title="8. Indemnification" id="indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless LS PDF Tools and its affiliates, employees,
          contractors, agents, and licensors from and against any and all claims, damages, obligations,
          losses, liabilities, costs, or expenses (including reasonable attorneys&rsquo; fees) arising
          from:
        </p>
        <LegalList
          items={[
            'Your use of and access to the Service',
            'Your violation of any term of these disclaimers or our Terms and Conditions',
            'Your violation of any third-party right, including intellectual property or privacy rights',
            'Any claim that your use of the Service caused damage to a third party',
            'Any content you submit, upload, or process through the Service',
          ]}
        />
      </LegalSection>

      <LegalSection title="9. &ldquo;As Is&rdquo; and &ldquo;As Available&rdquo;" id="as-is">
        <p>
          The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without
          warranty of any kind, express or implied. Your use of the Service is at your sole risk. We
          reserve the right to modify, suspend, or discontinue the Service at any time without notice
          and without liability to you.
        </p>
        <p>
          We do not warrant that:
        </p>
        <LegalList
          items={[
            'The Service will meet your specific requirements',
            'The Service will be uninterrupted, timely, secure, or error-free',
            'The results obtained from using the Service will be accurate or reliable',
            'The quality of any products, services, information, or other material obtained through the Service will meet your expectations',
            'Any errors in the Service will be corrected',
          ]}
        />
      </LegalSection>

      <LegalSection title="10. Copyright & DMCA" id="copyright">
        <p>
          We respect the intellectual property rights of others and expect our users to do the same. In
          accordance with the Digital Millennium Copyright Act (DMCA) and other applicable laws, we will
          respond expeditiously to claims of copyright infringement.
        </p>
        <p>
          If you believe that your copyrighted work has been used in a way that constitutes copyright
          infringement, please contact us with:
        </p>
        <LegalList
          items={[
            'A description of the copyrighted work',
            'The URL or location of the infringing material',
            'Your contact information',
            'A statement of good faith that the use is unauthorized',
            'A statement, made under penalty of perjury, that the information is accurate and you are the copyright owner or authorized to act on their behalf',
          ]}
        />
      </LegalSection>

      <LegalSection title="11. Changes to This Disclaimer" id="changes">
        <p>
          We reserve the right to modify or replace this Disclaimer at any time. Material changes will
          be noted by updating the &ldquo;Last updated&rdquo; date at the top. Your continued use of
          the Service after any changes constitutes acceptance of the updated disclaimer.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact" id="contact">
        <p>
          If you have any questions about this Disclaimer or our practices, please reach out to us
          through our <a href="/contact" className="text-primary underline">Contact page</a>.
        </p>
      </LegalSection>

      <LegalCallout type="info">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm">
            <strong>Note:</strong> This disclaimer should be read in conjunction with our{' '}
            <a href="/terms" className="text-primary underline">Terms and Conditions</a> and{' '}
            <a href="/privacy" className="text-primary underline">Privacy Policy</a>, which together
            govern your use of the Service.
          </p>
        </div>
      </LegalCallout>
    </LegalLayout>
  );
}
