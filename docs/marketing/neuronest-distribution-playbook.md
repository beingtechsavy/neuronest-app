# NeuroNest Product, Market, and Distribution Playbook

This is the operating plan for getting NeuroNest discovered, tried, remembered, and recommended.

## 1. What NeuroNest is

### The product in one sentence

> NeuroNest helps you begin the task you are resisting by giving you one small, realistic next action.

### The user problem

The user often already knows the task:

- “I need to reply to the email.”
- “I need to study for the exam.”
- “I need to clean the kitchen.”
- “I need to start the report.”

The problem is not always planning. The problem is that the first physical action is inaccessible because the task feels too large, uncertain, boring, emotionally risky, or competing with everything else.

### The product wedge

NeuroNest should own this moment:

```text
I know what I need to do.
I cannot begin.
Give me the next action.
```

The dashboard, calendar, timer, AI breakdown, and analytics support this wedge. They should not lead the public marketing until user evidence proves they are the reason people return.

### What NeuroNest is not

- Not therapy.
- Not a diagnosis tool.
- Not a cure for ADHD or procrastination.
- Not a generic “AI productivity operating system.”
- Not another planner that asks users to organize everything before getting help.

## 2. Who to target first

Start with one broad but behaviorally specific segment:

> Students, knowledge workers, and neurodivergent adults who know what they need to do but repeatedly struggle to start.

Do not split the product into separate brands yet. Instead, use examples that make the problem recognizable:

1. Difficult email.
2. Assignment or report.
3. Cleaning or life admin.
4. Coding bug or work task.

After 20–30 real users, choose the segment with the strongest start rate and repeat use.

## 3. Public profile setup

### LinkedIn headline / page description

```text
NeuroNest helps you start the task you’re resisting — one small next action at a time.
```

### Instagram bio

```text
Know what to do but can’t begin?
Get one small next action.
Try NeuroNest ↓
```

### Short profile description

```text
NeuroNest is a task-initiation tool for the moment when planning is not the problem — starting is. Describe the task, choose the friction, and get one realistic first action. No account required.
```

Replace the profile link placeholder with:

```text
https://www.neuronest.work/rescue?ref=linkedin
https://www.neuronest.work/rescue?ref=instagram
```

Use separate `ref` values so traffic can be compared without collecting personal data.

## 4. Google discoverability: exact order of operations

### Step 1 — Deploy the current repository

The live site previously served old metadata, the old AdSense script, and the old `neuronest.app` Open Graph URL. Deploy the current branch first.

### Step 2 — Verify these URLs after deployment

```text
https://www.neuronest.work/
https://www.neuronest.work/robots.txt
https://www.neuronest.work/sitemap.xml
https://www.neuronest.work/neuronest-mark.svg
https://www.neuronest.work/neuronest-og.svg
```

The homepage source should contain:

- “One small next action.”
- `https://www.neuronest.work` as the canonical/OG URL.
- No AdSense request.

### Step 3 — Add Google Search Console

1. Open Google Search Console.
2. Add a **Domain property** for `neuronest.work` if possible.
3. Verify DNS ownership with the TXT record Google provides.
4. Submit:

```text
https://www.neuronest.work/sitemap.xml
```

5. Use URL Inspection for:

```text
https://www.neuronest.work/
https://www.neuronest.work/rescue
https://www.neuronest.work/features
https://www.neuronest.work/pricing
```

6. Click “Request indexing” for the homepage and Rescue page.
7. Add the returned verification token to:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<token>
```

### Step 4 — Do not expect instant ranking

For a new domain, discovery can take days and meaningful ranking can take weeks or months. Search Console is the source of truth for:

- Discovered but not indexed.
- Crawled but not indexed.
- Redirect or canonical problems.
- Mobile usability problems.

Searching only `NeuroNest` is also weak evidence if the brand has little authority. Build branded mentions and links through social profiles, founder posts, directories, and user stories.

### Step 5 — Create indexable content

Do not publish empty “SEO articles.” Write useful pages around the real problem:

- “How to start a task when you already know what to do”
- “The difference between a task and a first action”
- “How to make an overwhelming task smaller”
- “What to do when a work email feels impossible to answer”
- “A practical starting routine for students who feel stuck”

Each article should include:

1. A clear problem statement.
2. A practical example.
3. A small exercise.
4. A link to `/rescue`.
5. No medical claims or invented research statistics.

## 5. Content strategy

Use five content pillars:

### Pillar A — The starting problem

Explain why “do the report” is not an executable action.

### Pillar B — Before/after examples

```text
Task: Reply to a difficult email
Friction: Afraid of saying the wrong thing
First action: Open the email and write one unsent sentence
```

### Pillar C — Founder learning

Share what real users say, including failures. Trust grows faster from specific observations than from polished claims.

### Pillar D — Product demonstrations

Record a 20–40 second screen capture:

1. Type a real resisted task.
2. Select the friction.
3. Show the first action.
4. Click “Start.”

### Pillar E — Practical prompts

Give the audience a prompt they can use without NeuroNest:

```text
What is the smallest visible action that changes the state of this task?
```

## 6. First 12 posts

Publish the same idea natively on LinkedIn and Instagram, adapted to each format.

### Post 1 — Positioning

```text
Knowing what to do and being able to start are different problems.

