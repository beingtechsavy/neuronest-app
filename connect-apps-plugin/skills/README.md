# Skills Directory (`connect-apps-plugin/skills`)

This directory houses all skills exposed by the `connect-apps-plugin`. Any skill placed here is automatically discoverable by Claude Code when running with `--plugin-dir ./connect-apps-plugin`.

---

## 📦 Installed Skills Catalog

| Skill Name | Description | Key Assets / Scripts |
|------------|-------------|----------------------|
| **`connect-apps`** | Core integration orchestrator for Google Calendar, Notion, Todoist, and Slack. | `references/*.md` |
| **`programmatic-seo-generator`** | Programmatically creates high-intent landing pages for resisted tasks routing into `/rescue`. | `src/data/seoTasks.ts`, `src/app/start/[slug]/` |
| **`social-carousel-engine`** | Generates 1080x1080 vector social carousels and cards from the distribution playbook. | `scripts/generate_carousels.py`, `public/social/` |
| **`friction-benchmark-auditor`** | Audits Rescue action generation against 20 difficult ADHD tasks across 7 friction modes. | `scripts/audit_friction_benchmark.py` |
| **`adhd-ux-accessibility-evaluator`** | Checks UI components for cognitive load, touch targets (>=44px), reduced motion, and Discord-familiar dark canvas. | `scripts/evaluate_adhd_ux.py` |
| **`notion-todoist-backlog-importer`** | Ingests overdue backlog tasks from Notion/Todoist and converts them into 1-click Rescue links. | `scripts/import_backlog.py` |
| **`focus-state-broadcaster`** | Shields user attention during active sessions by setting Slack status and Discord DND. | `scripts/broadcast_focus.py` |
| **`feedback-synthesis-agent`** | Clusters user feedback into initiation failure modes, breakthroughs, and retention requests. | `scripts/synthesize_feedback.py` |

---

## 🏗️ Anatomy of a Skill

Each skill is a self-contained subfolder:

```
skills/
└── <skill-name>/
    ├── SKILL.md             # Required: Skill instructions and frontmatter
    ├── scripts/             # Optional: Deterministic helper scripts (Python, Node.js, Bash)
    └── references/          # Optional: Deep reference cards, docs, or schemas
```

---

## 📝 SKILL.md Template

```markdown
---
name: my-new-skill
description: One sentence describing what this skill does and when Claude should invoke it. Include keyword triggers.
---

# Skill Title

Instructions for Claude on how to perform this skill.

## 1. When to Use
Detail the specific user requests or scenarios that trigger this skill.

## 2. Steps to Follow
1. Step 1: Inspect state.
2. Step 2: Perform action.
3. Step 3: Verify and report.

## 3. Rules & Guardrails
- Constraints to respect.
- Error handling procedures.
```

---

## 🔄 Adding Future Skills Checklist

- [ ] Create folder: `skills/<skill-name>/`
- [ ] Add `SKILL.md` with accurate frontmatter description and trigger words.
- [ ] Add supporting docs in `references/` if the skill requires complex documentation.
- [ ] Test the skill in Claude Code using `/reload-plugins` or by restarting with `claude --plugin-dir ./connect-apps-plugin`.
