import { withJobLock } from "./_lock";
import { getMarkets } from "@/services/markets";
import { persistChampionPredictions } from "@/server/services/persist-predictions";
import { HEURISTIC_V1 } from "@/lib/predictions/config";

/**
 * Scan active quality picks and persist them for later resolution / win-rate.
 */
export async function runModelJob() {
  return withJobLock("run-model", async () => {
    const [active, closed] = await Promise.all([
      getMarkets({ status: "active", sort: "smart" }),
      getMarkets({ status: "closed", sort: "endDate", qualityOnly: false }),
    ]);

    const persist = await persistChampionPredictions(
      active.data,
      closed.data,
    );

    return {
      processed: persist.upsertedDb || persist.recordedLocal,
      message: `${HEURISTIC_V1.name}@${HEURISTIC_V1.version}: ${persist.message}`,
      data: persist,
    };
  });
}
