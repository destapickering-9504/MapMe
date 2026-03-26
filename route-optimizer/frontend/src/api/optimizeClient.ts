import type { OptimizeRequest, OptimizeResponse } from "../domain/routeTypes";

export async function optimizeRoute(payload: OptimizeRequest): Promise<OptimizeResponse> {
  const response = await fetch("http://localhost:8000/api/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    let message = "Failed to optimize route.";
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
  return response.json() as Promise<OptimizeResponse>;
}
