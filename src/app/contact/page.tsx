'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Button, Card, Input, Textarea } from '@/components/ui';

export default function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus(null);
    setFailed(false);

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const payload = await response.json();
      setSending(false);

      if (response.ok) {
        setStatus('Thanks — your message was sent. We reply within 2 business days.');
        form.reset();
      } else {
        setFailed(true);
        setStatus(payload.error || 'Unable to send your message.');
      }
    } catch {
      setSending(false);
      setFailed(true);
      setStatus('Unable to reach the server. Please try again, or email us directly.');
    }
  }

  return (
    <MarketingShell width="narrow" back={{ href: '/', label: 'Back to home' }}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Contact NeuroNest</h1>
        <p className="mt-2 text-base leading-relaxed text-[#949BA4]">
          Questions, feedback, or a problem with your account? We read every message.
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-[#DBDEE1]">
          <Mail size={16} className="shrink-0 text-[#949BA4]" aria-hidden="true" />
          <a href="mailto:support@neuronest.work" className="underline underline-offset-4 hover:text-[#2DD4BF]">
            support@neuronest.work
          </a>
        </p>
      </header>

      <Card>
        <form onSubmit={submit} className="space-y-5">
          <Input label="Your name" name="name" required maxLength={120} autoComplete="name" />
          <Input label="Email" name="email" type="email" required maxLength={320} autoComplete="email" />
          <Textarea
            label="Message"
            name="message"
            required
            maxLength={5000}
            rows={6}
            hint="The more specific you are, the faster we can help."
          />

          <Button type="submit" size="lg" fullWidth disabled={sending}>
            <Send size={18} aria-hidden="true" />
            {sending ? 'Sending…' : 'Send message'}
          </Button>

          {status && (
            <p
              role={failed ? 'alert' : 'status'}
              className={`text-center text-sm ${failed ? 'text-[#FF6B6B]' : 'text-[#2DD4BF]'}`}
            >
              {status}
            </p>
          )}
        </form>
      </Card>
    </MarketingShell>
  );
}
