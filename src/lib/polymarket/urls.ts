/** Build a working Polymarket deep link for a market. */

export function polymarketMarketUrl(input: {
  slug: string;
  eventSlug?: string | null;
}): string {
  const marketSlug = (input.slug || "").trim();
  const eventSlug = (input.eventSlug || "").trim();
  if (!marketSlug && !eventSlug) return "https://polymarket.com/";

  // Correct deep link: /event/{eventSlug}/{marketSlug}
  // Using only /event/{marketSlug} 404s when the market is part of a larger event.
  if (eventSlug && marketSlug) {
    if (eventSlug === marketSlug) {
      return `https://polymarket.com/event/${encodeURIComponent(eventSlug)}`;
    }
    return `https://polymarket.com/event/${encodeURIComponent(eventSlug)}/${encodeURIComponent(marketSlug)}`;
  }

  // /market/{slug} redirects to the canonical event path when eventSlug is unknown.
  if (marketSlug) {
    return `https://polymarket.com/market/${encodeURIComponent(marketSlug)}`;
  }
  return `https://polymarket.com/event/${encodeURIComponent(eventSlug)}`;
}
