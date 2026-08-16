import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - NeuroNest',
  description: 'Terms of Service for NeuroNest AI productivity platform',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-2xl p-8">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-300 mb-4">
                By accessing and using NeuroNest (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-slate-300 mb-4">
                NeuroNest is an AI-powered productivity platform that helps professionals organize their work, break down complex tasks, and track their progress. The service includes:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li>AI-powered task breakdown and planning</li>
                <li>Project and area management</li>
                <li>Progress tracking and weekly insights</li>
                <li>Smart daily planning</li>
                <li>Focus timer</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <p className="text-slate-300 mb-4">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription Plans</h2>
              <p className="text-slate-300 mb-4">
                NeuroNest offers multiple subscription tiers:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li><strong>Free Plan:</strong> Limited features with usage restrictions</li>
                <li><strong>Pro Plan ($9/month or $79/year):</strong> Full access to all features</li>
              </ul>
              <p className="text-slate-300 mb-4">
                Subscription fees are billed monthly in advance. You may cancel your subscription at any time through your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Payment Terms</h2>
              <p className="text-slate-300 mb-4">
                By subscribing to a paid plan, you agree to pay all applicable fees. Payments are processed securely through our payment processor. All fees are non-refundable except as required by law or as specified in our refund policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Acceptable Use</h2>
              <p className="text-slate-300 mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use the Service for commercial purposes without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
              <p className="text-slate-300 mb-4">
                The Service and its original content, features, and functionality are owned by NeuroNest and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Privacy Policy</h2>
              <p className="text-slate-300 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Refund Policy</h2>
              <p className="text-slate-300 mb-4">
                We offer a 30-day money-back guarantee for all paid subscriptions. If you are not satisfied with the Service within 30 days of your initial purchase, you may request a full refund. Refunds are processed within 5-10 business days. For detailed refund terms, please see our Refund Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
              <p className="text-slate-300 mb-4">
                In no event shall NeuroNest, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>
              <p className="text-slate-300 mb-4">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to Terms</h2>
              <p className="text-slate-300 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Information</h2>
              <p className="text-slate-300 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-slate-300">
                Email: support@neuronest.work<br />
                Website: https://neuronest.work
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}