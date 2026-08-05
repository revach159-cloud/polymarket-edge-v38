import { withJobLock } from "./_lock";

export async function checkResolutionsJob() {
  return withJobLock("check-resolutions", async () => ({
    processed: 0,
    message: "Resolution checks await official Polymarket resolution fields",
  }));
}
