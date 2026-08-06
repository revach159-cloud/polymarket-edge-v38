import { describe, expect, it } from "vitest";
import { polymarketMarketUrl } from "@/lib/polymarket/urls";
import {
  extractQuestionSubject,
  formatOutcomeLabel,
  formatPredictionLabel,
  isSportsMoneylineMarket,
  normalizeOutcomeSide,
} from "@/lib/markets/outcome-label";
import { isQualityPrediction } from "@/lib/markets/quality-gate";
import { formatCloseLabel } from "@/lib/predictions/time-buckets";
import type { Market } from "@/types";

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

describe("prediction outcome labels", () => {
  it("maps Over/Under sides without echoing bare Yes/No as the pick", () => {
    expect(normalizeOutcomeSide("Over")).toBe("YES");
    expect(normalizeOutcomeSide("Under")).toBe("NO");
    expect(formatOutcomeLabel("Over")).toBe("Over");
    expect(formatOutcomeLabel("Under")).toBe("Under");
    expect(formatOutcomeLabel("YES")).not.toMatch(/^yes$/i);
    expect(formatOutcomeLabel("NO")).not.toMatch(/^no$/i);
  });

  it("shows sports moneyline team / Draw instead of Yes/No", () => {
    const paide: Market = {
      id: "1",
      slug: "col-pai-rap-2026-08-06-pai",
      question: "Will Paide Linnameeskond win on 2026-08-06?",
      volume: 1,
      liquidity: 1,
      outcomes: [
        { id: "y", name: "Yes", price: 0.055 },
        { id: "n", name: "No", price: 0.945 },
      ],
      active: true,
      closed: false,
      selectedOutcome: "YES",
      groupItemTitle: "Paide Linnameeskond",
      sportsMarketType: "moneyline",
    };
    expect(formatPredictionLabel(paide)).toBe("Paide Linnameeskond");
    expect(formatPredictionLabel(paide)).not.toMatch(/yes|no/i);

    const draw = {
      ...paide,
      question: "Will Paide Linnameeskond vs. SK Rapid Wien end in a draw?",
      groupItemTitle: "Draw (Paide Linnameeskond vs. SK Rapid Wien)",
      selectedOutcome: "YES" as const,
    };
    expect(formatPredictionLabel(draw)).toBe("Draw");

    const rapid = {
      ...paide,
      question: "Will SK Rapid Wien win on 2026-08-06?",
      groupItemTitle: "SK Rapid Wien",
      selectedOutcome: "YES" as const,
      marketProbability: 0.815,
    };
    expect(formatPredictionLabel(rapid)).toBe("SK Rapid Wien");
  });

  it("extracts subject from Will-questions when group title is missing", () => {
    expect(extractQuestionSubject("Will Gavin Newsom win the nomination?")).toBe(
      "Gavin Newsom",
    );
    expect(
      formatPredictionLabel({
        question: "Will Gavin Newsom win the nomination?",
        selectedOutcome: "YES",
        outcomes: [{ name: "Yes" }, { name: "No" }],
      }),
    ).toBe("Gavin Newsom");
    expect(
      formatPredictionLabel({
        question: "Will Gavin Newsom win the nomination?",
        selectedOutcome: "YES",
        outcomes: [{ name: "Yes" }, { name: "No" }],
      }),
    ).not.toMatch(/yes|no/i);
  });

  it("rejects sports moneyline NO picks from the quality board", () => {
    const now = new Date("2026-08-06T12:00:00.000Z");
    const paideNo: Market = {
      id: "pai-no",
      slug: "col-pai-rap-2026-08-06-pai",
      question: "Will Paide Linnameeskond win on 2026-08-06?",
      endDate: new Date(now.getTime() + 3 * 3_600_000).toISOString(),
      volume: 20_000,
      liquidity: 50_000,
      outcomes: [
        { id: "y", name: "Yes", price: 0.055 },
        { id: "n", name: "No", price: 0.945 },
      ],
      active: true,
      closed: false,
      selectedOutcome: "NO",
      marketProbability: 0.055,
      qualityScore: 80,
      groupItemTitle: "Paide Linnameeskond",
      sportsMarketType: "moneyline",
    };
    expect(isSportsMoneylineMarket(paideNo)).toBe(true);
    expect(isQualityPrediction(paideNo, now)).toBe(false);

    const rapidYes: Market = {
      ...paideNo,
      id: "rap-yes",
      slug: "col-pai-rap-2026-08-06-rap",
      question: "Will SK Rapid Wien win on 2026-08-06?",
      selectedOutcome: "YES",
      marketProbability: 0.815,
      groupItemTitle: "SK Rapid Wien",
      outcomes: [
        { id: "y", name: "Yes", price: 0.815 },
        { id: "n", name: "No", price: 0.185 },
      ],
    };
    expect(isQualityPrediction(rapidYes, now)).toBe(true);
    expect(formatPredictionLabel(rapidYes)).toBe("SK Rapid Wien");
  });
});

describe("formatCloseLabel", () => {
  it("keeps a short clear close label", () => {
    const now = new Date("2026-08-06T12:00:00.000Z");
    const label = formatCloseLabel("2026-08-06T13:30:00.000Z", now);
    expect(label).toBe("סגירה 1ש 30ד");
  });
});
