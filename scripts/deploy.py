#!/usr/bin/env python3
"""Deploy dist/ to Firebase Hosting using the active gcloud account.

Uses the Firebase Hosting REST API with a short-lived token from
`gcloud auth print-access-token`, so no Firebase CLI login is stored.
Headers are read from firebase.json.

Usage: python3 scripts/deploy.py PROJECT_ID [SITE_ID]
"""
import gzip
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

API = "https://firebasehosting.googleapis.com/v1beta1"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def token():
    return subprocess.check_output(["gcloud", "auth", "print-access-token"], text=True).strip()


def call(method, url, project, body=None, data=None, content_type="application/json"):
    payload = data if data is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(url, data=payload, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("x-goog-user-project", project)
    if payload is not None:
        req.add_header("Content-Type", content_type)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        sys.exit(f"{method} {url} failed: {err.code} {err.read().decode()[:500]}")


def hosting_config():
    with open(os.path.join(ROOT, "firebase.json")) as f:
        hosting = json.load(f)["hosting"]
    headers = [
        {"glob": h["source"], "headers": {x["key"]: x["value"] for x in h["headers"]}}
        for h in hosting.get("headers", [])
    ]
    return hosting["public"], {"headers": headers}


def gzipped_files(public):
    files = {}
    base = os.path.join(ROOT, public)
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        for name in filenames:
            if name.startswith("."):
                continue
            path = os.path.join(dirpath, name)
            with open(path, "rb") as f:
                gz = gzip.compress(f.read(), mtime=0)
            rel = "/" + os.path.relpath(path, base).replace(os.sep, "/")
            files[rel] = (hashlib.sha256(gz).hexdigest(), gz)
    return files


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    project = sys.argv[1]
    site = sys.argv[2] if len(sys.argv) > 2 else project
    public, config = hosting_config()
    files = gzipped_files(public)
    print(f"{len(files)} files from {public}/ -> site {site}")

    version = call("POST", f"{API}/sites/{site}/versions", project, {"config": config})["name"]
    populated = call(
        "POST", f"{API}/{version}:populateFiles", project,
        {"files": {path: h for path, (h, _) in files.items()}},
    )
    needed = set(populated.get("uploadRequiredHashes", []))
    by_hash = {h: gz for h, gz in files.values()}
    for h in needed:
        call("POST", f"{populated['uploadUrl']}/{h}", project,
             data=by_hash[h], content_type="application/octet-stream")
    print(f"uploaded {len(needed)} new files ({len(files) - len(needed)} unchanged)")

    call("PATCH", f"{API}/{version}?update_mask=status", project, {"status": "FINALIZED"})
    call("POST", f"{API}/sites/{site}/releases?versionName={version}", project, {})
    print(f"released {version}\nlive at https://{site}.web.app")


if __name__ == "__main__":
    TOKEN = token()
    main()
