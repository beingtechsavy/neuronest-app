"""
Focus State Broadcaster for Slack & Discord
Protects neurodivergent focus by setting custom status and snoozing notifications
when a NeuroNest focus session or rescue action begins.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any

def update_slack_status(token: str, text: str, emoji: str = ":seedling:", snooze_minutes: int = 25):
    """Sets custom status and snoozes notifications in Slack."""
    # 1. Update Profile Status
    profile_url = "https://slack.com/api/users.profile.set"
    profile_data = {
        "profile": {
            "status_text": text,
            "status_emoji": emoji,
            "status_expiration": 0
        }
    }
    req = urllib.request.Request(
        profile_url,
        data=json.dumps(profile_data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            print(f"[Slack] Profile Status set: {res.get('ok')}")
    except Exception as e:
        print(f"[Slack] Profile Error: {e}")

    # 2. Set DND Snooze
    if snooze_minutes > 0:
        dnd_url = f"https://slack.com/api/dnd.setSnooze?num_minutes={snooze_minutes}"
        dnd_req = urllib.request.Request(
            dnd_url,
            headers={"Authorization": f"Bearer {token}"}
        )
        try:
            with urllib.request.urlopen(dnd_req) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                print(f"[Slack] Snooze active for {snooze_minutes}m: {res.get('ok')}")
        except Exception as e:
            print(f"[Slack] DND Error: {e}")

def update_discord_status(webhook_url: Optional_str = None, text: str = "Focus Session — NeuroNest"):
    """Posts focus notice to Discord channel/webhook."""
    if not webhook_url:
        print("[Discord] No DISCORD_WEBHOOK_URL set. Simulating broadcast.")
        return

    payload = {
        "username": "NeuroNest Focus Guard",
        "avatar_url": "https://www.neuronest.work/favicon.svg",
        "embeds": [
            {
                "title": "🌱 Focus Session Started",
                "description": f"User is currently in deep focus.\n**Task**: `{text}`\nPlease hold non-urgent pings.",
                "color": 0x0D9488
            }
        ]
    }
    req = urllib.request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[Discord] Broadcast sent: {resp.status}")
    except Exception as e:
        print(f"[Discord] Error: {e}")

def main():
    print("=" * 60)
    print("NEURONEST FOCUS STATE BROADCASTER (SLACK & DISCORD)")
    print("=" * 60)

    slack_token = os.environ.get("SLACK_USER_TOKEN")
    discord_webhook = os.environ.get("DISCORD_WEBHOOK_URL")

    status_text = "In Focus Session — NeuroNest 🌱"
    minutes = 25

    if slack_token:
        print(f"Broadcasting to Slack: '{status_text}' (Snooze: {minutes}m)")
        update_slack_status(slack_token, status_text, ":seedling:", minutes)
    else:
        print("[Slack] SLACK_USER_TOKEN not set. Set in .env.local to activate auto-DND.")

    if discord_webhook:
        print(f"Broadcasting to Discord channel: '{status_text}'")
        update_discord_status(discord_webhook, status_text)
    else:
        print("[Discord] DISCORD_WEBHOOK_URL not set. Set in .env.local to post focus status.")

    print("\nFocus shield active. External interruptions muted.")
    print("=" * 60)

if __name__ == "__main__":
    main()
