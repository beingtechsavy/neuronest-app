import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy - NeuroNest',
  description: 'Shipping Policy for NeuroNest AI-powered study assistant',
};

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-2xl p-8">
          <h1 className="text-4xl font-bold text-white mb-8">Shipping Policy</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Digital Service - No Physical Shipping</h2>
              <p className="text-slate-300 mb-4">
                NeuroNest is a digital software-as-a-service (SaaS) platform that provides AI-powered study assistance through our web application. Since our service is entirely digital, we do not ship any physical products.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Instant Access</h2>
              <p className="text-slate-300 mb-4">
                Upon successful subscription to any of our paid plans, you will receive:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li><strong>Immediate access</strong> to your upgraded account features</li>
                <li><strong>Instant activation</strong> of premium AI capabilities</li>
                <li><strong>Real-time updates</strong> to your account dashboard</li>
                <li><strong>Email confirmation</strong> of your subscription activation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Service Delivery</h2>
              <p className="text-slate-300 mb-4">
                Our service is delivered through:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li><strong>Web Application:</strong> Access through www.neuronest.work</li>
                <li><strong>Cloud-based Platform:</strong> Available 24/7 from any device</li>
                <li><strong>Automatic Updates:</strong> New features deployed seamlessly</li>
                <li><strong>Cross-platform Access:</strong> Works on desktop, tablet, and mobile</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Account Activation Timeline</h2>
              <div className="bg-slate-700 p-6 rounded-lg mb-4">
                <h3 className="text-xl font-semibold text-white mb-3">Subscription Process:</h3>
                <ol className="text-slate-300 list-decimal list-inside space-y-2">
                  <li><strong>Payment Processing:</strong> 1-2 minutes</li>
                  <li><strong>Account Upgrade:</strong> Instant (automated)</li>
                  <li><strong>Feature Activation:</strong> Immediate</li>
                  <li><strong>Confirmation Email:</strong> Within 5 minutes</li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Global Availability</h2>
              <p className="text-slate-300 mb-4">
                Since NeuroNest is a digital service, it is available worldwide with no geographical restrictions or shipping limitations. Our service can be accessed from:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li>Any country with internet access</li>
                <li>All major web browsers (Chrome, Firefox, Safari, Edge)</li>
                <li>Desktop and mobile devices</li>
                <li>Multiple time zones with 24/7 availability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Technical Requirements</h2>
              <p className="text-slate-300 mb-4">
                To access NeuroNest, you only need:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li><strong>Internet Connection:</strong> Stable broadband recommended</li>
                <li><strong>Modern Web Browser:</strong> Updated to latest version</li>
                <li><strong>Device:</strong> Computer, tablet, or smartphone</li>
                <li><strong>Account:</strong> Valid email address for registration</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Service Interruptions</h2>
              <p className="text-slate-300 mb-4">
                While we don't ship physical products, we are committed to providing uninterrupted service:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li><strong>99.9% Uptime:</strong> Reliable cloud infrastructure</li>
                <li><strong>Scheduled Maintenance:</strong> Announced in advance</li>
                <li><strong>Emergency Support:</strong> 24/7 technical monitoring</li>
                <li><strong>Data Backup:</strong> Your information is always protected</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Subscription Management</h2>
              <p className="text-slate-300 mb-4">
                Unlike physical products, your NeuroNest subscription provides:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li><strong>Flexible Cancellation:</strong> Cancel anytime through your account</li>
                <li><strong>Instant Changes:</strong> Upgrade or downgrade plans immediately</li>
                <li><strong>Continuous Access:</strong> Service continues until subscription ends</li>
                <li><strong>Data Retention:</strong> Your study data remains accessible</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Customer Support</h2>
              <p className="text-slate-300 mb-4">
                Instead of shipping support, we provide comprehensive digital assistance:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li><strong>Email Support:</strong> support@neuronest.com</li>
                <li><strong>Help Documentation:</strong> Comprehensive guides and tutorials</li>
                <li><strong>Account Management:</strong> Self-service through your dashboard</li>
                <li><strong>Technical Support:</strong> Assistance with any service issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Export</h2>
              <p className="text-slate-300 mb-4">
                While we don't ship physical items, we do provide data portability:
              </p>
              <ul className="text-slate-300 mb-4 list-disc list-inside">
                <li><strong>Data Export:</strong> Download your study data anytime</li>
                <li><strong>Account Backup:</strong> Export your subjects, tasks, and progress</li>
                <li><strong>Format Options:</strong> JSON, CSV, or PDF formats available</li>
                <li><strong>Privacy Compliance:</strong> Full data ownership and control</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
              <p className="text-slate-300 mb-4">
                For any questions about our digital service delivery or account access:
              </p>
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-300 mb-2">
                  <strong>Email:</strong> support@neuronest.com
                </p>
                <p className="text-slate-300 mb-2">
                  <strong>Website:</strong> www.neuronest.work
                </p>
                <p className="text-slate-300">
                  <strong>Response Time:</strong> Within 24 hours
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Policy Updates</h2>
              <p className="text-slate-300 mb-4">
                This shipping policy may be updated to reflect changes in our service delivery methods. Any updates will be posted on this page with a revised "Last updated" date.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}