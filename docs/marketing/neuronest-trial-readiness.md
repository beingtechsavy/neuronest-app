# NeuroNest: trial-readiness findings

**Status (22 October 2026): NOT YET CLEARED for public promotion.** This is a repository review, not proof that production works. Aim for a reliable, narrow **Rescue** trial first; no software can be guaranteed 100% defect-free.

## What the product is testing

NeuroNest's clearest promise is helping someone who knows their task but cannot begin get **one small next action**. The no-account Rescue flow already covers task entry, friction selection, an action, Start, adaptation, and completion feedback. The older student/subjects/chapters framing and the wider dashboard, AI, calendar, and timer should not obscure this core promise. See `src/components/rescue/`, `src/lib/rescue/`, `.kiro/steering/product.md`, and `docs/marketing/neuronest-distribution-playbook.md`.

**Business verdict: needs validation, not a pivot.** No interviews, observed starts/completions, repeat use, or payments are documented in `neuronest-progress-log.md`. The proposed ₹299/month and ₹2,499/year prices and Pro benefits remain hypotheses, not proven demand.

## Release blockers and checks

- [ ] **Reproducible checks:** In a working Node/package-manager environment, install from the lockfile and run `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Record exact output and resolve failures. The reported `bun test --run` failure was **`omnirush: the real tool is not on PATH`** before tests ran; this review changed no code. `package.json` uses **Vitest** for `npm test`, not Bun's native test runner. Prior log entries claiming passes are not a current run.
- [ ] **Secrets and deployment:** Treat the local `.env` as sensitive; do not commit, share, or copy its values into reports. Verify whether any service credentials were exposed and rotate them if so. Confirm production environment, Supabase migration/RLS, auth redirects, DNS/HTTPS, email, and error handling in staging and production. See `neuronest-inputs-needed.md`.
- [ ] **Rescue end-to-end:** Test anonymous task → friction → generated action → Start → Done / Still stuck / different step / stop → save/skip → signup/resume → saved-history retrieval/deletion. Exercise short, long, unusual, and sensitive tasks; multiple adaptations; refresh/back/revisit; storage disabled; network/API failures. No silent loss of a user's work or false success message.
- [ ] **Device/accessibility:** Run the real flow on Android Chrome, iPhone Safari where available, 320/375/768px, touch-only, keyboard-only, screen reader, reduced motion, and background-tab/locked-screen timer behavior. Record and fix blocking issues.
- [ ] **Data and payment honesty:** Verify analytics and feedback actually persist in production. `action_started` currently means a **button click**, not observed task performance; completion is self-reported. Feedback is not linked to a Rescue session, and the optional comment appears after the yes/no request is sent (`CompletionScreen.tsx`). Do not infer efficacy from clicks. Do not invite paid checkout until Razorpay credentials, plan IDs, migration, webhook idempotency, entitlement, receipt, cancellation, and one real end-to-end test are confirmed; otherwise hide/disable paid claims.
- [ ] **Cross-feature smoke test:** Check signup/login, dashboard, task creation, AI breakdown/save/limits, calendar, focus, history, settings, and contact on production-like data. Fix blockers or clearly mark non-core features unavailable during a Rescue-only trial.

## Go / no-go sequence

1. **Internal QA:** All automated checks green in a reproducible environment; critical Rescue paths and failure states pass on real devices; no unresolved critical security/data-loss/payment issues.
2. **Closed trial (not marketing):** Invite 10 people individually, one real resisted task each. Observe whether they actually begin, not merely click Start. Record task, friction, workaround, action, adaptations, outcome, and exact objections with consent; do not put sensitive task text in public reports.
3. **Public marketing only after:** Trial users can complete the flow without intervention; production monitoring and support work; blockers are fixed and checks rerun; at least 20 real submissions, 10 observed starts, 5 completed actions, and three recurring objections are documented. Then choose the strongest first segment and message. These counts are initial learning gates, **not** proof of product-market fit or paid demand.

**First customers:** Begin with 10 named friends/family and 10 relevant community contacts, conduct live 10-minute Rescue sessions, then personalized outreach. Offer a manual/concierge task-starting session before asserting Pro value; ask for an actual payment commitment only after the paid delivery and checkout are safe. Track contacts → conversations → observed starts → repeats → paid pilots. Do not claim testimonials or repeat usage that have not happened.

**Next concrete action:** Get a working Node/npm toolchain and run the current checks, then complete the Rescue device and production-staging QA matrix before inviting even the closed trial.
