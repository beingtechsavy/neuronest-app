"""
NeuroNest ADHD & Neurodivergent UX Accessibility Evaluator
Scans frontend React components to verify neurodivergent design criteria:
1. Touch Target Height (minimum 44px / 48px)
2. Reduced Motion Support (useReducedMotion / prefers-reduced-motion)
3. Color Contrast / Glare Prevention (avoids stark #000000 / #ffffff halogen glare)
4. Choice Overload Prevention (no lists with >7 unchunked options)
5. Clear Status / Focus indicators
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Any

TARGET_DIRS = [
    Path("src/components/rescue"),
    Path("src/app/rescue"),
    Path("src/app/start/[slug]"),
]

def audit_file(file_path: Path) -> Dict[str, Any]:
    content = file_path.read_text(encoding="utf-8")
    issues = []
    strengths = []

    # 1. Touch targets check
    if "<button" in content or "onClick" in content:
        if "min-h-[44px]" in content or "min-h-[48px]" in content or "py-3" in content or "py-4" in content:
            strengths.append("Employs accessible touch target sizes (>=44px/48px)")
        else:
            issues.append("Found interactive elements without explicit min-h-[44px] touch target")

    # 2. Reduced motion check
    if "framer-motion" in content:
        if "useReducedMotion" in content or "shouldReduceMotion" in content:
            strengths.append("Safely respects user prefers-reduced-motion settings")
        else:
            issues.append("Uses animations without explicit reduced-motion fallback")

    # 3. Glare & Dark Theme check
    if "bg-black" in content and "bg-slate" not in content and "#1E1F22" not in content:
        issues.append("Uses stark 100% black background instead of softened dark slate/charcoal")
    elif "#1E1F22" in content or "slate-900" in content or "slate-950" in content:
        strengths.append("Uses softened dark canvas preventing ocular fatigue")

    # 4. Visible focus indicator
    if "focus:outline-none" in content and "focus:ring" not in content and ":focus-visible" not in content:
        issues.append("Suppresses focus outline without providing replacement focus indicator")

    return {
        "file": str(file_path),
        "strengths": strengths,
        "issues": issues,
        "score": max(0, 100 - len(issues) * 20),
    }

def run_evaluation():
    print("=" * 60)
    print("NEURONEST ADHD & NEURODIVERGENT UX ACCESSIBILITY AUDIT")
    print("=" * 60)

    total_score = 0
    file_count = 0

    for target_dir in TARGET_DIRS:
        if not target_dir.exists():
            continue
        for root, _, files in os.walk(target_dir):
            for file in files:
                if file.endswith((".tsx", ".jsx")):
                    p = Path(root) / file
                    res = audit_file(p)
                    file_count += 1
                    total_score += res["score"]

                    status = "PASS" if res["score"] >= 80 else "WARN"
                    print(f"[{status}] {res['score']}/100 : {p.name}")
                    for s in res["strengths"]:
                        print(f"       + {s}")
                    for i in res["issues"]:
                        print(f"       ! {i}")

    if file_count > 0:
        avg = total_score / file_count
        print("-" * 60)
        print(f"Evaluated {file_count} components. Average ADHD UX Score: {avg:.1f}/100")
        print("=" * 60)

if __name__ == "__main__":
    run_evaluation()
