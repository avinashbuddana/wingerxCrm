#!/usr/bin/env python3
"""Apply WingerX branding to pinned upstream Whatomate before compilation.

This deliberately edits presentation files only. It never touches Go API,
authentication, webhook, multi-tenant, campaign, database or worker code.
"""
from pathlib import Path
import shutil
import sys

root = Path(sys.argv[1]).resolve()
frontend = root / "frontend"

def patch(rel, old, new):
    path = frontend / rel
    content = path.read_text()
    if old not in content:
        raise RuntimeError(f"Upstream changed; branding patch needs review: {rel}: {old[:80]!r}")
    path.write_text(content.replace(old, new))

assets = Path("/tmp/wingerx-assets")
shutil.copyfile(assets / "wingerx.css", frontend / "src/assets/wingerx.css")
shutil.copyfile(assets / "wingerx-mark.svg", frontend / "public/wingerx-mark.svg")
shutil.copyfile(assets / "wingerx-mark.svg", frontend / "public/favicon.svg")

patch("src/main.ts",
      "import './assets/layout.css'",
      "import './assets/layout.css'\nimport './assets/wingerx.css'")

patch("index.html", "<title>Whatomate</title>", "<title>WingerX · WhatsApp CRM</title>")
patch("index.html",
      'content="Whatomate - WhatsApp Business Platform"',
      'content="WingerX WhatsApp CRM - conversations, campaigns and automations by Neurixa Solutions"')
# Prefer light mode the first time. Respect preferences when users switch theme.
patch("index.html",
      "var mode = localStorage.getItem('color-mode');",
      "var mode = localStorage.getItem('color-mode') || 'light';")

patch("src/components/layout/AppLayout.vue",
      '<MessageSquare :size="16" aria-hidden="true" />\n        <strong>Whatomate</strong>',
      '<img src="/wingerx-mark.svg" class="wingerx-brand-icon" alt="" aria-hidden="true" />\n        <strong>WingerX · WhatsApp CRM</strong>')
patch("src/components/layout/AppLayout.vue",
      '    <aside data-sidebar :aria-label="t(\'nav.sidebar\')">',
      '''    <aside data-sidebar :aria-label="t('nav.sidebar')">
      <div class="wingerx-sidebar-brand">
        <img src="/wingerx-mark.svg" class="wingerx-brand-icon" alt="" aria-hidden="true" />
        <div class="wingerx-brand-copy">
          <strong>WingerX</strong>
          <small>WhatsApp CRM</small>
        </div>
      </div>''')
patch("src/views/auth/LoginView.vue",
      '<MessageSquare :size="32" />',
      '''<img src="/wingerx-mark.svg" class="wingerx-auth-mark" alt="" aria-hidden="true" />
            <span class="wingerx-auth-badge">WingerX · Neurixa Solutions</span>''')
patch("src/views/auth/LoginView.vue",
      "<h2>{{ $t('auth.welcomeTitle') }}</h2>",
      "<h2>Welcome to WingerX</h2>")
patch("src/views/auth/LoginView.vue",
      "<p class=\"text-light\">{{ $t('auth.welcomeSubtitle') }}</p>",
      '<p class="text-light">Your WhatsApp command centre for conversations, campaigns, customers and automation.</p>')
print("WingerX presentation patches applied", flush=True)
