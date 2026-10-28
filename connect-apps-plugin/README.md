# Connect Apps Plugin (`connect-apps-plugin`)

A modular, extensible Claude Code plugin designed for **NeuroNest** integrations, productivity tools, and custom workflows.

---

## 📁 Directory Structure

```
connect-apps-plugin/
├── .claude-plugin/
│   └── plugin.json                  # Plugin manifest and configuration
├── skills/                          # Custom skills for Claude Code
│   ├── connect-apps/                # Primary app integration skill
│   │   ├── SKILL.md                 # Skill definition & instructions
│   │   └── references/              # API guides (Google Cal, Notion, Todoist)
│   └── README.md                    # Guide on creating and adding new skills
├── commands/                        # Custom slash commands
│   └── connect.md                   # /connect slash command definition
├── agents/                          # Specialized subagent definitions
│   └── integration-assistant.md     # Custom integration agent
├── config/                          # App connection templates & configurations
│   └── apps-config.example.json     # Configuration schema for connected apps
└── README.md                        # This documentation file
```

---

## 🚀 How to Run & Load This Plugin

### 1. Start Claude with this plugin loaded:
From your terminal in the project root:
```bash
claude --plugin-dir ./connect-apps-plugin
```

Or set the environment variable to load it in all sessions:
```bash
# In Git Bash / Zsh
export CLAUDE_CODE_PLUGIN_DIRS="/path/to/connect-apps-plugin"

# In PowerShell
$env:CLAUDE_CODE_PLUGIN_DIRS = "D:\Arpan's setup\Github projects\Neuronest\connect-apps-plugin"
```

### 2. Available Slash Commands:
Once loaded, you can type:
* `/connect` — Display status of connected external services, authenticate, and test integrations.
* `/skills` — Verify that `connect-apps` is active.

---

## 🛠️ How to Add Future Skills

To add a new skill to this plugin:

1. Create a new directory inside `skills/<your-skill-name>/`:
   ```
   skills/
   └── my-new-skill/
       ├── SKILL.md
       ├── scripts/          # (Optional helper scripts)
       └── references/       # (Optional reference guides)
   ```
2. In `SKILL.md`, define:
   - Frontmatter (`name`, `description`, trigger phrases)
   - Clear instructions for Claude on how to perform the skill.
3. Reload plugins in your active session with `/reload-plugins` or restart Claude with `--plugin-dir ./connect-apps-plugin`.

---

## 🔌 Supported App Integrations (Roadmap)

* [x] **Google Calendar:** Two-way sync with NeuroNest Magic Scheduler.
* [x] **Notion:** Import task databases, export focus session summaries.
* [x] **Todoist:** Sync quick-capture inbox items and backlog tasks.
* [ ] **Slack:** Status sync during active Focus Sessions ("Do Not Disturb").
* [ ] **Apple Reminders:** Webhook/export bridge.
