/**
 * Rebuild public/prediction-history.json using the REAL heuristic model
 * (enrich + quality gate + recordOpen / resolveClosed). No simulated grades.
 *
 * Usage: npx tsx scripts/sync-prediction-history.ts
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  fetchActivePredictionUniverse,
  fetchGammaMarketsPaged,
} from "@/lib/polymarket/api";
import { enrichMarkets } from "@/lib/predictions/enrich";
import { selectDailyPredictions } from "@/lib/markets/quality-gate";
import {
  HISTORY_STORE_VERSION,
  getHistoryStoreSnapshot,
  importHistoryPredictions,
  resetPredictionHistory,
  syncPredictionHistory,
  type HistoryPrediction,
} from "@/lib/history/prediction-store";

const outFile = path.join(process.cwd(), "public", "prediction-history.json");
const workDir = path.join(process.cwd(), ".data-sync");

function loadPreviousReal(): HistoryPrediction[] {
  try {
    if (!existsSync(outFile)) return [];
    const parsed = JSON.parse(readFileSync(outFile, "utf8")) as {
      version?: number;
      predictions?: HistoryPrediction[];
    };
    // Drop pre-v5 simulated / price-follow history.
    if (parsed.version !== HISTORY_STORE_VERSION) return [];
    if (!Array.isArray(parsed.predictions)) return [];
    return parsed.predictions;
  } catch {
    return [];
  }
}

async function main() {
  process.env.PREDICTION_HISTORY_DIR = workDir;
  resetPredictionHistory();

  const previous = loadPreviousReal();
  if (previous.length) {
    importHistoryPredictions(previous);
  }

  const [universe, closedPage] = await Promise.all([
    fetchActivePredictionUniverse(),
    fetchGammaMarketsPaged({
      closed: true,
      order: "updatedAt",
      ascending: false,
      pageSize: 100,
      maxPages: 5,
    }),
  ]);

  const now = new Date();
  const activeEnriched = enrichMarkets(
    universe.markets.filter((m) => m.active && !m.closed),
    now,
  );
  const closedEnriched = enrichMarkets(
    closedPage.markets.filter((m) => m.closed || m.resolved),
    now,
  );
  // Same champion set the site shows — real model picks only.
  const daily = selectDailyPredictions(activeEnriched, now);

  syncPredictionHistory(daily, closedEnriched);

  const snap = getHistoryStoreSnapshot();
  const payload = {
    version: HISTORY_STORE_VERSION,
    updatedAt: snap.updatedAt,
    predictions: snap.predictions,
  };

  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const open = snap.predictions.filter((p) => p.status === "open").length;
  const resolved = snap.predictions.filter(
    (p) => p.status === "resolved" && p.correct != null,
  ).length;
  const correct = snap.predictions.filter((p) => p.correct === true).length;
  console.log(
    JSON.stringify(
      {
        ok: true,
        model: "heuristic-v1",
        outFile,
        dailyChampions: daily.length,
        open,
        resolved,
        correct,
        winRate:
          resolved > 0 ? `${Math.round((correct / resolved) * 100)}%` : null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
