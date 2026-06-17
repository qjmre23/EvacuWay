"""
Netlify Function — wraps the EvacuWay FastAPI app via Mangum.

Netlify Functions use the AWS Lambda runtime under the hood, so Mangum
(the ASGI-to-Lambda adapter) bridges them cleanly.

Path layout assumed at build time (Netlify clones the full repo):
  <repo-root>/
    backend/          ← FastAPI app lives here
    web/
      netlify/
        functions/
          api.py      ← this file
"""
from __future__ import annotations

import os
import sys

# Make the repo root importable so `from backend.main import app` works.
_HERE = os.path.dirname(__file__)
_REPO_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from mangum import Mangum  # noqa: E402 — must come after sys.path fix
from backend.main import app  # noqa: E402

# lifespan="off" silences the startup/shutdown lifecycle warnings that
# appear when running under Lambda (no persistent process).
handler = Mangum(app, lifespan="off")
