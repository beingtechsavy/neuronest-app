import { Metadata } from 'next';
import { LegalArticle, MarketingShell } from '@/components/MarketingShell';

export const metadata: Metadata = {
  title: 'Refund Policy - NeuroNest',
  description: 'Refund Policy for NeuroNest task-initiation and productivity service',
  alternates: { canonical: 'https://www.neuronest.work/refund' },
};

export default function RefundPolicy() {
  return (
    <MarketingShell>
      <LegalArticle title="Refund Policy" updated={new Date().toLocaleDateString()}>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">1. 30-Day Money-Back Guarantee</h2>
              <p className="mb-4">
                We stand behind the quality of NeuroNest and offer a 30-day money-back guarantee for all paid subscription plans. If you are not completely satisfied with our service within 30 days of your initial purchase, you may request a full refund.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">2. Eligibility for Refunds</h2>
              <p className="mb-4">
                To be eligible for a refund, the following conditions must be met:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li>The refund request must be made within 30 days of the initial purchase</li>
                <li>The request must be for a first-time subscription (not renewals)</li>
                <li>The account must not have violated our Terms of Service</li>
                <li>The refund request must be made by the original purchaser</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">3. What&apos;s Covered</h2>
              <p className="mb-4">
                Our refund policy covers:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                 <li><strong>Pro monthly subscriptions:</strong> Full refund within 30 days of the initial purchase</li>
                 <li><strong>Pro annual subscriptions:</strong> Refund eligibility is reviewed under the same initial-purchase guarantee</li>
                <li><strong>Annual subscriptions:</strong> Pro-rated refund based on unused time</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">4. What&apos;s Not Covered</h2>
              <p className="mb-4">
                The following are not eligible for refunds:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li>Free plan usage (no payment involved)</li>
                <li>Subscription renewals after the initial 30-day period</li>
                <li>Partial month usage after the 30-day guarantee period</li>
                <li>Accounts suspended for Terms of Service violations</li>
                <li>Requests made more than 30 days after the initial purchase</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">5. How to Request a Refund</h2>
              <p className="mb-4">
                To request a refund, please follow these steps:
              </p>
              <ol className="text-[#DBDEE1] mb-4 list-decimal list-inside">
                 <li>Contact our support team at support@neuronest.work</li>
                <li>Include your account email address and subscription details</li>
                <li>Provide a brief reason for the refund request (optional but helpful)</li>
                <li>Our team will review your request within 2 business days</li>
              </ol>
              <p className="mb-4">
                Alternatively, you can submit a refund request through your account settings or contact us via our website contact form.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">6. Refund Processing</h2>
              <p className="mb-4">
                Once your refund request is approved:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li><strong>Processing time:</strong> 2-3 business days for approval</li>
                <li><strong>Refund method:</strong> Original payment method used for purchase</li>
                <li><strong>Timeline:</strong> 5-10 business days to appear in your account</li>
                <li><strong>Confirmation:</strong> You&apos;ll receive an email confirmation when processed</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">7. Subscription Cancellation</h2>
              <p className="mb-4">
                Please note the difference between refunds and cancellations:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li><strong>Refund:</strong> Get your money back for the current billing period</li>
                <li><strong>Cancellation:</strong> Stop future billing but keep current access until period ends</li>
              </ul>
              <p className="mb-4">
                You can cancel your subscription at any time through your account settings. Cancellation stops future billing but doesn&apos;t automatically trigger a refund.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">8. Partial Refunds</h2>
              <p className="mb-4">
                In certain circumstances, we may offer partial refunds:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li>Service outages lasting more than 24 hours</li>
                <li>Technical issues preventing normal service use</li>
                <li>Billing errors or duplicate charges</li>
              </ul>
              <p className="mb-4">
                Partial refunds are calculated based on the affected service period and are processed using the same method as full refunds.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">9. Chargebacks and Disputes</h2>
              <p className="mb-4">
                Before initiating a chargeback with your bank or credit card company, please contact us directly. We&apos;re committed to resolving any issues and will work with you to find a satisfactory solution. Chargebacks may result in account suspension and additional fees.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">10. Changes to Refund Policy</h2>
              <p className="mb-4">
                We reserve the right to modify this refund policy at any time. Changes will be effective immediately upon posting on our website. Continued use of our service after changes constitutes acceptance of the new policy.
              </p>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">11. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about our refund policy or need to request a refund, please contact us:
              </p>
              <div className="bg-[#383A40] p-4 rounded-lg">
                <p className="text-[#DBDEE1] mb-2">
                   <strong>Email:</strong> support@neuronest.work
                </p>
                <p className="text-[#DBDEE1] mb-2">
                  <strong>Subject Line:</strong> Refund Request - [Your Email]
                </p>
                <p className="mb-4">
                  <strong>Response Time:</strong> Within 2 business days
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-2 mt-8 text-lg font-bold tracking-tight text-[#F2F3F5]">12. Fair Usage</h2>
              <p className="mb-4">
                Our refund policy is designed to ensure customer satisfaction while preventing abuse. We reserve the right to refuse refunds for accounts that show patterns of abuse, such as:
              </p>
              <ul className="mb-4 list-disc pl-5 space-y-1.5">
                <li>Multiple refund requests from the same user</li>
                <li>Excessive usage followed by immediate refund requests</li>
                <li>Fraudulent or suspicious activity</li>
              </ul>
            </section>
      </LegalArticle>
    </MarketingShell>
  );
}
