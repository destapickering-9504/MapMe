import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  orderMock,
  selectMock,
  insertMock,
  eqMock,
  deleteMock,
  updateMock,
  updateEqMock,
  fromMock,
  getUserMock
} = vi.hoisted(() => ({
  orderMock: vi.fn(),
  selectMock: vi.fn(),
  insertMock: vi.fn(),
  eqMock: vi.fn(),
  deleteMock: vi.fn(),
  updateMock: vi.fn(),
  updateEqMock: vi.fn(),
  fromMock: vi.fn(),
  getUserMock: vi.fn()
}));

selectMock.mockImplementation(() => ({ order: orderMock }));
deleteMock.mockImplementation(() => ({ eq: eqMock }));
updateMock.mockImplementation(() => ({ eq: updateEqMock }));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: getUserMock }
  },
  supabaseConfigured: true
}));

describe("savedTripsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation((table: string) => {
      if (table === "saved_trips") {
        return { select: selectMock, insert: insertMock, delete: deleteMock, update: updateMock };
      }
      return {};
    });
    orderMock.mockResolvedValue({ data: [], error: null });
    insertMock.mockResolvedValue({ error: null });
    eqMock.mockResolvedValue({ error: null });
    updateEqMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  });

  test("listSavedTrips returns rows", async () => {
    const row = {
      id: "t1",
      user_id: "user-1",
      title: "Trip",
      payload: { trip_mode: "round_trip" },
      created_at: "2024-01-01T00:00:00Z",
      is_favorite: true
    };
    orderMock.mockResolvedValueOnce({ data: [row], error: null });
    const { listSavedTrips } = await import("../api/savedTripsClient");
    const out = await listSavedTrips();
    expect(out).toEqual([row]);
    expect(fromMock).toHaveBeenCalledWith("saved_trips");
  });

  test("listSavedTrips throws on error", async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: { message: "nope" } });
    const { listSavedTrips } = await import("../api/savedTripsClient");
    await expect(listSavedTrips()).rejects.toThrow("nope");
  });

  test("insertSavedTrip requires user", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { insertSavedTrip } = await import("../api/savedTripsClient");
    const payload = {
      trip_mode: "round_trip" as const,
      origin_query: "94102",
      origin_address: "x",
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
    await expect(insertSavedTrip(payload)).rejects.toThrow(/signed in/i);
  });

  test("insertSavedTrip inserts row", async () => {
    const { insertSavedTrip } = await import("../api/savedTripsClient");
    const payload = {
      trip_mode: "round_trip" as const,
      origin_query: "94102",
      origin_address: "x",
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
    await insertSavedTrip(payload, "My title");
    expect(insertMock).toHaveBeenCalledWith({
      user_id: "user-1",
      title: "My title",
      payload,
      is_favorite: false
    });
  });

  test("deleteSavedTrip calls delete with id", async () => {
    const { deleteSavedTrip } = await import("../api/savedTripsClient");
    await deleteSavedTrip("abc");
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("id", "abc");
  });

  test("insertSavedTrip throws on insert error", async () => {
    insertMock.mockResolvedValueOnce({ error: { message: "db down" } });
    const { insertSavedTrip } = await import("../api/savedTripsClient");
    const payload = {
      trip_mode: "round_trip" as const,
      origin_query: "94102",
      origin_address: "x",
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
    await expect(insertSavedTrip(payload)).rejects.toThrow("db down");
  });

  test("deleteSavedTrip throws on error", async () => {
    eqMock.mockResolvedValueOnce({ error: { message: "no" } });
    const { deleteSavedTrip } = await import("../api/savedTripsClient");
    await expect(deleteSavedTrip("x")).rejects.toThrow("no");
  });

  test("updateSavedTrip updates title", async () => {
    const { updateSavedTrip } = await import("../api/savedTripsClient");
    await updateSavedTrip("row-1", "Sunday shopping");
    expect(updateMock).toHaveBeenCalledWith({ title: "Sunday shopping" });
    expect(updateEqMock).toHaveBeenCalledWith("id", "row-1");
  });

  test("updateSavedTrip throws on error", async () => {
    updateEqMock.mockResolvedValueOnce({ error: { message: "fail" } });
    const { updateSavedTrip } = await import("../api/savedTripsClient");
    await expect(updateSavedTrip("x", "t")).rejects.toThrow("fail");
  });

  test("setSavedTripFavorite updates flag", async () => {
    const { setSavedTripFavorite } = await import("../api/savedTripsClient");
    await setSavedTripFavorite("row-1", true);
    expect(updateMock).toHaveBeenCalledWith({ is_favorite: true });
    expect(updateEqMock).toHaveBeenCalledWith("id", "row-1");
  });

  test("setSavedTripFavorite throws on error", async () => {
    updateEqMock.mockResolvedValueOnce({ error: { message: "nope" } });
    const { setSavedTripFavorite } = await import("../api/savedTripsClient");
    await expect(setSavedTripFavorite("x", false)).rejects.toThrow("nope");
  });
});
