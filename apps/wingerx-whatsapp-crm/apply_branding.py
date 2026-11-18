#!/usr/bin/env python3
"""Apply WingerX branding to pinned upstream Whatomate before compilation.

This modifies presentation files and the name of the initially seeded organization.
It never edits WhatsApp API, authentication logic, webhooks, campaigns or workers.
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
shutil.copyfile(assets / "client.css", frontend / "src/assets/client.css")
shutil.copyfile(assets / "wingerx-mark.svg", frontend / "public/wingerx-mark.svg")
shutil.copyfile(assets / "wingerx-mark.svg", frontend / "public/favicon.svg")

patch("src/main.ts",
      "import './assets/layout.css'",
      "import './assets/layout.css'\nimport './assets/wingerx.css'\nimport './assets/client.css'")

patch("index.html", "<title>Whatomate</title>", "<title>WingerX · Shree Gajanand Jewellers</title>")
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
          <small>WhatsApp CRM</small>\n          <span class="wingerx-client-chip">SHREE GAJANAND JEWELLERS</span>
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
      '<p class="text-light">Your secure WhatsApp workspace for Shree Gajanand Jewellers, Ranchi. Manage customer chats, campaigns and automation in one place.</p>')
# Seed a fresh, dedicated SGJ organization in an empty database.
# This is a display-name change only; table schema and authentication are untouched.
seed_path = root / "internal/database/postgres.go"
seed_source = seed_path.read_text()
old_org_name = 'Name:      "Default Organization"'
if old_org_name not in seed_source:
    raise RuntimeError("Upstream initial organization seed changed")
seed_path.write_text(seed_source.replace(old_org_name, 'Name:      "Shree Gajanand Jewellers"', 1))

# Client login is invitation/admin-led; user management remains in Settings.
patch("src/views/auth/LoginView.vue",
      '<p class="text-light">Your secure WhatsApp workspace for Shree Gajanand Jewellers, Ranchi. Manage customer chats, campaigns and automation in one place.</p>',
      '<p class="text-light">Your secure WhatsApp workspace for Shree Gajanand Jewellers, Ranchi. Manage customer chats, campaigns and automation in one place.</p>\\n            <a class="wingerx-site-link" href="https://shreegajanandjewellers.com/" target="_blank" rel="noopener noreferrer">Visit Shree Gajanand Jewellers website ↗</a>')

print("WingerX SGJ branding and empty-DB organization seed applied", flush=True)
