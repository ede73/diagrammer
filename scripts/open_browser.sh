#!/bin/bash
# Opens Diagrammer Web UI directly inside Antigravity IDE's internal Simple Browser

PORT="${1:-8000}"
URL="http://localhost:${PORT}/index.html"

osascript <<EOF
tell application "Antigravity IDE" to activate
tell application "System Events"
    keystroke "p" using {command down, shift down}
    delay 0.4
    keystroke "Simple Browser: Show"
    delay 0.4
    key code 36
    delay 0.4
    keystroke "${URL}"
    delay 0.3
    key code 36
end tell
EOF
