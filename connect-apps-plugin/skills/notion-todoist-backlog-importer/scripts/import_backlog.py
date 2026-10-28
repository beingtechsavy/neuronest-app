"""
Notion & Todoist Backlog Importer for NeuroNest
Pulls postponed or stagnant tasks from Notion / Todoist, identifies initiation inertia,
and transforms them into zero-barrier NeuroNest Rescue flows.
"""

import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional

def fetch_todoist_overdue_tasks(api_token: str) -> List[Dict[str, Any]]:
    """Fetches overdue and today tasks from Todoist REST API."""
    url = "https://api.todoist.com/rest/v2/tasks?filter=overdue|today"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                return data
    except Exception as e:
        print(f"Todoist API Error: {e}")
        return []

def format_rescue_link(task_content: str, friction: str = "feels-too-big") -> str:
    from urllib.parse import quote
    base_url = "https://www.neuronest.work/rescue"
    return f"{base_url}?task={quote(task_content)}&friction={quote(friction)}"

def transform_backlog_to_rescues(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    rescues = []
    for t in tasks:
        content = t.get("content") or t.get("title") or "Unnamed task"
        priority = t.get("priority", 1)

        # Estimate likely friction based on keywords
        lower = content.lower()
        if any(w in lower for w in ["email", "call", "message", "reply"]):
            friction = "anxious-about-doing-it-badly"
        elif any(w in lower for w in ["clean", "wash", "laundry", "tidy"]):
            friction = "low-energy"
        elif any(w in lower for w in ["study", "chapter", "exam", "report", "paper"]):
            friction = "feels-too-big"
        elif any(w in lower for w in ["tax", "bill", "invoice", "admin"]):
            friction = "feels-boring"
        else:
            friction = "dont-know-where-to-start"

        rescues.append({
            "id": t.get("id"),
            "task": content,
            "detected_friction": friction,
            "rescue_url": format_rescue_link(content, friction)
        })
    return rescues

def main():
    print("=" * 60)
    print("NEURONEST NOTION & TODOIST BACKLOG RESCUE IMPORTER")
    print("=" * 60)

    token = os.environ.get("TODOIST_API_TOKEN")
    if not token:
        print("[Notice] No TODOIST_API_TOKEN found in environment.")
        print("Using sample stale tasks to demonstrate conversion:")
        sample_tasks = [
            {"id": "demo-1", "content": "Reply to landlord about lease renewal"},
            {"id": "demo-2", "content": "Clean the bathroom sink and mirror"},
            {"id": "demo-3", "content": "Finish quarterly report draft"},
            {"id": "demo-4", "content": "Review insurance policy statement"},
        ]
        rescues = transform_backlog_to_rescues(sample_tasks)
    else:
        print("Connecting to Todoist API...")
        tasks = fetch_todoist_overdue_tasks(token)
        rescues = transform_backlog_to_rescues(tasks)

    for r in rescues:
        print(f"\nTask: {r['task']}")
        print(f"  Friction: {r['detected_friction']}")
        print(f"  Rescue Link: {r['rescue_url']}")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
