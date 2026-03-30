import type { TravelMode } from "../auth/onboardingGate";

export const TRAVEL_MODE_UI: readonly { id: TravelMode; title: string; sub: string }[] = [
  { id: "driving", title: "Driving", sub: "Car, motorcycle" },
  { id: "walking", title: "Walking", sub: "On foot, bike" },
  { id: "transit", title: "Public Transportation", sub: "Bus, train" }
] as const;

export function travelModeUiById(id: TravelMode): (typeof TRAVEL_MODE_UI)[number] | undefined {
  return TRAVEL_MODE_UI.find((o) => o.id === id);
}
