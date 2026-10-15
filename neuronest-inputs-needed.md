# NeuroNest Inputs Needed Before Production Launch

The repository implementation has been completed as far as code, schema, placeholders, and local verification allow. These items require access to external services, production accounts, legal decisions, or real users.

## 1. Supabase

Set these in local/Vercel environments:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
```

Run and verify:

- `docs/migrations/20261012_launch_safety.sql`
- Existing schema compatibility with `tasks`, `subjects`, `chapters`, `usage_limits`, and `ai_breakdowns`.
- RLS policies in the production project.
- Supabase Auth redirect URLs:
  - `https://www.neuronest.work/auth/callback`
  - Local development callback URL if needed.
- Google OAuth credentials and authorized redirect URL if Google sign-in remains enabled.

## 2. Azure OpenAI

```env
AZURE_OPENAI_ENDPOINT=<your-azure-openai-endpoint>
AZURE_OPENAI_API_KEY=<server-only-api-key>
AZURE_OPENAI_DEPLOYMENT_NAME=<deployment-name>
```

Confirm the deployment supports JSON output and set the production model/token budget appropriate for the account quota.

## 3. Razorpay

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=<public-key-id>
RAZORPAY_KEY_SECRET=<server-only-key-secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>
RAZORPAY_PRO_PLAN_ID_MONTHLY=<monthly-plan-id>
RAZORPAY_PRO_PLAN_ID_YEARLY=<yearly-plan-id>
RAZORPAY_PRO_MONTHLY_PAYMENT_LINK=<optional-hosted-payment-link>
RAZORPAY_PRO_YEARLY_PAYMENT_LINK=<optional-hosted-payment-link>
```

Configure a webhook to:

```text
https://www.neuronest.work/api/payments/webhook
```

Subscribe to the payment and subscription events used by the database function:

- `payment.captured`
- `payment.failed`
- `subscription.activated`
- `subscription.charged`
- `subscription.pending`
- `subscription.halted`
- `subscription.cancelled`
- `subscription.completed`

Perform one test payment and verify that:

1. The webhook signature is accepted.
2. A Pro subscription is created or updated.
3. A duplicate event does not create a second receipt or entitlement.
4. A failed payment never grants Pro.

## 4. Resend

```env
RESEND_API_KEY=<resend-api-key>
```

Verify the sending domain and these addresses:

- `noreply@neuronest.work`
- `support@neuronest.work`
- `privacy@neuronest.work`

## 5. Production configuration

```env
NEXT_PUBLIC_APP_URL=https://www.neuronest.work
NEXT_PUBLIC_SUPPORT_EMAIL=support@neuronest.work
NEXT_PUBLIC_PRIVACY_EMAIL=privacy@neuronest.work
NEXT_PUBLIC_LINKEDIN_URL=<your-official-linkedin-page-url>
NEXT_PUBLIC_INSTAGRAM_URL=<your-official-instagram-page-url>
```

Confirm DNS, HTTPS, canonical redirects, email DNS, and the deployed webhook URL.

## 6. Manual QA input

Please test with the devices available to you:

- Chrome Android.
- Safari iPhone if available.
- 320px, 375px, and 768px viewports.
- Touch-only flow.
- Keyboard-only flow.
- Screen reader labels and announcements.
- Reduced-motion mode.
- Screen lock/background-tab behavior during the activation and focus timers.

Record any issue in `neuronest-progress-log.md` with device, route, reproduction steps, and expected behavior.

## 6A. Search and social profile inputs

After deploying the current repository:

- Add the Google Search Console verification token as `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
- Replace the LinkedIn and Instagram URL placeholders in the production environment.
- Confirm the profile URLs use the same brand name, profile image, description, and website link.
- Put the official LinkedIn and Instagram links into `src/app/page.tsx` structured data through those environment variables.

## 7. Product and legal decisions

Confirm before public payment launch:

- Whether the ₹299 monthly / ₹2,499 yearly prices are final.
- Whether the 30-day initial-purchase refund policy is final.
- The legal entity/support name to use in payment receipts and policy pages.
- Whether task text should be saved by default for authenticated cloud history or only after explicit opt-in.
- Whether Google OAuth and Resend welcome email are both needed; Supabase handles auth verification/reset emails.

## 8. Real-user validation

Code cannot generate these plan milestones. Run the design-partner process from the implementation plan:

- 10 task-initiation interviews.
- 20 real task submissions.
- 10 action starts.
- 5 completed actions.
- Three recurring objections.
- Five permissioned testimonials before using them publicly.

## 9. Marketing assets

Still required from the founder:

- 30–60 second product demo recording.
- Interview spreadsheet and consent process.
- Approved founding-plan copy.
- Approved referral reward.
- Community list and moderator approvals.
