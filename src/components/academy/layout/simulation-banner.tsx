import { academyTokens } from "@/lib/academy/design/tokens";

export function SimulationBanner() {
  return (
    <aside
      className="academy-sim-banner"
      role="status"
      aria-label="הצהרת סימולציה"
    >
      <span className="academy-sim-banner__mark" aria-hidden>
        ◆
      </span>
      <p>
        <strong>{academyTokens.brand}</strong>
        {" · "}
        סימולציה וחינוך בלבד — אין מסחר אמיתי, אין הפקדות, ואין הבטחת תשואה.
      </p>
    </aside>
  );
}
