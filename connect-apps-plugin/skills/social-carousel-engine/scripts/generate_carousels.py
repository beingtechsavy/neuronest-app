"""
NeuroNest Social Carousel & Card Generator
Generates production-ready 1080x1080 social carousel slides from the marketing playbook.
Adheres strictly to the Haven N brand system and Discord-familiar dark color tokens.
"""

import os
from pathlib import Path

OUTPUT_DIR = Path("public/social")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Haven N Mark embedded as clean SVG geometry
HAVEN_MARK = """
<g transform="translate({x}, {y}) scale({scale})">
  <rect x="44" y="36" width="44" height="184" rx="12" fill="#F8FAFC" />
  <rect x="168" y="36" width="44" height="184" rx="12" fill="#F8FAFC" />
  <path d="M 88 56 C 108 64, 128 92, 142 128 C 156 164, 164 190, 168 204 L 168 174 C 156 142, 142 112, 126 84 C 114 62, 102 48, 88 40 Z" fill="#14B8A6" />
  <circle cx="128" cy="116" r="18" fill="#2DD4BF" />
</g>
"""

def create_slide_svg(
    badge: str,
    headline: str,
    body: str,
    subtext: str = "",
    highlight_box: str = "",
    slide_num: str = "1/3",
    out_path: Path = None,
):
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap');
      .title {{ font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-weight: 800; fill: #F2F3F5; }}
      .body {{ font-family: 'Inter', system-ui, sans-serif; font-weight: 400; fill: #DBDEE1; }}
      .badge {{ font-family: 'Inter', system-ui, sans-serif; font-weight: 600; fill: #2DD4BF; }}
      .sub {{ font-family: 'Inter', system-ui, sans-serif; font-weight: 500; fill: #949BA4; }}
      .card-text {{ font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-weight: 700; fill: #F2F3F5; }}
    </style>
  </defs>

  <!-- Background: Discord Dark #1E1F22 -->
  <rect width="1080" height="1080" fill="#1E1F22" />

  <!-- Subtle ambient glow in Haven Teal -->
  <circle cx="920" cy="160" r="280" fill="#0D9488" opacity="0.12" filter="blur(60px)" />
  <circle cx="160" cy="920" r="240" fill="#14B8A6" opacity="0.08" filter="blur(50px)" />

  <!-- Outer border -->
  <rect x="32" y="32" width="1016" height="1016" rx="32" fill="none" stroke="#383A40" stroke-width="2" />

  <!-- Header: Haven Mark & Brand -->
  {HAVEN_MARK.format(x=72, y=72, scale=0.32)}
  <text x="168" y="112" class="title" font-size="34" letter-spacing="-0.5">NeuroNest</text>
  <text x="168" y="138" class="badge" font-size="16" letter-spacing="1">TASK INITIATION HAVEN</text>

  <!-- Slide indicator -->
  <rect x="912" y="80" width="84" height="38" rx="19" fill="#2B2D31" stroke="#383A40" stroke-width="1.5" />
  <text x="954" y="105" text-anchor="middle" class="sub" font-size="16">{slide_num}</text>

  <!-- Category badge -->
  <rect x="80" y="240" width="auto" height="36" rx="18" fill="#2B2D31" stroke="#14B8A6" stroke-width="1.5" />
  <text x="100" y="264" class="badge" font-size="16" letter-spacing="0.5">{badge.upper()}</text>

  <!-- Headline -->
  <text x="80" y="360" class="title" font-size="52" letter-spacing="-1">
    {headline}
  </text>

  <!-- Highlight card if present -->
  {f'''
  <rect x="80" y="440" width="920" height="240" rx="24" fill="#2B2D31" stroke="#383A40" stroke-width="2" />
  <rect x="80" y="440" width="12" height="240" rx="6" fill="#0D9488" />
  <text x="130" y="520" class="card-text" font-size="36" letter-spacing="-0.5">
    {highlight_box}
  </text>
  ''' if highlight_box else ''}

  <!-- Body copy -->
  <text x="80" y="{740 if highlight_box else 500}" class="body" font-size="30" letter-spacing="-0.2">
    {body}
  </text>

  <!-- Subtext -->
  <text x="80" y="{820 if highlight_box else 620}" class="sub" font-size="24">
    {subtext}
  </text>

  <!-- Footer -->
  <line x1="80" y1="920" x2="1000" y2="920" stroke="#383A40" stroke-width="1.5" />
  <text x="80" y="965" class="sub" font-size="20">neuronest.work/rescue</text>
  <text x="1000" y="965" text-anchor="end" class="badge" font-size="20">Zero signup • One small next action</text>
</svg>
"""
    if out_path:
        out_path.write_text(svg.strip(), encoding="utf-8")
    return svg

def main():
    print("Generating NeuroNest Social Carousels...")

    # Post 1: Positioning
    create_slide_svg(
        badge="Executive Dysfunction",
        headline="Knowing what to do and being\nable to start are different problems.",
        body="&quot;Write the report&quot; is a project.<br/>&quot;Open the document and type the title&quot; is an action.",
        highlight_box="The problem is not planning.<br/>The problem is initiation inertia.",
        subtext="Traditional planners assume you already have the executive function to begin.",
        slide_num="1/3",
        out_path=OUTPUT_DIR / "post1-slide1.svg"
    )

    create_slide_svg(
        badge="The ADHD Wedge",
        headline="Traditional productivity tools\ntrigger cognitive shutdown.",
        body="When you are stuck, being asked to tag, categorize,<br/>and organize tasks is just more procrastination.",
        highlight_box="NeuroNest Rescue asks one question:<br/>&quot;What are you trying to start?&quot;",
        subtext="No folders. No 40-item overdue lists. Just one calm step.",
        slide_num="2/3",
        out_path=OUTPUT_DIR / "post1-slide2.svg"
    )

    create_slide_svg(
        badge="Action First",
        headline="Make the first action smaller\nthan your neurological resistance.",
        body="Once physical motion starts, dopamine follows.<br/>Motion creates motivation, never the reverse.",
        highlight_box="One small next action. Then begin.",
        subtext="Try it free right now with zero account creation at neuronest.work/rescue",
        slide_num="3/3",
        out_path=OUTPUT_DIR / "post1-slide3.svg"
    )

    # Post 2: Email Paralysis Demo
    create_slide_svg(
        badge="Real Resisted Task",
        headline="Stuck on a difficult email\nyou have avoided for 4 days?",
        body="Friction: &quot;I am anxious about saying the wrong thing.&quot;",
        highlight_box="NeuroNest Rescue Action:<br/>&quot;Open the draft and write one deliberately<br/>terrible sentence you won't send yet.&quot;",
        subtext="Estimated time: 90 seconds. Perfectionism barrier bypassed.",
        slide_num="1/1",
        out_path=OUTPUT_DIR / "post2-email-rescue.svg"
    )

    print(f"Generated social cards in {OUTPUT_DIR.resolve()}")

if __name__ == "__main__":
    main()
