# Architecture — Hedge Fund Alpha Research Engine

## Design Principles

1. **Standalone** — zero dependency on any trading product or prior app codebase
2. **Evidence-first** — every numeric field carries a confidence / provenance label
3. **Append-only research notes** — sources are first-class entities
4. **Multi-ranking** — never optimize for a single metric
5. **Reproducibility-aware** — distinguish “interesting” from “implementable”

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│  REPORT LAYER                                           │
│  Alpha Atlas · Strategy Cards · Deep Research Memos     │
└──────────────────────────▲──────────────────────────────┘
┌──────────────────────────┴──────────────────────────────┐
│  ANALYSIS LAYER                                         │
│  Rankings A–J · Edge Score · Quality · Reproducibility  │
│  Regime Dependency · Failure Detection · Combinations   │
└──────────────────────────▲──────────────────────────────┘
┌──────────────────────────┴──────────────────────────────┐
│  RESEARCH DATABASE LAYER                                │
│  Funds · Strategies · Bots · Performance · Sources      │
│  Signals · Markets · Risk Models · Papers               │
└──────────────────────────▲──────────────────────────────┘
┌──────────────────────────┴──────────────────────────────┐
│  DISCOVERY LAYER                                        │
│  Seed catalogs · Recursive reference expansion          │
│  Public filings / papers / GitHub / interviews          │
└─────────────────────────────────────────────────────────┘
```

## Discovery Pipeline (Phases 1–3)

1. **Seed universe** from curated famous + systematic firm lists
2. **Expand recursively** when a source cites another fund / paper / bot / trader
3. **Capture performance** only from public verifiable channels; else `UNKNOWN`
4. **Normalize** into schema with provenance on every claim

## Analysis Pipeline (Phases 4–18)

1. Compute multi-metric rankings (A–J)
2. Build Top 100 by composite research-interest score
3. Deep-dive Top 50 (regime, crowding, costs, bias checks)
4. Reconstruct strategy maps with traffic-light evidence
5. Score edge / quality / reproducibility
6. Flag weak-evidence strategies
7. Mine cross-strategy patterns
8. Propose 30 research hypotheses (not claimed fund strategies)

## Data Flow

```
Public Source
  → Source Record
  → Entity (Fund / Bot / Strategy / Paper)
  → Claim (field + value + evidence_level + source_ids)
  → Score / Rank
  → Report
```

## Technology Choices

| Component | Choice | Why |
|-----------|--------|-----|
| Language | Python 3.11+ | Research tooling, JSON pipelines |
| Storage | JSON + optional SQLite | Portable, reviewable, git-friendly |
| Schema | JSON Schema draft-07 | Validation without heavy ORM |
| Scoring | Pure functions in `src/scoring` | Auditable, no black-box ML ranking |
| Reports | Markdown | Human-readable research output |

## Non-Goals

- Live trading / order routing
- Accessing private fund data rooms
- Scraping behind logins without public APIs
- Claiming reconstructed code matches a fund’s private stack

## Extensibility

New discovery sources plug in as modules under `src/discovery/`.
New scoring dimensions register in `src/scoring/registry.py`.
Exports remain stable under `databases/01`–`08`.
