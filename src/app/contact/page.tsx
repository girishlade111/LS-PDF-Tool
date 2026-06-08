'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, Github, Twitter, Globe, Clock, Bug, Lightbulb, HelpCircle, AlertCircle, MapPin } from 'lucide-react';
import { LegalLayout, LegalSection, LegalSubsection, LegalList, LegalCallout } from '@/components/shared/legal-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type FormType = 'general' | 'bug' | 'feature' | 'support';

export default function ContactPage() {
  const [formType, setFormType] = useState<FormType>('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formTypes: { id: FormType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'general',
      label: 'General Inquiry',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Questions, feedback, or just want to say hi',
    },
    {
      id: 'bug',
      label: 'Report a Bug',
      icon: <Bug className="h-4 w-4" />,
      description: 'Something not working as expected?',
    },
    {
      id: 'feature',
      label: 'Feature Request',
      icon: <Lightbulb className="h-4 w-4" />,
      description: 'Suggest a new tool or improvement',
    },
    {
      id: 'support',
      label: 'Get Support',
      icon: <HelpCircle className="h-4 w-4" />,
      description: 'Need help using a specific tool?',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all fields before submitting.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);

    // Simulate form submission. In production, this would call an API endpoint.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setSubmitted(true);
    setSubmitting(false);

    // Reset form after a delay
    setTimeout(() => {
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setFormType('general');
      setSubmitted(false);
    }, 5000);
  };

  return (
    <LegalLayout
      title="Contact Us"
      description="We'd love to hear from you. Reach out with questions, feedback, or support requests."
      icon={<Mail className="h-6 w-6 sm:h-7 sm:w-7" />}
    >
      <LegalCallout type="info">
        <p className="text-sm">
          <strong>We typically respond within 2-3 business days.</strong> For urgent issues, please
          include &ldquo;URGENT&rdquo; in your subject line. For bug reports, please include as much
          detail as possible (browser, operating system, steps to reproduce).
        </p>
      </LegalCallout>

      {/* Quick contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 not-prose">
        <ContactCard
          icon={<Mail className="h-5 w-5" />}
          title="Email"
          value="support@lspdf.tools"
          description="For all inquiries"
        />
        <ContactCard
          icon={<Clock className="h-5 w-5" />}
          title="Response Time"
          value="2-3 business days"
          description="Mon-Fri, 9am-6pm UTC"
        />
        <ContactCard
          icon={<Globe className="h-5 w-5" />}
          title="Worldwide"
          value="Remote-first team"
          description="Serving users globally"
        />
      </div>

      {/* Contact Form */}
      <LegalSection title="Send us a Message" id="form">
        <p>
          Fill out the form below and we&rsquo;ll get back to you as soon as possible. Choose the option
          that best describes your inquiry to help us route your message to the right team member.
        </p>

        <div className="mt-6 not-prose">
          <Card>
            <CardContent className="p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Message sent successfully!</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thank you for reaching out. We&rsquo;ve received your message and will get back to you
                    within 2-3 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Form Type Selector */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      What is your message about?
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {formTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormType(type.id)}
                          className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all ${
                            formType === type.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-border hover:border-primary/30 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            {type.icon}
                            {type.label}
                          </div>
                          <p className="text-xs text-muted-foreground leading-tight">
                            {type.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">
                        Your Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        maxLength={200}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium mb-1.5 block">
                      Subject <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={
                        formType === 'bug'
                          ? 'e.g., Merge tool not working in Chrome'
                          : formType === 'feature'
                            ? 'e.g., Add support for ePub files'
                            : formType === 'support'
                              ? 'e.g., How do I batch process PDFs?'
                              : 'Briefly describe your message'
                      }
                      required
                      maxLength={200}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium mb-1.5 block">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        formType === 'bug'
                          ? 'Please describe the bug, including:\n• What you were trying to do\n• What happened\n• What you expected to happen\n• Browser and OS version'
                          : 'Tell us more details...'
                      }
                      required
                      rows={6}
                      maxLength={2000}
                      className="resize-y min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {message.length} / 2000 characters
                    </p>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                    <p className="text-xs text-muted-foreground">
                      By submitting this form, you agree to our{' '}
                      <a href="/privacy" className="text-primary underline">
                        Privacy Policy
                      </a>
                      .
                    </p>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white min-w-[140px]"
                    >
                      {submitting ? (
                        <>
                          <span className="animate-pulse">Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </LegalSection>

      {/* Other ways to reach us */}
      <LegalSection title="Other Ways to Reach Us" id="other-ways">
        <p>
          Prefer a different channel? Here are other ways to get in touch or stay connected with us:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 not-prose">
          <SocialCard
            icon={<Github className="h-5 w-5" />}
            title="GitHub"
            description="Report issues, suggest features, or contribute to the codebase."
            linkText="View Repository"
            linkHref="https://github.com/girishlade111/LS-PDF-Tool"
          />
          <SocialCard
            icon={<Twitter className="h-5 w-5" />}
            title="Twitter / X"
            description="Follow us for product updates, tips, and announcements."
            linkText="Follow Us"
