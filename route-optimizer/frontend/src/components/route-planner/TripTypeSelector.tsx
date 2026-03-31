import type { OptimizeRequest } from "../../domain/routeTypes";

export type TripMode = OptimizeRequest["trip_mode"];

interface Props {
  value: TripMode;
  onChange: (mode: TripMode) => void;
}

export default function TripTypeSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2" role="group" aria-label="Trip type">
      <p className="hm-ref-planner-trip-label">Trip type</p>
      <div className="hm-ref-planner-trip-stack">
        <button
          type="button"
          onClick={() => onChange("round_trip")}
          className={[
            "hm-ref-planner-trip-card",
            value === "round_trip" ? "hm-ref-planner-trip-card--active" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={value === "round_trip"}
          aria-label="Round Trip Return to start"
        >
          <span className="hm-ref-planner-trip-card-icon" aria-hidden>
            {value === "round_trip" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="color-mix(in srgb, var(--ref-sage, #5cba98) 92%, #000)" />
                <path
                  d="M8 12.5l2.5 2.5L16 9"
                  stroke="#0a0d12"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9.25" stroke="#64748b" strokeWidth="1.75" />
              </svg>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="hm-ref-planner-trip-card-title">Round Trip</span>
            <span className="hm-ref-planner-trip-card-sub">Return to start</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("one_way")}
          className={[
            "hm-ref-planner-trip-card",
            value === "one_way" ? "hm-ref-planner-trip-card--active" : ""
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={value === "one_way"}
          aria-label="One Way End at last stop"
        >
          <span className="hm-ref-planner-trip-card-icon" aria-hidden>
            {value === "one_way" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 5v14l7-4 7 4V5l-7 4-7-4z"
                  fill="color-mix(in srgb, var(--ref-sage, #5cba98) 88%, #000)"
                  stroke="color-mix(in srgb, var(--ref-sage, #5cba98) 70%, #fff)"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.75" aria-hidden>
                <path d="M5 5v14l7-4 7 4V5l-7 4-7-4z" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="hm-ref-planner-trip-card-title">One Way</span>
            <span className="hm-ref-planner-trip-card-sub">End at last stop</span>
          </span>
        </button>
      </div>
    </div>
  );
}
