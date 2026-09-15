#!/usr/bin/env python3
"""Refresh the service worker's precache list and cache version.

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

    python3 tools/build-sw.py
"""
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Files the game needs to run with no network at all.
INCLUDE_DIRS = ["img", "fonts", "icons"]
INCLUDE_FILES = ["index.html", "manifest.webmanifest", "favicon.ico"]


def collect():
    paths = []
    for name in INCLUDE_FILES:
        p = ROOT / name
        if p.exists():
            paths.append(p)
    for d in INCLUDE_DIRS:
        for p in sorted((ROOT / d).rglob("*")):
            if p.is_file() and not p.name.startswith("."):
                paths.append(p)
    return paths


def main():
    paths = collect()
    if not paths:
        sys.exit("no assets found - run this from inside the repo")

    digest = hashlib.sha256()
    for p in sorted(paths):
        digest.update(p.relative_to(ROOT).as_posix().encode())
        digest.update(p.read_bytes())
    version = digest.hexdigest()[:12]

    # "./" is the start_url; index.html is also listed so a direct hit caches.
    urls = ["./"] + [p.relative_to(ROOT).as_posix() for p in paths]

    sw = ROOT / "sw.js"
    src = sw.read_text(encoding="utf-8")
    src, n1 = re.subn(r'const VERSION = "[^"]*";',
                      f'const VERSION = "{version}";', src, count=1)
    assets = json.dumps(urls, indent=2).replace("\n", "\n")
    src, n2 = re.subn(r"const ASSETS = .*?;",
                      f"const ASSETS = {assets};", src, count=1, flags=re.S)
    if not (n1 and n2):
        sys.exit("sw.js is missing the VERSION or ASSETS line - not rewriting")
    sw.write_text(src, encoding="utf-8")

    total = sum(p.stat().st_size for p in paths)
    print(f"sw.js updated: version {version}, "
          f"{len(urls)} entries, {total/1024:.0f} KiB precached")


if __name__ == "__main__":
    main()
