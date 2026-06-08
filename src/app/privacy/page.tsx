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
          browser</strong>, we do <strong>NOT</strong> collect, store, transmit, or have access to:
        </p>
        <LegalList
          items={[
            'Your PDF files or any other documents you process',
            'The content, text, or images within your documents',
            'Your filenames, metadata, or document properties',
            'Any personal information contained in your files',
            'Data about the operations you perform on your files',
            'Your processed output files or download history',
          ]}
        />
        <p>
          <strong>This is a fundamental design principle of our Service.</strong> Your documents are processed
          locally in your browser using client-side JavaScript. The files are never transmitted to our servers
          or any third-party services for the majority of our tools.
        </p>
      </LegalSection>

      <LegalSection title="3. Information We May Collect" id="collect">
        <p>
          While we strive to minimize data collection, we may collect limited information for the following
          purposes:
        </p>

        <LegalSubsection title="3.1 Automatically Collected Technical Information">
          <p>When you visit our website, our servers (or third-party service providers) may automatically log:</p>
          <LegalList
            items={[
              'IP address (anonymized where possible)',
              'Browser type and version',
              'Operating system',
              'Device type (desktop, mobile, tablet)',
              'Referring URL (the website you came from)',
              'Pages visited and time spent on our Service',
              'Approximate geographic location (country/city level only)',
              'Date and time of your visit',
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="3.2 Cookies and Similar Technologies">
          <p>
            We use cookies and similar tracking technologies to enhance your experience. The types of cookies
            we use include:
          </p>
          <LegalList
            items={[
              '<strong>Essential cookies:</strong> Required for the Service to function properly (e.g., session management, security tokens)',
              '<strong>Analytics cookies:</strong> Help us understand how visitors use our Service so we can improve it (e.g., Google Analytics, Plausible)',
              '<strong>Preference cookies:</strong> Remember your settings such as theme (light/dark mode), language, and recent tools used',
              '<strong>Marketing cookies:</strong> Used to deliver relevant advertisements and measure their effectiveness (only with your consent)',
            ]}
          />
          <p>
            You can control cookies through your browser settings. Disabling certain cookies may limit the
            functionality of our Service.
          </p>
        </LegalSubsection>

        <LegalSubsection title="3.3 Information You Provide Voluntarily">
          <p>We only collect personal information that you voluntarily provide, such as:</p>
          <LegalList
            items={[
              'Email address (only if you sign up for our newsletter or create an account)',
              'Feedback, comments, or support requests you submit',
              'Survey responses or product feedback',
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="3.4 AI Feature Data">
          <LegalCallout type="warning">
            <p className="text-sm">
              <strong>Important:</strong> Certain AI-powered features (such as OCR, document summarization,
              and DOCX conversion) require server-side processing. When you use these features, the file(s)
              you upload are transmitted to our API servers and may be forwarded to third-party AI service
              providers (such as OpenAI, Anthropic, or similar providers) for processing.
            </p>
          </LegalCallout>
          <p>For these features specifically:</p>
          <LegalList
            items={[
              'Your file data is transmitted over HTTPS to our secure API servers',
              'The data is processed in real-time and is not stored, logged, or retained on our servers after processing completes',
              'The file is forwarded to the AI service provider only as needed to fulfill your specific request',
              'We do not use your files to train AI models',
              'Please review the privacy policies of our AI service providers for additional information',
            ]}
          />
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="4. How We Use Your Information" id="use">
        <p>We use the limited information we collect for the following purposes:</p>
        <LegalList
          items={[
            'To provide, maintain, and improve our Service',
            'To respond to your comments, questions, and customer service requests',
            'To send you newsletters, marketing communications, and other information only if you have opted in',
            'To monitor and analyze trends, usage, and activities in connection with our Service',
            'To detect, prevent, and address technical issues, fraud, or illegal activities',
            'To comply with legal obligations and enforce our terms',
            'To personalize your experience and remember your preferences',
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Data Sharing and Disclosure" id="sharing">
        <p>
          We do not sell, trade, or rent your personal information to third parties. We may share your
          information only in the following limited circumstances:
        </p>

        <LegalSubsection title="5.1 Service Providers">
          <p>
            We may share information with trusted third-party service providers who assist us in operating our
            Service, conducting our business, or serving our users. These providers are contractually
            obligated to keep your information confidential and secure. They include:
          </p>
          <LegalList
            items={[
              'Hosting and infrastructure providers (e.g., Vercel, AWS, Cloudflare)',
              'Analytics providers (e.g., Google Analytics, Plausible)',
              'Email service providers (for newsletters and transactional emails)',
              'AI service providers (for AI-powered features only, on a per-request basis)',
              'Payment processors (if applicable in the future)',
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="5.2 Legal Requirements">
          <p>
            We may disclose information if required to do so by law or in response to valid requests by
            public authorities (e.g., a court order, subpoena, or government investigation). We will only
            disclose the minimum information necessary to comply with such requests.
          </p>
        </LegalSubsection>

        <LegalSubsection title="5.3 Business Transfers">
          <p>
            If LS PDF Tools is involved in a merger, acquisition, or sale of all or a portion of its assets,
            your information may be transferred as part of that transaction. You will be notified via email
            and/or a prominent notice on our website of any change in ownership or uses of your personal
            information.
          </p>
        </LegalSubsection>

        <LegalSubsection title="5.4 Aggregated Data">
          <p>
            We may share aggregated, anonymized, or de-identified information with third parties for
            research, marketing, analytics, or other purposes. Such data cannot reasonably be used to
            identify you.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="6. Data Security" id="security">
        <p>
          We take the security of your information very seriously. We implement a variety of security
          measures to protect your personal information, including:
        </p>
        <LegalList
          items={[
            '<strong>Encryption:</strong> All data transmission between your browser and our servers uses HTTPS/TLS encryption',
            '<strong>Browser-side processing:</strong> Most operations occur entirely in your browser, eliminating the risk of interception during processing',
            '<strong>No persistent file storage:</strong> For AI features, we do not store your files after processing is complete',
            '<strong>Regular security audits:</strong> We periodically review and update our security practices',
            '<strong>Access controls:</strong> Access to any collected data is restricted to authorized personnel only',
            '<strong>Modern infrastructure:</strong> We use reputable cloud providers with strong physical and digital security',
          ]}
        />
        <p>
          However, no method of transmission over the Internet or electronic storage is 100% secure. While
          we strive to protect your personal information, we cannot guarantee its absolute security.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Retention" id="retention">
        <p>
          Since we do not collect or store your files, there is nothing to retain in that regard. For
          other limited data we collect:
        </p>
        <LegalList
          items={[
            '<strong>Analytics data:</strong> Retained for up to 26 months, then anonymized or deleted',
            '<strong>Email subscriptions:</strong> Retained until you unsubscribe',
            '<strong>Account data (if applicable):</strong> Retained for the life of your account and deleted upon account closure',
            '<strong>Server logs:</strong> Retained for up to 30 days for security and debugging purposes',
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Your Rights and Choices" id="rights">
        <p>
          Depending on your location, you may have the following rights regarding your personal information:
        </p>
        <LegalList
          items={[
            '<strong>Access:</strong> Request a copy of the personal information we hold about you',
            '<strong>Rectification:</strong> Request correction of inaccurate or incomplete data',
            '<strong>Erasure:</strong> Request deletion of your personal data (the &ldquo;right to be forgotten&rdquo;)',
            '<strong>Restriction:</strong> Request limitation of processing of your personal data',
            '<strong>Portability:</strong> Receive your data in a structured, commonly used, machine-readable format',
            '<strong>Objection:</strong> Object to processing based on legitimate interests or for direct marketing',
            '<strong>Withdraw consent:</strong> Withdraw your consent at any time, where processing is based on consent',
            '<strong>Lodge a complaint:</strong> File a complaint with a supervisory authority',
          ]}
        />
        <p>
          To exercise any of these rights, please contact us via our{' '}
          <a href="/contact" className="text-primary underline">Contact page</a>. We will respond to your
          request within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="9. International Data Transfers" id="international">
        <p>
          LS PDF Tools is operated globally. Your information may be transferred to, stored, and processed
          in countries other than your country of residence, including the United States and European Union.
          These countries may have data protection laws that differ from your country. By using our Service,
          you consent to the transfer of your information to countries outside of your country of residence.
        </p>
        <p>
          For transfers from the EU/EEA, UK, or Switzerland, we rely on Standard Contractual Clauses or
          other appropriate safeguards approved by the relevant authorities.
        </p>
      </LegalSection>

      <LegalSection title="10. Children&rsquo;s Privacy" id="children">
        <p>
          Our Service is not directed to individuals under the age of 13 (or 16 in the EU/UK). We do not
          knowingly collect personal information from children. If you are a parent or guardian and believe
          that your child has provided us with personal information, please contact us, and we will take
          steps to delete such information from our systems.
        </p>
      </LegalSection>

      <LegalSection title="11. Do Not Track Signals" id="dnt">
        <p>
          Some browsers offer a &ldquo;Do Not Track&rdquo; (DNT) feature. We honor DNT signals and do not
          track, place cookies, or use advertising when a DNT signal is received from your browser.
        </p>
      </LegalSection>

      <LegalSection title="12. Third-Party Links and Services" id="third-party">
        <p>
          Our Service may contain links to third-party websites or services that are not owned or
          controlled by LS PDF Tools. This Privacy Policy applies only to our Service. We are not
          responsible for the privacy practices of any third-party websites or services. We encourage you
          to read the privacy policies of every site that collects your personal information.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to This Privacy Policy" id="changes">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting
          the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date at the top.
          For material changes, we will make reasonable efforts to provide more prominent notice (such as
          adding a notice on our homepage or sending an email notification). Your continued use of the
          Service after any changes indicates your acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact Us" id="contact">
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data
          practices, please reach out to us through our{' '}
          <a href="/contact" className="text-primary underline">Contact page</a> or the contact information
          provided there. We are committed to resolving any privacy-related concerns promptly and
          transparently.
        </p>
      </LegalSection>

      <LegalCallout type="info">
        <p className="text-sm">
          <strong>Transparency matters.</strong> If anything in this policy is unclear or you have
          questions, we encourage you to reach out. We believe privacy should be understandable, not buried
          in legalese.
        </p>
      </LegalCallout>
    </LegalLayout>
  );
}
