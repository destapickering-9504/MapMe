#!/usr/bin/env python3
"""Merge User Manual chapters to a single PDF (WeasyPrint + Markdown)."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import markdown
    from weasyprint import CSS, HTML
except ImportError as e:
    print("Missing dependency. Run: pip3 install --user markdown weasyprint", file=sys.stderr)
    raise SystemExit(1) from e

DIR = Path(__file__).resolve().parent
CHAPTERS = [
    "01-sign-up-sign-in.md",
    "02-planner.md",
    "03-history.md",
    "04-profile.md",
    "05-user-vs-non-user.md",
]

CSS_TEXT = """
@page { size: Letter; margin: 14mm 16mm; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 11pt; line-height: 1.45; color: #1a1a1a;
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
    html_body = markdown.markdown(
        md,
        extensions=["tables", "fenced_code", "nl2br", "sane_lists"],
    )
    html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>MapMe User Manual</title>
</head>
<body>
{html_body}
</body>
</html>"""

    out_pdf = DIR / "MapMe-User-Manual.pdf"
    HTML(string=html_doc, base_url=str(DIR) + "/").write_pdf(
        out_pdf,
        stylesheets=[CSS(string=CSS_TEXT)],
    )
    print(f"Wrote {out_pdf}")


if __name__ == "__main__":
    main()
