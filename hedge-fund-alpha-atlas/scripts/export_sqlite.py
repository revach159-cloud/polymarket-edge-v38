#!/usr/bin/env python3
"""Optional SQLite mirror of JSON databases for relational queries."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DBDIR = ROOT / "databases"
OUT = DBDIR / "alpha_atlas.sqlite"


def main() -> None:
    if OUT.exists():
        OUT.unlink()
    conn = sqlite3.connect(OUT)
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE organizations (
          id TEXT PRIMARY KEY,
          name TEXT,
          org_type TEXT,
          discovery_tier TEXT,
          json TEXT
        );
        CREATE TABLE strategies (
          id TEXT PRIMARY KEY,
          name TEXT,
          evidence_level TEXT,
          edge_score REAL,
          quality_score REAL,
          reproducibility_score REAL,
          json TEXT
        );
        CREATE TABLE bots (
          id TEXT PRIMARY KEY,
          name TEXT,
          language TEXT,
          code_inspected INTEGER,
          json TEXT
        );
        CREATE TABLE strategy_org (
          strategy_id TEXT,
          organization_id TEXT
        );
        """
    )

    orgs = json.loads((DBDIR / "01_hedge_fund_database.json").read_text())["organizations"]
    strats = json.loads((DBDIR / "02_strategy_database.json").read_text())["strategies"]
    bots = json.loads((DBDIR / "03_trading_bot_database.json").read_text())["bots"]

    for o in orgs:
        cur.execute(
            "INSERT INTO organizations VALUES (?,?,?,?,?)",
            (o["id"], o["name"], o["org_type"], o.get("discovery_tier"), json.dumps(o)),
        )
    for s in strats:
        cur.execute(
            "INSERT INTO strategies VALUES (?,?,?,?,?,?,?)",
            (
                s["id"],
                s["name"],
                s.get("evidence_level"),
                s.get("edge_score"),
                s.get("quality_score"),
                s.get("reproducibility_score"),
                json.dumps(s),
            ),
        )
        for oid in s.get("organization_ids") or []:
            cur.execute("INSERT INTO strategy_org VALUES (?,?)", (s["id"], oid))
    for b in bots:
        cur.execute(
            "INSERT INTO bots VALUES (?,?,?,?,?)",
            (b["id"], b["name"], b.get("language"), 1 if b.get("code_inspected") else 0, json.dumps(b)),
        )

    conn.commit()
    conn.close()
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
