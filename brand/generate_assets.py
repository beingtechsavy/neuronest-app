#!/usr/bin/env python3
"""Asset generation script for NeuroNest brand package."""
import os
import sys

SKILL_SCRIPTS = r"C:\Users\bipla\.claude\plugins\cache\logo-design-skill\logo-design\1.4.5\skills\logo-design\scripts"
sys.path.insert(0, SKILL_SCRIPTS)

import render_png

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND_DIR = os.path.join(PROJECT_ROOT, "brand")

SVG_DIR = os.path.join(BRAND_DIR, "logo", "svg")
PNG_DIR = os.path.join(BRAND_DIR, "logo", "png")
APP_ICON_DIR = os.path.join(BRAND_DIR, "app-icons")
FAVICON_DIR = os.path.join(BRAND_DIR, "favicons")

os.makedirs(PNG_DIR, exist_ok=True)
os.makedirs(APP_ICON_DIR, exist_ok=True)
os.makedirs(FAVICON_DIR, exist_ok=True)

print("Available render backends:", render_png.available_backends())

# 1. Render Symbol PNGs
symbol_svg = os.path.join(SVG_DIR, "neuronest-symbol-color.svg")
for size in [512, 256, 128, 64]:
    out_png = os.path.join(PNG_DIR, f"neuronest-symbol-{size}.png")
    backend = render_png.render(symbol_svg, out_png, size, size)
    print(f"Rendered {out_png} ({size}x{size}) using {backend}")

# 2. Render Horizontal Lockup PNGs
light_lockup_svg = os.path.join(SVG_DIR, "neuronest-logo-horizontal-light.svg")
dark_lockup_svg = os.path.join(SVG_DIR, "neuronest-logo-horizontal-dark.svg")

render_png.render(light_lockup_svg, os.path.join(PNG_DIR, "neuronest-logo-horizontal-light-1200w.png"), 1200, 282)
render_png.render(dark_lockup_svg, os.path.join(PNG_DIR, "neuronest-logo-horizontal-dark-1200w.png"), 1200, 282, bg="#0B0F19")
print("Rendered horizontal lockups.")

# 3. Render App Icons
app_icon_svg = os.path.join(APP_ICON_DIR, "app-icon-ios.svg")
render_png.render(app_icon_svg, os.path.join(APP_ICON_DIR, "app-icon-512x512.png"), 512, 512)
render_png.render(app_icon_svg, os.path.join(APP_ICON_DIR, "app-icon-192x192.png"), 192, 192)
print("Rendered app icons.")

# 4. Render Favicon PNGs
fav_svg = os.path.join(SVG_DIR, "neuronest-symbol-small-16px.svg")
fav_16 = os.path.join(FAVICON_DIR, "favicon-16x16.png")
fav_32 = os.path.join(FAVICON_DIR, "favicon-32x32.png")
fav_48 = os.path.join(FAVICON_DIR, "favicon-48x48.png")
apple_180 = os.path.join(FAVICON_DIR, "apple-touch-icon.png")
android_192 = os.path.join(FAVICON_DIR, "android-chrome-192x192.png")
android_512 = os.path.join(FAVICON_DIR, "android-chrome-512x512.png")

render_png.render(fav_svg, fav_16, 16, 16)
render_png.render(fav_svg, fav_32, 32, 32)
render_png.render(fav_svg, fav_48, 48, 48)

render_png.render(app_icon_svg, apple_180, 180, 180)
render_png.render(app_icon_svg, android_192, 192, 192)
render_png.render(app_icon_svg, android_512, 512, 512)

# 5. Assemble favicon.ico
ico_path = os.path.join(FAVICON_DIR, "favicon.ico")
if os.path.exists(fav_16) and os.path.exists(fav_32) and os.path.exists(fav_48):
    render_png.write_ico([fav_16, fav_32, fav_48], ico_path)
    print("Generated favicon.ico successfully at", ico_path)
else:
    print("Skipping ico assembly, missing base PNGs")

print("Asset generation complete!")
