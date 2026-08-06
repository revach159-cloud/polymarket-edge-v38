import { describe, expect, it } from "vitest";
import { polymarketMarketUrl } from "@/lib/polymarket/urls";
import { formatOutcomeLabel, normalizeOutcomeSide } from "@/lib/markets/outcome-label";
import { formatCloseLabel } from "@/lib/predictions/time-buckets";

describe("polymarketMarketUrl", () => {
  it("uses event/market path when slugs differ", () => {
    expect(
      polymarketMarketUrl({
        slug: "will-gavin-newsom-win-the-2028-democratic-presidential-nomination-568",
        eventSlug: "democratic-presidential-nominee-2028",
      }),
    ).toBe(
      "https://polymarket.com/event/democratic-presidential-nominee-2028/will-gavin-newsom-win-the-2028-democratic-presidential-nomination-568",
    );
  });

  it("uses /event/{slug} when event and market share a slug", () => {
    expect(
      polymarketMarketUrl({
        slug: "xi-jinping-out-before-2027",
        eventSlug: "xi-jinping-out-before-2027",
      }),
    ).toBe("https://polymarket.com/event/xi-jinping-out-before-2027");
  });

  it("falls back to /market/{slug} when event slug is missing", () => {
    expect(polymarketMarketUrl({ slug: "some-market-slug" })).toBe(
      "https://polymarket.com/market/some-market-slug",
    );
  });
});

describe("outcome labels", () => {
  it("maps Over/Under to Yes/No and never echoes Over/Under", () => {
    expect(normalizeOutcomeSide("Over")).toBe("YES");
    expect(normalizeOutcomeSide("Under")).toBe("NO");
    expect(formatOutcomeLabel("Over")).toBe("Yes");
    expect(formatOutcomeLabel("Under")).toBe("No");
    expect(formatOutcomeLabel("YES")).toBe("Yes");
    expect(formatOutcomeLabel("Over")).not.toMatch(/over/i);
  });
});

describe("formatCloseLabel", () => {
  it("includes relative countdown and clock time", () => {
    const now = new Date("2026-08-06T12:00:00.000Z");
    const label = formatCloseLabel("2026-08-06T13:30:00.000Z", now);
    expect(label).toContain("נסגר בעוד");
    expect(label).toContain("·");
  });
});
