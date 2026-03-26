import type { NearbyRequest, NearbyResponse } from "../domain/routeTypes";

export async function fetchNearbyStores(payload: NearbyRequest): Promise<NearbyResponse> {
  const response = await fetch("http://localhost:8000/api/nearby", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    let message = "Failed to search nearby.";
    try {
      const errBody = (await response.json()) as { detail?: string };
      if (typeof errBody.detail === "string") {
        message = errBody.detail;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return response.json() as Promise<NearbyResponse>;
}
