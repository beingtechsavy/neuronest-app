import { Metadata } from 'next';
import { LegalArticle, MarketingShell } from '@/components/MarketingShell';

export const metadata: Metadata = {
  title: 'Privacy Policy - NeuroNest',
  description: 'Privacy Policy for NeuroNest task-initiation and productivity service',
  alternates: { canonical: 'https://www.neuronest.work/privacy' },
};

export default function PrivacyPolicy() {
  return (
    <MarketingShell>
      <LegalArticle title="Privacy Policy" updated={new Date().toLocaleDateString()}>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">1. Introduction</h2>
              <p className="mb-4">
                NeuroNest (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our task-initiation and productivity service.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">2. Information We Collect</h2>

              <h3 className="mb-2 mt-6 text-base font-semibold text-[#F2F3F5]">Personal Information</h3>
              <p className="mb-4">
                We collect information you provide directly to us, such as:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li>Name and email address when you create an account</li>
                <li>Profile information and preferences</li>
                <li>Payment information (processed securely by our payment processor)</li>
                <li>Communications with our support team</li>
              </ul>

              <h3 className="mb-2 mt-6 text-base font-semibold text-[#F2F3F5]">Usage Information</h3>
              <p className="mb-4">
                We automatically collect certain information about your use of our service:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li>Study data, tasks, and progress information</li>
                <li>Feature usage and interaction patterns</li>
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">3. How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect to:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li>Provide, maintain, and improve our service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Personalize your experience and provide AI-powered recommendations</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Analyze usage patterns to improve our service</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">4. Information Sharing and Disclosure</h2>
              <p className="mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li><strong>Service Providers:</strong> We share information with trusted third-party service providers who assist us in operating our service</li>
                <li><strong>Payment Processing:</strong> Payment information is shared with our payment processor to process transactions</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> Information may be transferred in connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">5. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure hosting infrastructure</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">6. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as necessary to provide our service and fulfill the purposes outlined in this Privacy Policy. We will delete or anonymize your information when it is no longer needed, unless we are required to retain it by law.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">7. Your Rights and Choices</h2>
              <p className="mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="mb-4">
                To exercise these rights, please contact us at privacy@neuronest.work.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">8. Cookies and Tracking Technologies</h2>
              <p className="mb-4">
                We use cookies and similar tracking technologies to collect and use personal information about you. You can control cookies through your browser settings, but disabling cookies may affect the functionality of our service.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">9. Third-Party Services</h2>
              <p className="mb-4">
                Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies before providing any information.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">10. Children&apos;s Privacy</h2>
              <p className="mb-4">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">11. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">12. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">13. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mb-4">
                Email: privacy@neuronest.work<br />
                Website: https://www.neuronest.work/contact
              </p>
            </section>
      </LegalArticle>
    </MarketingShell>
  );
}
