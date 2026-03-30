import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import SavedTripsPanel from "../components/SavedTripsPanel";
import type { OptimizeResponse } from "../domain/routeTypes";
import { ROUTE_HISTORY_PATH } from "../routes/paths";

const { useAuthMock, listSavedTripsPage, setSavedTripFavorite } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  listSavedTripsPage: vi.fn(),
  setSavedTripFavorite: vi.fn()
}));

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => useAuthMock()
}));

vi.mock("../api/savedTripsClient", () => ({
  listSavedTripsPage: (...args: unknown[]) => listSavedTripsPage(...args),
  setSavedTripFavorite: (...args: unknown[]) => setSavedTripFavorite(...args)
}));

const baseAuth = {
  loading: false,
  session: null,
  signOut: vi.fn()
};

const samplePayload: OptimizeResponse = {
  trip_mode: "round_trip",
  origin_query: "94102",
  origin_address: "SF",
  origin_lat: 1,
  origin_lng: 2,
  stops_resolved: [],
  permutations_considered: 1,
  best_route: {
    ordered_stores: ["A"],
    ordered_stops: [{ query: "A", address: "a", lat: 1, lng: 2 }],
    total_minutes: 10
  },
  alternatives: [],
  explanation: "",
  travel_time_note: "",
  best_route_geojson: null
};

describe("SavedTripsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listSavedTripsPage.mockResolvedValue({ rows: [], totalCount: 0 });
    setSavedTripFavorite.mockResolvedValue(undefined);
  });

  afterEach(() => cleanup());

  test("shows setup hint when Supabase is not configured", () => {
    useAuthMock.mockReturnValue({ ...baseAuth, user: null, configured: false });
    render(
      <MemoryRouter>
        <SavedTripsPanel currentResult={null} onLoadTrip={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText(/VITE_SUPABASE_URL/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /favorite routes/i })).toBeTruthy();
  });

  test("prompts sign-in when configured but logged out", () => {
    useAuthMock.mockReturnValue({ ...baseAuth, user: null, configured: true });
    render(
      <MemoryRouter>
        <SavedTripsPanel currentResult={null} onLoadTrip={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /^sign in$/i }).getAttribute("href")).toBe("/");
    const historyLink = screen.getByRole("link", { name: /^history$/i });
    expect(historyLink.getAttribute("href")).toBe(ROUTE_HISTORY_PATH);
  });

  test("when signed in with no favorites shows heading only (no list)", async () => {
    useAuthMock.mockReturnValue({
      ...baseAuth,
      user: { id: "u1" },
      configured: true
    });
    listSavedTripsPage.mockResolvedValue({
      rows: [
        {
          id: "row-1",
          user_id: "u1",
          title: "Mine",
          payload: samplePayload,
          created_at: "2024-06-01T12:00:00Z",
          is_favorite: false
        }
      ],
      totalCount: 1
    });
    render(
      <MemoryRouter>
        <SavedTripsPanel currentResult={null} onLoadTrip={vi.fn()} />
      </MemoryRouter>
    );
    await waitFor(() => expect(listSavedTripsPage).toHaveBeenCalled());
    expect(screen.getByRole("heading", { name: /favorite routes/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^load$/i })).toBeNull();
  });

  test("load applies payload for favorite", async () => {
    const onLoad = vi.fn();
    useAuthMock.mockReturnValue({
      ...baseAuth,
      user: { id: "u1" },
      configured: true
    });
    listSavedTripsPage.mockResolvedValue({
      rows: [
        {
          id: "row-1",
          user_id: "u1",
          title: "Mine",
          payload: samplePayload,
          created_at: "2024-06-01T12:00:00Z",
          is_favorite: true
        }
      ],
      totalCount: 1
    });
    render(
      <MemoryRouter>
        <SavedTripsPanel currentResult={null} onLoadTrip={onLoad} />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/Mine/)).toBeTruthy());
    const link = screen.getByRole("link", { name: /^history$/i });
    expect(link.getAttribute("href")).toBe(ROUTE_HISTORY_PATH);
    fireEvent.click(screen.getByRole("button", { name: /^load$/i }));
    expect(onLoad).toHaveBeenCalledWith(samplePayload);
  });

  test("unstar calls API and refreshes", async () => {
    useAuthMock.mockReturnValue({
      ...baseAuth,
      user: { id: "u1" },
      configured: true
    });
    listSavedTripsPage
      .mockResolvedValueOnce({
        rows: [
          {
            id: "row-1",
            user_id: "u1",
            title: "Mine",
            payload: samplePayload,
            created_at: "2024-06-01T12:00:00Z",
            is_favorite: true
          }
        ],
        totalCount: 1
      })
      .mockResolvedValueOnce({ rows: [], totalCount: 0 });
    render(
      <MemoryRouter>
        <SavedTripsPanel currentResult={null} onLoadTrip={vi.fn()} />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole("button", { name: /^unstar$/i })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /^unstar$/i }));
    await waitFor(() => expect(setSavedTripFavorite).toHaveBeenCalledWith("row-1", false));
    expect(listSavedTripsPage).toHaveBeenCalledTimes(2);
  });
});
