'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setStatus(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const data = await response.json();
    setSending(false); setStatus(response.ok ? 'Thanks — your message was sent.' : data.error || 'Unable to send your message.');
    if (response.ok) event.currentTarget.reset();
  }

  return <div className="min-h-screen bg-slate-950 text-white py-16 px-4"><div className="max-w-3xl mx-auto"><Link href="/rescue" className="text-purple-300 underline">Back to Rescue</Link><div className="text-center my-10"><h1 className="text-4xl font-bold mb-4">Contact NeuroNest</h1><p className="text-slate-400">Questions, feedback, or a problem with your account? We&apos;re here to help.</p><p className="text-slate-400 mt-3">Email: support@neuronest.work</p></div><form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5"><label className="block"><span className="text-sm text-slate-300">Name</span><input name="name" required maxLength={120} className="mt-2 w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white" /></label><label className="block"><span className="text-sm text-slate-300">Email</span><input name="email" type="email" required maxLength={320} className="mt-2 w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white" /></label><label className="block"><span className="text-sm text-slate-300">Message</span><textarea name="message" required maxLength={5000} rows={6} className="mt-2 w-full rounded-lg bg-slate-800 border border-slate-700 p-3 text-white" /></label><button disabled={sending} className="w-full min-h-[48px] rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 font-semibold">{sending ? 'Sending…' : 'Send message'}</button>{status && <p role="status" className="text-center text-slate-300">{status}</p>}</form></div></div>;
}
