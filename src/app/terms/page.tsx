import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { LegalLayout, LegalSection, LegalSubsection, LegalList, LegalCallout } from '@/components/shared/legal-layout';

export const metadata: Metadata = {
  title: 'Terms and Conditions — LS PDF Tools',
  description: 'Read the terms and conditions governing your use of LS PDF Tools, our free online PDF editor.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms and Conditions"
      description="The legal agreement between you and LS PDF Tools governing your use of our services."
      lastUpdated="June 1, 2026"
      effectiveDate="June 1, 2026"
      icon={<Scale className="h-6 w-6 sm:h-7 sm:w-7" />}
    >
      <LegalCallout type="info">
        <p className="text-sm">
          <strong>Please read these terms carefully</strong> before using LS PDF Tools. By accessing or using our
          service, you agree to be bound by these Terms and Conditions. If you disagree with any part of these
          terms, please do not use our service.
        </p>
      </LegalCallout>

      <LegalSection title="1. Acceptance of Terms" id="acceptance">
        <p>
          By accessing and using <strong>LS PDF Tools</strong> (&ldquo;the Service&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;our&rdquo;), you accept and agree to be bound by the terms and provisions
          of this agreement. These Terms and Conditions apply to all visitors, users, and others who access or
          use the Service.
        </p>
        <p>
          If you do not agree to abide by these terms, please do not use the Service. We reserve the right to
          update, change, or replace any part of these Terms at any time. Your continued use of the Service
          following the posting of any changes constitutes acceptance of those changes.
        </p>
      </LegalSection>

      <LegalSection title="2. Description of Service" id="service-description">
        <p>
          LS PDF Tools is a <strong>free, browser-based PDF processing tool</strong> that allows users to
          perform various operations on PDF files and other document formats. Our service includes, but is not
          limited to:
        </p>
        <LegalList
          items={[
            'Merging, splitting, compressing, and rotating PDF files',
            'Converting PDFs to and from other formats (JPG, PNG, DOCX, HTML, Markdown, etc.)',
            'Adding watermarks, page numbers, headers, and footers',
            'Protecting, unlocking, redacting, and signing PDFs',
            'AI-powered features including OCR, summarization, and document analysis',
            'Various other document manipulation and organization features',
          ]}
        />
        <p>
          <strong>All processing is performed locally in your browser</strong> using client-side JavaScript.
          Your files are not uploaded to our servers for the majority of tools. For certain AI-powered features
          (such as OCR, summarization, and DOCX conversion), files may be sent to our API servers for
          processing. These cases are clearly indicated within the relevant tool.
        </p>
      </LegalSection>

      <LegalSection title="3. User Responsibilities" id="user-responsibilities">
        <LegalSubsection title="3.1 Acceptable Use">
          <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to use the Service:</p>
          <LegalList
            items={[
              'To process files that you do not have the legal right to access or modify',
              'To engage in any activity that violates any applicable local, state, national, or international law',
              'To upload or process files containing malicious code, viruses, or harmful content',
              'To attempt to gain unauthorized access to our systems or networks',
              'To interfere with or disrupt the Service or servers connected to the Service',
              'To use the Service to harass, abuse, defame, threaten, or intimidate others',
              'To use automated scripts, bots, or crawlers that burden our infrastructure',
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="3.2 File Content">
          <p>
            You are solely responsible for the files you process using our Service. You represent and warrant
            that you own or have the necessary rights to all files you upload and process, and that such files
            do not violate the rights of any third party, including intellectual property, privacy, or
            proprietary rights.
          </p>
        </LegalSubsection>

        <LegalSubsection title="3.3 Account Security">
          <p>
            While LS PDF Tools does not currently require account registration for most features, if you choose
            to create an account or use features that require authentication, you are responsible for
            maintaining the confidentiality of your account credentials and for all activities that occur under
            your account.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="4. Intellectual Property Rights" id="intellectual-property">
        <LegalSubsection title="4.1 Our Intellectual Property">
          <p>
            The Service, including its original content, features, functionality, design, graphics, logos, and
            code, is and will remain the exclusive property of LS PDF Tools and its licensors. The Service is
            protected by copyright, trademark, and other laws. You may not reproduce, distribute, modify, or
            create derivative works of our Service without our explicit written consent.
          </p>
        </LegalSubsection>

        <LegalSubsection title="4.2 Your Content">
          <p>
            <strong>You retain all ownership rights to the files you process.</strong> We do not claim
            ownership over your documents. Since most processing happens in your browser, we never see or
            access your files. For AI features that require server-side processing, we do not retain, store,
            or use your files for any purpose other than providing the requested service.
          </p>
        </LegalSubsection>

        <LegalSubsection title="4.3 Open Source Components">
          <p>
            LS PDF Tools incorporates various open-source software libraries. These components are governed by
            their respective open-source licenses. A list of third-party libraries and their licenses is
            available in our project repository.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection title="5. AI-Powered Features" id="ai-features">
        <LegalCallout type="warning">
          <p className="text-sm">
            <strong>Important:</strong> Some of our tools use AI/ML models to provide features like OCR
            (Optical Character Recognition), document summarization, and intelligent document conversion.
            These features may send data to third-party AI service providers for processing.
          </p>
        </LegalCallout>
        <p>When using AI-powered features, you acknowledge and agree that:</p>
        <LegalList
          items={[
            'Your file data may be transmitted to AI service providers (such as OpenAI, Anthropic, or similar providers) for processing',
            'AI-generated results may not always be accurate and should be reviewed by a human',
            'You should not use AI-powered features to process highly sensitive personal data, medical records, or other confidential information',
            'We are not responsible for the accuracy, quality, or appropriateness of AI-generated content',
            'AI service providers may have their own terms of service and privacy policies that apply',
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Disclaimers" id="disclaimers">
        <p>
          THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT ANY
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
        </p>
        <LegalList
          items={[
            'Warranties of merchantability, fitness for a particular purpose, or non-infringement',
            'Warranties that the Service will be uninterrupted, error-free, secure, or free of viruses or other harmful components',
            'Warranties regarding the accuracy, reliability, or completeness of any content obtained through the Service',
            'Warranties that defects in the software will be corrected',
          ]}
        />
        <p>
          We do not warrant that the Service will meet your specific requirements or that the results obtained
          from using the Service will be accurate or reliable. You assume full responsibility for verifying
          the accuracy and completeness of any output generated by the Service.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitation of Liability" id="limitation">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LS PDF TOOLS, ITS AFFILIATES,
          OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR:
        </p>
        <LegalList
          items={[
            'Any indirect, incidental, special, consequential, or punitive damages',
            'Any loss of profits, revenue, data, use, goodwill, or other intangible losses',
            'Damages resulting from (a) your access to or use of (or inability to access or use) the Service; (b) any conduct or content of any third party on the Service; (c) any content obtained from the Service; or (d) unauthorized access, use, or alteration of your transmissions or content',
            'Any data loss, corruption, or damage to your files or systems',
          ]}
        />
        <p>
          In no event shall our total liability for all claims relating to the Service exceed one hundred U.S.
          dollars (US$100) or the amount you have paid us in the past twelve months, whichever is greater.
          Because some jurisdictions do not allow the exclusion or limitation of liability for consequential or
          incidental damages, the above limitation may not apply to you.
        </p>
      </LegalSection>

      <LegalSection title="8. Indemnification" id="indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless LS PDF Tools and its affiliates, licensors, and
          their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors,
          and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs,
          expenses, or fees (including reasonable attorneys&rsquo; fees) arising out of or relating to your
          violation of these Terms or your use of the Service.
        </p>
      </LegalSection>

      <LegalSection title="9. Third-Party Services" id="third-party">
        <p>
          The Service may contain links to third-party websites, services, or resources that are not owned or
          controlled by LS PDF Tools. We have no control over, and assume no responsibility for, the content,
          privacy policies, or practices of any third-party websites or services. We strongly advise you to
          read the terms and conditions and privacy policy of any third-party website that you visit.
        </p>
        <p>
          Our AI-powered features rely on third-party AI service providers. Your use of these features is also
          subject to the terms of service of those providers.
        </p>
      </LegalSection>

      <LegalSection title="10. Service Modifications" id="modifications">
        <p>
          We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any
          time, with or without notice. We will not be liable to you or any third party for any modification,
          suspension, or discontinuance of the Service. We may also impose limits on certain features or
          restrict your access to parts or all of the Service without notice or liability.
        </p>
      </LegalSection>

      <LegalSection title="11. Termination" id="termination">
        <p>
          These Terms remain in effect while you use the Service. We may terminate or suspend your access to
          the Service immediately, without prior notice or liability, for any reason whatsoever, including
          without limitation if you breach these Terms. Upon termination, your right to use the Service will
          cease immediately. All provisions of these Terms which by their nature should survive termination
          shall survive, including ownership provisions, warranty disclaimers, indemnification, and limitations
          of liability.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing Law and Dispute Resolution" id="governing-law">
        <p>
          These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which
          LS PDF Tools operates, without regard to its conflict of law provisions. Any dispute arising from
          or relating to these Terms or your use of the Service shall be resolved through binding
          arbitration, except where prohibited by law. You agree to submit to the personal jurisdiction of the
          courts located in the applicable jurisdiction for any disputes not subject to arbitration.
        </p>
      </LegalSection>

      <LegalSection title="13. Severability" id="severability">
        <p>
          If any provision of these Terms is held to be invalid, illegal, or unenforceable, such provision
          shall be severed from these Terms, and the remaining provisions shall continue in full force and
          effect. The invalid provision shall be replaced with a valid provision that most closely reflects
          the original intent.
        </p>
      </LegalSection>

      <LegalSection title="14. Entire Agreement" id="entire-agreement">
        <p>
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and LS
          PDF Tools regarding the Service and supersede all prior and contemporaneous understandings,
          agreements, representations, and warranties, both written and oral, regarding the Service.
        </p>
      </LegalSection>

      <LegalSection title="15. Changes to These Terms" id="changes">
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
          revision is material, we will try to provide at least 30 days&rsquo; notice prior to any new terms
          taking effect. What constitutes a material change will be determined at our sole discretion. By
          continuing to access or use our Service after any revisions become effective, you agree to be bound
          by the revised terms.
        </p>
      </LegalSection>

      <LegalSection title="16. Contact Information" id="contact">
        <p>
          If you have any questions about these Terms and Conditions, please contact us through our{' '}
          <a href="/contact" className="text-primary underline">Contact page</a> or via the methods listed
          there. We aim to respond to all inquiries within 2-3 business days.
        </p>
      </LegalSection>

      <LegalCallout type="success">
        <p className="text-sm">
          <strong>Thank you for using LS PDF Tools!</strong> By using our service, you help support our
          mission to make PDF tools accessible and free for everyone.
        </p>
      </LegalCallout>
    </LegalLayout>
  );
}
