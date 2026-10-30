#!/usr/bin/env python3
"""Convenience: build databases then generate reports."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(script: str) -> None:
    print(f"==> {script}")
    subprocess.check_call([sys.executable, str(ROOT / "scripts" / script)], cwd=ROOT)


def main() -> None:
    run("build_all.py")
    run("validate_databases.py")
    run("generate_reports.py")
    print("Pipeline complete.")


if __name__ == "__main__":
    main()
