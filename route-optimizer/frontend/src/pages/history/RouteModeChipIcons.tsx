import type { ReactNode } from "react";
import type { RouteTransportMode } from "./types";

const stroke = 1.65;

/** Side-view car — used on Driving filter chip */
export function DrivingChipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="hm-ref-chip-icon-svg">
      <path
        d="M4 16.5V17a1 1 0 001 1h1.2M17.8 18H19a1 1 0 001-1v-0.5M4 16.5V11l2.2-3.2a1 1 0 01.82-.43h9.96a1 1 0 01.82.43L20 11v5.5M4 16.5h16"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11.5h11"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        opacity={0.45}
      />
      <circle cx="7.75" cy="16.5" r="1.85" fill="currentColor" />
      <circle cx="16.25" cy="16.5" r="1.85" fill="currentColor" />
    </svg>
  );
}

export function WalkingChipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="hm-ref-chip-icon-svg">
      <circle cx="12" cy="4.25" r="2" stroke="currentColor" strokeWidth={stroke} />
      <path
        d="M12 6.5v5.2l2.8 4.6M12 11.7l-2.8 4.6M9.2 18.5h5.6"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.2 9.2l3.6-1.4"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        opacity={0.55}
      />
    </svg>
  );
}

/** Commuter train — use for transit + train thumbnail. */
export function TrainThumbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="hm-ref-chip-icon-svg">
      <path
        d="M4.5 16.5V8.2c0-.55.45-1 1-1h13c.55 0 1 .45 1 1v8.3"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.5 13h15" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" opacity={0.4} />
      <rect x="6.2" y="9" width="3.2" height="2.8" rx="0.45" stroke="currentColor" strokeWidth={1.25} />
      <rect x="10.4" y="9" width="3.2" height="2.8" rx="0.45" stroke="currentColor" strokeWidth={1.25} />
      <rect x="14.6" y="9" width="3.2" height="2.8" rx="0.45" stroke="currentColor" strokeWidth={1.25} />
      <circle cx="7.75" cy="16.5" r="1.35" fill="currentColor" />
      <circle cx="16.25" cy="16.5" r="1.35" fill="currentColor" />
      <path d="M5.5 17.2h13" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" opacity={0.45} />
    </svg>
  );
}

export function TransitChipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="hm-ref-chip-icon-svg">
      <path
        d="M8 5.5h8l1.2 11.5H6.8L8 5.5z"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <path d="M9 5.5V4h6v1.5" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <path d="M7.5 10.5h9" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="9.25" cy="15.5" r="1.15" fill="currentColor" />
      <circle cx="14.75" cy="15.5" r="1.15" fill="currentColor" />
      <path d="M10 18.5h4" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" opacity={0.6} />
    </svg>
  );
}

export function routeModeChipIcon(mode: RouteTransportMode): ReactNode {
  switch (mode) {
    case "driving":
      return <DrivingChipIcon />;
    case "walking":
      return <WalkingChipIcon />;
    case "transit":
      return <TransitChipIcon />;
    default:
      return null;
  }
}
