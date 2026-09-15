#!/usr/bin/env python3
"""Refresh each site's service worker precache list and cache version.

The site has no build step on purpose — it is static files Netlify serves as
they are. The one thing that can't be written by hand is the list of assets to
precache for offline play, so this script rewrites those two lines in sw.js in
place:

    const VERSION = "...";
    const ASSETS = [...];

VERSION is a hash of the contents of every precached file, so it changes
exactly when something a device already cached has changed — which is what
makes browsers install the new worker and drop the old cache.

Run after touching index.html or anything under img/, fonts/ or icons/:

    python3 tools/build-sw.py            # every site in the repo
    python3 tools/build-sw.py spellbound # just one
"""
import hashlib
import json
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
# Each site is a directory with its own index.html and sw.js. "." is
# Charlotte's Spelling Stickers at the repo root; each other entry is a
# self-contained game that can be deployed on its own.
SITES = [".", "spellbound"]
# Files a game needs to run with no network at all.
INCLUDE_DIRS = ["img", "fonts", "icons"]
INCLUDE_FILES = ["index.html", "manifest.webmanifest", "favicon.ico"]


def collect(root):
    paths = []
    for name in INCLUDE_FILES:
        p = root / name
        if p.exists():
            paths.append(p)
    for d in INCLUDE_DIRS:
        for p in sorted((root / d).rglob("*")):
            if p.is_file() and not p.name.startswith("."):
                paths.append(p)
    return paths


def build(site):
    ROOT = (REPO / site).resolve()
    paths = collect(ROOT)
    if not paths:
        sys.exit(f"{site}: no assets found")

    digest = hashlib.sha256()
    for p in sorted(paths):
        digest.update(p.relative_to(ROOT).as_posix().encode())
        digest.update(p.read_bytes())
    version = digest.hexdigest()[:12]

    # "./" is the start_url; index.html is also listed so a direct hit caches.
    urls = ["./"] + [p.relative_to(ROOT).as_posix() for p in paths]

    sw = ROOT / "sw.js"
    if not sw.exists():
        sys.exit(f"{site}: no sw.js")
    src = sw.read_text(encoding="utf-8")
    src, n1 = re.subn(r'const VERSION = "[^"]*";',
                      f'const VERSION = "{version}";', src, count=1)
    assets = json.dumps(urls, indent=2).replace("\n", "\n")
    src, n2 = re.subn(r"const ASSETS = .*?;",
                      f"const ASSETS = {assets};", src, count=1, flags=re.S)
    if not (n1 and n2):
        sys.exit(f"{site}: sw.js is missing the VERSION or ASSETS line")
    sw.write_text(src, encoding="utf-8")

    total = sum(p.stat().st_size for p in paths)
    label = "(root)" if site == "." else site
    print(f"{label:<12} version {version}  "
          f"{len(urls):>3} entries  {total/1024:>5.0f} KiB precached")


def main():
    sites = sys.argv[1:] or SITES
    for site in sites:
        build(site)


if __name__ == "__main__":
    main()
