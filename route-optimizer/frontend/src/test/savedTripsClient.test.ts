import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  rpcMock,
  insertMock,
  insertSingleMock,
  eqMock,
  deleteMock,
  updateMock,
  updateEqMock,
  fromMock,
  getUserMock
} = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  insertMock: vi.fn(),
  insertSingleMock: vi.fn(),
  eqMock: vi.fn(),
  deleteMock: vi.fn(),
  updateMock: vi.fn(),
  updateEqMock: vi.fn(),
  fromMock: vi.fn(),
  getUserMock: vi.fn()
}));

deleteMock.mockImplementation(() => ({ eq: eqMock }));
updateMock.mockImplementation(() => ({ eq: updateEqMock }));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    auth: { getUser: getUserMock }
  },
  supabaseConfigured: true
}));

describe("savedTripsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation((table: string) => {
      if (table === "saved_trips") {
        return { insert: insertMock, delete: deleteMock, update: updateMock };
      }
      return {};
    });
    rpcMock.mockResolvedValue({ data: { total_count: 0, rows: [] }, error: null });
    insertSingleMock.mockResolvedValue({ data: { id: "inserted-row-id" }, error: null });
    insertMock.mockImplementation(() => ({
      select: () => ({
        single: insertSingleMock
      })
    }));
    eqMock.mockResolvedValue({ error: null });
    updateEqMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  });

  test("listSavedTripsPage returns rows and total", async () => {
    const row = {
      id: "t1",
      user_id: "user-1",
      title: "Trip",
      payload: { trip_mode: "round_trip" },
      created_at: "2024-01-01T00:00:00Z",
      is_favorite: true
    };
    rpcMock.mockResolvedValueOnce({ data: { total_count: 42, rows: [row] }, error: null });
    const { listSavedTripsPage } = await import("../api/savedTripsClient");
    const out = await listSavedTripsPage({ limit: 5, offset: 10, search: "ballard", savedOnly: true });
    expect(out.totalCount).toBe(42);
    expect(out.rows).toEqual([expect.objectContaining({ id: "t1", title: "Trip" })]);
    expect(rpcMock).toHaveBeenCalledWith("list_saved_trips_page", {
      p_limit: 5,
      p_offset: 10,
      p_search: "ballard",
      p_saved_only: true,
      p_transport_mode: null,
      p_newest_first: true
    });
  });

  test("listSavedTripsPage throws on rpc error", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "nope" } as { message: string } });
    const { listSavedTripsPage } = await import("../api/savedTripsClient");
    await expect(listSavedTripsPage()).rejects.toThrow("nope");
  });

  test("listSavedTripsPage parses JSON string payload from rpc", async () => {
    const row = {
      id: "r1",
      user_id: "u1",
      title: null,
      payload: { trip_mode: "one_way" },
      created_at: "2024-01-01T00:00:00Z",
      is_favorite: false
    };
    const json = JSON.stringify({ total_count: 3, rows: [row] });
    rpcMock.mockResolvedValueOnce({ data: json, error: null });
    const { listSavedTripsPage } = await import("../api/savedTripsClient");
    const out = await listSavedTripsPage();
    expect(out.totalCount).toBe(3);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].id).toBe("r1");
  });

  test("listSavedTripsPage treats invalid JSON string as empty page", async () => {
    rpcMock.mockResolvedValueOnce({ data: "{not json", error: null });
    const { listSavedTripsPage } = await import("../api/savedTripsClient");
    const out = await listSavedTripsPage();
    expect(out).toEqual({ rows: [], totalCount: 0 });
  });

  test("listSavedTripsPage coerces string total_count and drops non-array rows", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { total_count: "12", rows: "nope" },
      error: null
    });
    const { listSavedTripsPage } = await import("../api/savedTripsClient");
    const out = await listSavedTripsPage();
    expect(out.totalCount).toBe(12);
    expect(out.rows).toEqual([]);
  });

  test("listSavedTripsPage passes null search when blank", async () => {
    const { listSavedTripsPage } = await import("../api/savedTripsClient");
    await listSavedTripsPage({ search: "   " });
    expect(rpcMock).toHaveBeenCalledWith(
      "list_saved_trips_page",
      expect.objectContaining({ p_search: null })
    );
  });

  test("listSavedTripsPage passes transport mode to rpc", async () => {
    const { listSavedTripsPage } = await import("../api/savedTripsClient");
    await listSavedTripsPage({ transportMode: "transit", newestFirst: false });
    expect(rpcMock).toHaveBeenCalledWith(
      "list_saved_trips_page",
      expect.objectContaining({
        p_transport_mode: "transit",
        p_newest_first: false
      })
    );
  });

  test("insertSavedTrip rejects when getUser returns error", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: { id: "x" } }, error: { message: "auth" } });
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
    const id = await insertSavedTrip(payload, "My title");
    expect(id).toBe("inserted-row-id");
    expect(insertMock).toHaveBeenCalled();
    expect(insertSingleMock).toHaveBeenCalled();
    expect(insertMock.mock.calls[0]?.[0]).toEqual({
      user_id: "user-1",
      title: "My title",
      payload,
      is_favorite: false
    });
  });

  test("insertSavedTrip can create a favorited row", async () => {
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
    const id = await insertSavedTrip(payload, "Starred", { isFavorite: true });
    expect(id).toBe("inserted-row-id");
    expect(insertMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ is_favorite: true, title: "Starred" })
    );
  });

  test("insertSavedTrip default title uses origin when title omitted", async () => {
    const { insertSavedTrip } = await import("../api/savedTripsClient");
    const payload = {
      trip_mode: "round_trip" as const,
      origin_query: "Oakland",
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
    await insertSavedTrip(payload);
    expect(insertMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ title: "Trip · Oakland" }));
  });

  test("deleteSavedTrip calls delete with id", async () => {
    const { deleteSavedTrip } = await import("../api/savedTripsClient");
    await deleteSavedTrip("abc");
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("id", "abc");
  });

  test("insertSavedTrip throws on insert error", async () => {
    insertSingleMock.mockResolvedValueOnce({ data: null, error: { message: "db down" } });
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

  test("updateSavedTrip sends null title when only whitespace", async () => {
    const { updateSavedTrip } = await import("../api/savedTripsClient");
    await updateSavedTrip("row-1", "  \t ");
    expect(updateMock).toHaveBeenCalledWith({ title: null });
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
