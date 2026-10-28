"""
NeuroNest Feedback Synthesis Agent
Analyzes user sentiment from Rescue completion flows, contact forms, and surveys.
Categorizes feedback into:
1. Friction Failure Modes (step too big, ambiguous prompt)
2. High-Converting Breakthroughs (tasks that unlocked immediate momentum)
3. Retention & Feature Requests (reminders, integrations)
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any

SAMPLE_FEEDBACK = [
    {"helpful": True, "comment": "Writing one bad sentence actually worked. I ended up finishing the whole email.", "domain": "communication"},
    {"helpful": True, "comment": "The 2-minute timer made it feel like I wasn't trapped doing dishes for an hour.", "domain": "cleaning"},
    {"helpful": False, "comment": "The step said open chapter 4, but I didn't even have my laptop out yet.", "domain": "study"},
    {"helpful": True, "comment": "I've been avoiding this bug for 3 days. Typing one comment got me into it.", "domain": "coding"},
    {"helpful": False, "comment": "Step was still too overwhelming. I needed something even smaller.", "domain": "writing"},
    {"helpful": True, "comment": "Didn't have to create an account. That's why I actually used it.", "domain": "generic"},
    {"helpful": True, "comment": "Wish this synced directly to my Google Calendar buffer blocks.", "domain": "planning"},
]

def synthesize_feedback(feedback_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(feedback_data)
    if total == 0:
        return {"total": 0, "helpfulness_rate": 0, "insights": []}

    helpful_count = sum(1 for item in feedback_data if item.get("helpful") is True)
    rate = (helpful_count / total) * 100

    failure_modes = []
    breakthroughs = []
    feature_requests = []

    for item in feedback_data:
        comment = item.get("comment", "")
        if not comment:
            continue
        lower = comment.lower()

        if item.get("helpful") is False or any(w in lower for w in ["too big", "overwhelming", "didn't have", "harder"]):
            failure_modes.append({"comment": comment, "domain": item.get("domain", "unknown")})
        elif any(w in lower for w in ["wish", "sync", "calendar", "reminder", "app", "notion"]):
            feature_requests.append({"request": comment, "domain": item.get("domain", "unknown")})
        else:
            breakthroughs.append({"comment": comment, "domain": item.get("domain", "unknown")})

    return {
        "total_analyzed": total,
        "helpful_count": helpful_count,
        "helpfulness_rate_pct": round(rate, 1),
        "breakthroughs": breakthroughs,
        "failure_modes": failure_modes,
        "feature_requests": feature_requests,
    }

def main():
    print("=" * 60)
    print("NEURONEST FEEDBACK SYNTHESIS ENGINE")
    print("=" * 60)

    # Ingest from environment file or sample
    input_path = Path("docs/feedback/raw-feedback.json")
    if input_path.exists():
        data = json.loads(input_path.read_text(encoding="utf-8"))
        print(f"Loaded {len(data)} feedback records from {input_path}")
    else:
        print("Using benchmark validation feedback dataset:")
        data = SAMPLE_FEEDBACK

    summary = synthesize_feedback(data)

    print(f"\nTotal Records: {summary['total_analyzed']}")
    print(f"Rescue Helpfulness Rate: {summary['helpfulness_rate_pct']}%")

    print("\n--- HIGH-CONVERTING BREAKTHROUGHS (WHAT WORKED) ---")
    for b in summary["breakthroughs"]:
        print(f"  + [{b['domain'].upper()}] {b['comment']}")

    print("\n--- INITIATION FAILURE MODES (WHERE STEPS WERE TOO BIG) ---")
    for f in summary["failure_modes"]:
        print(f"  ! [{f['domain'].upper()}] {f['comment']}")

    print("\n--- RETENTION & ROADMAP OPPORTUNITIES ---")
    for req in summary["feature_requests"]:
        print(f"  * [{req['domain'].upper()}] {req['request']}")

    print("\n" + "=" * 60)

    out_path = Path("docs/feedback/feedback-synthesis-summary.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"Exported synthesis report to {out_path}")

if __name__ == "__main__":
    main()
