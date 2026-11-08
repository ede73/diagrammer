#!/usr/bin/env python3
import os

ICONS_DIR = "web/icons"
os.makedirs(ICONS_DIR, exist_ok=True)

icons = {
    "actor1.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <circle cx="32" cy="24" r="10" fill="#38bdf8"/>
  <path d="M16 48c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
</svg>''',

    "actor2.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <circle cx="32" cy="23" r="9" fill="#818cf8"/>
  <path d="M18 47c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#818cf8" stroke-width="3" stroke-linecap="round"/>
  <path d="M22 22a10 10 0 0 1 20 0v5a2 2 0 0 1-2 2h-1" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="21" cy="24" r="2.5" fill="#38bdf8"/>
  <circle cx="43" cy="24" r="2.5" fill="#38bdf8"/>
</svg>''',

    "actor3.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <circle cx="24" cy="22" r="7" fill="#64748b"/>
  <path d="M12 44c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#64748b" stroke-width="2"/>
  <circle cx="40" cy="25" r="8" fill="#38bdf8"/>
  <path d="M26 47c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
</svg>''',

    "barcode.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <path d="M16 18v28M22 18v28M26 18v28M32 18v28M38 18v28M42 18v28M48 18v28" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M12 32h40" stroke="#ef4444" stroke-width="2" stroke-dasharray="3 2"/>
</svg>''',

    "camera.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <path d="M22 20l2-4h16l2 4h6a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4h6z" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="32" cy="34" r="7" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="44" cy="26" r="2" fill="#38bdf8"/>
</svg>''',

    "harddisk.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="16" y="14" width="32" height="36" rx="4" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="32" cy="30" r="8" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="32" cy="30" r="2" fill="#38bdf8"/>
  <circle cx="23" cy="43" r="2" fill="#10b981"/>
</svg>''',

    "laser.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <path d="M18 20h20l6 8v16l-10-2-4 10-6-2 4-12-10-2v-16z" stroke="#38bdf8" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M44 26l8-4M44 28l10 1M44 30l8 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
</svg>''',

    "phone.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="20" y="12" width="24" height="40" rx="4" stroke="#38bdf8" stroke-width="3"/>
  <line x1="28" y1="16" x2="36" y2="16" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
  <circle cx="32" cy="46" r="2" fill="#38bdf8"/>
</svg>''',

    "satellite.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="27" y="27" width="10" height="10" rx="1" fill="#38bdf8"/>
  <path d="M14 24h10v16H14zM40 24h10v16H40z" stroke="#38bdf8" stroke-width="2"/>
  <line x1="24" y1="32" x2="27" y2="32" stroke="#38bdf8" stroke-width="2"/>
  <line x1="37" y1="32" x2="40" y2="32" stroke="#38bdf8" stroke-width="2"/>
  <path d="M32 27V18M28 18h8" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
</svg>''',

    "usbmemory.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="24" y="24" width="16" height="26" rx="3" stroke="#38bdf8" stroke-width="3"/>
  <rect x="26" y="14" width="12" height="10" stroke="#94a3b8" stroke-width="2"/>
  <circle cx="29" cy="18" r="1" fill="#94a3b8"/>
  <circle cx="35" cy="18" r="1" fill="#94a3b8"/>
</svg>''',

    "basestation.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <path d="M22 50l8-32 8 32M24 42h16M27 30h10" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="30" cy="16" r="3" fill="#ef4444"/>
  <path d="M20 18a12 12 0 0 1 20 0M16 14a18 18 0 0 1 28 0" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
</svg>''',

    "cpu.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="20" y="20" width="24" height="24" rx="3" stroke="#38bdf8" stroke-width="3" fill="#0f172a"/>
  <rect x="26" y="26" width="12" height="12" rx="1" fill="#38bdf8"/>
  <path d="M26 14v6M32 14v6M38 14v6M26 44v6M32 44v6M38 44v6M14 26h6M14 32h6M14 38h6M44 26h6M44 32h6M44 38h6" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
</svg>''',

    "modem.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="14" y="32" width="36" height="16" rx="3" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="22" cy="40" r="2" fill="#10b981"/>
  <circle cx="28" cy="40" r="2" fill="#10b981"/>
  <circle cx="34" cy="40" r="2" fill="#38bdf8"/>
  <line x1="22" y1="32" x2="22" y2="16" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="42" y1="32" x2="42" y2="16" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
</svg>''',

    "keyboard.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="14" y="20" width="36" height="24" rx="4" stroke="#38bdf8" stroke-width="3"/>
  <path d="M19 26h4M27 26h4M35 26h4M43 26h2M19 32h4M27 32h4M35 32h4M43 32h2M24 38h16" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
</svg>''',

    "monitor.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="14" y="16" width="36" height="26" rx="3" stroke="#38bdf8" stroke-width="3"/>
  <path d="M26 48h12M32 42v6" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
</svg>''',

    "printer.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="14" y="24" width="36" height="20" rx="3" stroke="#38bdf8" stroke-width="3"/>
  <path d="M22 24v-8h20v8M20 38h24v10H20z" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="42" cy="29" r="1.5" fill="#10b981"/>
</svg>''',

    "scanner.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="14" y="30" width="36" height="18" rx="2" stroke="#38bdf8" stroke-width="3"/>
  <line x1="14" y1="30" x2="40" y2="18" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
  <line x1="20" y1="36" x2="44" y2="36" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3 2"/>
</svg>''',

    "wifi.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <circle cx="32" cy="46" r="3" fill="#38bdf8"/>
  <path d="M22 38a14 14 0 0 1 20 0M16 31a22 22 0 0 1 32 0M10 24a30 30 0 0 1 44 0" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
</svg>''',

    "battery.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="18" y="20" width="28" height="24" rx="3" stroke="#38bdf8" stroke-width="3"/>
  <path d="M46 28v8" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
  <rect x="23" y="25" width="6" height="14" rx="1" fill="#10b981"/>
  <rect x="31" y="25" width="6" height="14" rx="1" fill="#10b981"/>
</svg>''',

    "documents.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <path d="M18 20v28h22V20H18z" stroke="#64748b" stroke-width="2"/>
  <path d="M24 16v28h22V24l-8-8H24z" stroke="#38bdf8" stroke-width="2.5" fill="#1e293b"/>
  <path d="M28 26h12M28 32h12M28 38h8" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
</svg>''',

    "laptop.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="18" y="18" width="28" height="20" rx="2" stroke="#38bdf8" stroke-width="3"/>
  <path d="M12 42h40l-2 4H14l-2-4z" stroke="#38bdf8" stroke-width="2.5" fill="#38bdf8"/>
</svg>''',

    "mouse.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="22" y="16" width="20" height="32" rx="10" stroke="#38bdf8" stroke-width="3"/>
  <line x1="32" y1="16" x2="32" y2="28" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="32" cy="24" r="2" fill="#38bdf8"/>
</svg>''',

    "ram.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <path d="M14 26h36v14H14z" stroke="#10b981" stroke-width="2.5"/>
  <rect x="18" y="29" width="6" height="8" rx="1" fill="#38bdf8"/>
  <rect x="26" y="29" width="6" height="8" rx="1" fill="#38bdf8"/>
  <rect x="34" y="29" width="6" height="8" rx="1" fill="#38bdf8"/>
  <path d="M16 40v3M20 40v3M24 40v3M28 40v3M36 40v3M40 40v3M44 40v3" stroke="#f59e0b" stroke-width="2"/>
</svg>''',

    "sim.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <path d="M22 16h14l8 8v24H22V16z" stroke="#ef4444" stroke-width="3" fill="#1e293b"/>
  <rect x="27" y="28" width="12" height="14" rx="1" stroke="#f59e0b" stroke-width="1.5" fill="#f59e0b" fill-opacity="0.3"/>
  <line x1="33" y1="28" x2="33" y2="42" stroke="#f59e0b" stroke-width="1.5"/>
  <line x1="27" y1="35" x2="39" y2="35" stroke="#f59e0b" stroke-width="1.5"/>
</svg>''',

    "timer.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <circle cx="32" cy="34" r="16" stroke="#f59e0b" stroke-width="3"/>
  <path d="M32 18v-4M28 14h8" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M32 34l6-6M32 34v-8" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
</svg>''',

    "rack.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="14" fill="#1e293b"/>
  <rect x="20" y="14" width="24" height="36" rx="2" stroke="#38bdf8" stroke-width="3"/>
  <path d="M20 22h24M20 30h24M20 38h24" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="24" cy="18" r="1.5" fill="#10b981"/>
  <circle cx="24" cy="26" r="1.5" fill="#10b981"/>
  <circle cx="24" cy="34" r="1.5" fill="#10b981"/>
  <circle cx="24" cy="42" r="1.5" fill="#10b981"/>
</svg>'''
}

for filename, content in icons.items():
    filepath = os.path.join(ICONS_DIR, filename)
    with open(filepath, "w") as f:
        f.write(content)

print(f"Generated {len(icons)} modern vector SVG icons.")