“Write the report” is a task.
“Open the document and type the title” is a first action.

NeuroNest is for the moment when the task is known but the starting point feels inaccessible.
```

### Post 2 — Demo

```text
Task: Reply to a difficult email
Friction: I’m anxious about doing it badly
NeuroNest action: Open the email and write one deliberately imperfect sentence

The goal is not to finish the email.
The goal is to cross the starting line.
```

### Post 3 — Question

```text
What task do you keep postponing even though you already know how to do it?

Reply with the task. I’m collecting real examples for NeuroNest’s Rescue flow.
```

### Post 4 — Anti-feature

```text
The first version of NeuroNest does not ask you to build a perfect project system.

If you are already stuck, more setup can become another task.

Describe the task. Get one next action. Start.
```

### Post 5 — Cleaning example

```text
“Clean the kitchen” is too large to start.

“Stand near the sink and choose one visible item” is small enough to test.

Make the first action smaller than your resistance.
```

### Post 6 — Student example

```text
Studying is not always a motivation problem.

Sometimes “study chapter 4” hides too many decisions.

The first action can be: open the chapter and read one heading.
```

### Post 7 — Founder learning

```text
I expected people to ask for more planning.

The more useful request was simpler: “Just tell me what to do first.”

That observation shaped NeuroNest Rescue.
```

### Post 8 — Product walkthrough

Show the four friction choices and explain that different resistance needs different first actions.

### Post 9 — Different step

```text
If a first step feels wrong, that is information — not failure.

NeuroNest lets you make it smaller or try a different approach without starting over.
```

### Post 10 — Founder story

Describe one real moment when you postponed something and what made the first action easier.

### Post 11 — Feedback request

```text
I’m looking for 10 people to try NeuroNest on one real resisted task.

No signup required. I want to know:
1. Did the action feel physically doable?
2. Did you start?
3. What felt wrong?
```

### Post 12 — Direct invitation

```text
If there is one task you know you need to start today, try this:

https://www.neuronest.work/rescue?ref=social

No account required. One small next action.
```

## 7. Thirty-day operating cadence

### Every weekday

- 20 minutes replying to relevant conversations.
- 20 minutes leaving useful comments on posts from the target audience.
- 10 minutes recording user language and objections.

### Three times per week

- Publish one LinkedIn post.
- Publish one Instagram Reel or carousel.
- Invite five people individually to test one real task.

### Once per week

- Speak with three users or prospects.
- Review task submission → action start conversion.
- Review which examples create replies.
- Improve one sentence of the landing page based on real language.

### Do not do yet

- Broad paid ads.
- Influencer sponsorships.
- Mass cold email.
- Fake testimonials.
- Medical or clinical claims.
- A large affiliate platform.
- Posting only motivational quotes with no product connection.

## 8. Distribution loop

```text
Specific problem post
  → visitor recognizes their own stuck task
  → Rescue works before signup
  → completion asks for helpfulness feedback
  → user shares or returns
  → real language creates the next post
```

The product must create the marketing insight. Every conversation should improve the generator, copy, or audience definition.

## 9. Metrics to watch

### Activation

```text
activated user = submits a real task + receives an action + clicks Start
activation rate = action starts / task submissions
```

### Product usefulness

- Percentage selecting “Still stuck.”
- Percentage accepting an adaptation.
- “Did this help you begin?” yes/no.
- Seven-day return.

### Distribution

- Landing visits by `ref` parameter.
- Task submissions by source.
- Action starts by source.
- Replies/comments per post.
- Interviews booked.

Do not optimize follower count before action starts and return behavior are visible.

## 10. This week’s exact checklist

- [ ] Deploy the current repository.
- [ ] Confirm `/robots.txt` and `/sitemap.xml` return 200.
- [ ] Add and verify Google Search Console.
- [ ] Submit the sitemap and request indexing for `/` and `/rescue`.
- [ ] Replace LinkedIn and Instagram profile bios with the copy above.
- [ ] Add the correct profile URLs to the brand/social documentation.
- [ ] Publish Posts 1–3.
- [ ] Invite 10 people to use Rescue on a real task.
- [ ] Hold three short feedback conversations.
- [ ] Log exact user phrases in the progress document.
