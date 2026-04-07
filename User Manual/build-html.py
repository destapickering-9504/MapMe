#!/usr/bin/env python3
"""Merge chapters into one self-contained HTML (images embedded). Print to PDF from your browser."""
from __future__ import annotations

import base64
import re
import sys
from pathlib import Path

try:
    import markdown
except ImportError as e:
    print("Run: pip3 install --user markdown", file=sys.stderr)
    raise SystemExit(1) from e

DIR = Path(__file__).resolve().parent
CHAPTERS = [
    "01-sign-up-sign-in.md",
    "02-planner.md",
    "03-history.md",
    "04-profile.md",
    "05-user-vs-non-user.md",
]

MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp"}

# Same styling intent as pdf-print.css
CSS = """
@page { size: Letter; margin: 14mm 16mm; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 11pt; line-height: 1.45; color: #1a1a1a;
  max-width: 48rem; margin: 0 auto; padding: 1rem;
}
h1 { font-size: 18pt; margin: 0 0 0.5em; page-break-before: always;
     border-bottom: 1px solid #ddd; padding-bottom: 0.2em; }
h1:first-of-type { page-break-before: avoid; }
h2 { font-size: 13pt; margin: 1em 0 0.35em; }
h3 { font-size: 11.5pt; margin: 0.85em 0 0.3em; }
p, li { margin: 0.3em 0; }
ul, ol { margin: 0.45em 0; padding-left: 1.35em; }
table { border-collapse: collapse; width: 100%; margin: 0.65em 0; font-size: 10pt; }
th, td { border: 1px solid #ccc; padding: 0.3em 0.45em; text-align: left; }
th { background: #f5f5f5; }
code { font-size: 0.92em; background: #f4f4f4; padding: 0.08em 0.3em; border-radius: 3px; }
a { color: #0b57d0; }
img { max-width: 100%; height: auto; display: block; margin: 0.65em auto; page-break-inside: avoid; }
"""


def embed_images(md: str) -> str:
    """Replace ![](images/foo.png) with data URIs so the HTML is portable."""

    root = DIR.resolve()

    def repl(m: re.Match[str]) -> str:
        alt, rel = m.group(1), m.group(2).strip()
        if rel.startswith("data:"):
            return m.group(0)
        path = (DIR / rel).resolve()
        try:
            path.relative_to(root)
        except ValueError:
            return m.group(0)
        if not path.is_file():
            return m.group(0)
        mime = MIME.get(path.suffix.lower(), "application/octet-stream")
        b64 = base64.standard_b64encode(path.read_bytes()).decode("ascii")
        return f"![{alt}](data:{mime};base64,{b64})"

    return re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", repl, md)


def main() -> None:
    parts = [
        "# MapMe User Manual\n",
        "\nCombined guide: sign-in, Planner, History, Profile, and guest vs signed-in use.\n",
    ]
    for name in CHAPTERS:
        p = DIR / name
        if not p.is_file():
            raise SystemExit(f"Missing chapter: {p}")
        parts.append(p.read_text(encoding="utf-8"))
        parts.append("\n")

    md = "\n".join(parts)
    md = embed_images(md)
    body = markdown.markdown(md, extensions=["extra", "nl2br", "tables"])
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>MapMe User Manual</title>
  <style>{CSS}</style>
</head>
<body>
{body}
</body>
</html>
"""
    out = DIR / "MapMe-User-Manual.html"
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out}")
    print("Create a PDF: open the HTML in Chrome/Safari → Print → Save as PDF.")


if __name__ == "__main__":
    main()
