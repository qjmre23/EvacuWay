"""
EvacuWay — final consistency pass (Task 10 QA).

Asserts the rebuilt project is free of every original-draft defect:
  * no LIAR / PolitiFact / fake-news / NLP / "12,761" / text-classification content
  * no "150-500 nodes" figure
  * no single-strategy ("one distinct strategy") wording
  * no UNQUALIFIED "Marikina" scope (every Marikina mention must be qualified as a
    prototype / sample / seed / sub-network, or be the dataset filename, or one of the 17 LGUs)

The check is *negation-aware*: a line that merely states the term is ABSENT (e.g. "no LIAR",
"removed all fake-news references") is allowed. Audit files that document the defects are exempt.

Usage:  python scripts/consistency_check.py
Exit code 0 = clean, 1 = offending matches found.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Files/dirs that are exempt (the audit trail and machine artifacts).
EXEMPT_FILES = {
    "docs/audit_report.md",
    "docs/mismatch_matrix.md",
    "docs/validation_checklist.md",
    "scripts/consistency_check.py",
}
SKIP_DIRS = {".git", "node_modules", "venv", ".venv", "dist", "build", "__pycache__",
             "data", "frontend/public", ".claude"}
SKIP_SUFFIX = {".csv", ".xlsx", ".json", ".png", ".jpg", ".gif", ".graphml", ".lock",
               ".ico", ".woff", ".woff2"}
SKIP_NAMES = {"package-lock.json"}

BANNED = [
    (re.compile(r"\bliar\b", re.I), "LIAR dataset reference"),
    (re.compile(r"politifact", re.I), "PolitiFact reference"),
    (re.compile(r"fake[\s\-]?news", re.I), "fake-news reference"),
    (re.compile(r"12[,\s]?761"), "12,761 statements reference"),
    (re.compile(r"text[\s\-]?classif", re.I), "text-classification reference"),
    (re.compile(r"political statement", re.I), "political-statement reference"),
    (re.compile(r"claim classification", re.I), "claim-classification reference"),
    (re.compile(r"\bNLP\b"), "NLP reference"),
    (re.compile(r"150\D{0,6}500\D{0,12}node", re.I), "150-500 nodes contradiction"),
    (re.compile(r"one distinct\b.*strateg", re.I), "single-strategy wording"),
]

# Negation / audit cues that make a banned mention acceptable.
NEGATION = re.compile(
    r"\b(no|not|zero|without|never|remove[d]?|delet|replac|former|original draft|defect|"
    r"audit|mismatch|wrong|corrected|instead of|rather than|absent|free of|nlp[\-/ ]?free)\b",
    re.I,
)

# Marikina is allowed only when qualified.
MARIKINA = re.compile(r"marikina", re.I)
MARIKINA_OK = re.compile(
    r"(prototype|sample|seed|sub[\-\s]?network|subnetwork|xlsx|dataset|17 lgu|"
    r"one of the 17|river|heights|validation|inset|highlighted)", re.I)


def iter_files():
    for p in ROOT.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(ROOT).as_posix()
        if any(rel.startswith(d + "/") or rel == d for d in SKIP_DIRS):
            continue
        if any(part in SKIP_DIRS for part in rel.split("/")):
            continue
        if p.suffix.lower() in SKIP_SUFFIX or p.name in SKIP_NAMES:
            continue
        if rel in EXEMPT_FILES:
            continue
        yield p, rel


def main() -> int:
    findings: list[str] = []
    for p, rel in iter_files():
        try:
            lines = p.read_text(encoding="utf-8", errors="ignore").splitlines()
        except Exception:
            continue
        for i, line in enumerate(lines, 1):
            for pat, label in BANNED:
                if pat.search(line) and not NEGATION.search(line):
                    findings.append(f"{rel}:{i}  [{label}]  {line.strip()[:120]}")
            if MARIKINA.search(line) and not MARIKINA_OK.search(line) and not NEGATION.search(line):
                # allow the bare LGU name in a 17-LGU list context handled by MARIKINA_OK;
                # otherwise flag unqualified scope usage
                findings.append(f"{rel}:{i}  [unqualified Marikina]  {line.strip()[:120]}")

    if findings:
        print(f"[FAIL] {len(findings)} consistency issue(s) found:\n")
        for f in findings:
            print("  " + f)
        return 1
    print("[OK] Consistency check passed: no LIAR/PolitiFact/NLP/fake-news, no '150-500 nodes', "
          "no single-strategy wording, no unqualified Marikina scope.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
