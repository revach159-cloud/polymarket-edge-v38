import { withJobLock } from "./_lock";
import { HEURISTIC_V1 } from "@/lib/predictions/config";

export async function runModelJob() {
  return withJobLock("run-model", async () => ({
    processed: 0,
    message: `Model ${HEURISTIC_V1.name}@${HEURISTIC_V1.version} ready — persist predictions when Supabase service role is configured`,
  }));
}
