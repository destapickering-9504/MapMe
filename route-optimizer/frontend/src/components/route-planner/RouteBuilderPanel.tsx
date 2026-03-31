import { useEffect, useMemo, useRef, useState } from "react";
import "./plannerRef.css";
import type { OptimizeRequest } from "../../domain/routeTypes";
import { buildStopSearchQuery } from "../../domain/stopQueryBuild";
import type { ProfileSavedPlace } from "../../domain/profileSavedPlaces";
import AddressAutocomplete from "../AddressAutocomplete";
import StartLocationCombobox from "../StartLocationCombobox";
import StopPlaceCombobox from "../StopPlaceCombobox";
import TripTypeSelector, { type TripMode } from "./TripTypeSelector";
import StopRow from "./StopRow";
import { stopGlyphForName, stopIconVariantForName } from "./stopRowIcon";

const NO_SAVED_PLACES: ProfileSavedPlace[] = [];

export type SaveLocationToProfileResult =
  | { ok: true }
  | { ok: false; message: string };

interface Props {
  onSubmit: (payload: OptimizeRequest) => void;
  savedPlaces?: ProfileSavedPlace[];
  onSaveLocationToProfile?: (name: string, address: string) => Promise<SaveLocationToProfileResult>;
  optimizeLoading?: boolean;
}

type StopRowModel = {
  id: string;
  name: string;
  useSpecificAddress: boolean;
  address: string;
  savedLocationId: string | null;
};

function newStopRow(partial?: Partial<Pick<StopRowModel, "name" | "useSpecificAddress" | "address">>): StopRowModel {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `stop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    name: partial?.name ?? "",
    useSpecificAddress: partial?.useSpecificAddress ?? false,
    address: partial?.address ?? "",
    savedLocationId: null
  };
}

function rowToQuery(row: StopRowModel): { ok: true; query: string } | { ok: false; reason: "empty" | "address" } {
  const name = row.name.trim();
  if (!name) {
    return { ok: false, reason: "empty" };
  }
  if (row.useSpecificAddress) {
    const addr = row.address.trim();
    if (!addr) {
      return { ok: false, reason: "address" };
    }
    return { ok: true, query: buildStopSearchQuery(name, addr) };
  }
  return { ok: true, query: name };
}

function savedPlacesSelectableForRow(
  stops: StopRowModel[],
  rowId: string,
  savedPlaces: ProfileSavedPlace[]
): ProfileSavedPlace[] {
  const row = stops.find((r) => r.id === rowId);
  const currentId = row?.savedLocationId ?? null;
  const usedElsewhere = new Set(
    stops.filter((r) => r.id !== rowId && r.savedLocationId).map((r) => r.savedLocationId as string)
  );
  return savedPlaces.filter((s) => !usedElsewhere.has(s.id) || s.id === currentId);
}

function sameSavedPlace(a: string, b: string, c: string, d: string): boolean {
  return a.trim().toLowerCase() === c.trim().toLowerCase() && b.trim().toLowerCase() === d.trim().toLowerCase();
}

function startHeadline(origin: string, savedPlaces: ProfileSavedPlace[]): string {
  const t = origin.trim();
  if (!t) return "Start location";
  const home = savedPlaces.find((s) => /home/i.test(s.label));
  if (home && t === home.address.trim()) return "Start: Home";
  const head = t.split(",")[0]?.trim() ?? t;
  return head.length > 28 ? `Start: ${head.slice(0, 26)}…` : `Start: ${head}`;
}

export default function RouteBuilderPanel({
  onSubmit,
  savedPlaces = NO_SAVED_PLACES,
  onSaveLocationToProfile,
  optimizeLoading = false
}: Props) {
  const [originPlace, setOriginPlace] = useState("");
  const [stops, setStops] = useState<StopRowModel[]>(() => [newStopRow(), newStopRow()]);
  const [tripMode, setTripMode] = useState<TripMode>("round_trip");
  const [error, setError] = useState<string | null>(null);
  const [profileSaveBusyId, setProfileSaveBusyId] = useState<string | null>(null);
  const [profileSaveNote, setProfileSaveNote] = useState<{ stopId: string; kind: "ok" | "err"; text: string } | null>(
    null
  );
  const profileSaveClearTimer = useRef<number | null>(null);
  const dragPayload = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (profileSaveClearTimer.current) {
        clearTimeout(profileSaveClearTimer.current);
      }
    };
  }, []);

  const savedPlaceList = useMemo(() => savedPlaces, [savedPlaces]);

  const patchStop = (id: string, patch: Partial<StopRowModel>) => {
    setStops((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addStop = () => {
    if (stops.length >= 10) return;
    setStops((rows) => [...rows, newStopRow()]);
  };

  const removeStop = (id: string) => {
    setStops((rows) => (rows.length <= 2 ? rows : rows.filter((r) => r.id !== id)));
  };

  const moveStop = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setStops((rows) => {
      const i = rows.findIndex((r) => r.id === fromId);
      const j = rows.findIndex((r) => r.id === toId);
      if (i < 0 || j < 0) return rows;
      const next = [...rows];
      const [row] = next.splice(i, 1);
      next.splice(j, 0, row);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    const t = e.target as HTMLElement;
    if (!t.closest("[data-drag-handle='true']")) {
      e.preventDefault();
      return;
    }
    dragPayload.current = id;
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const fromId = dragPayload.current ?? e.dataTransfer.getData("text/plain");
    dragPayload.current = null;
    if (fromId) moveStop(fromId, targetId);
  };

  const handleDragEnd = () => {
    dragPayload.current = null;
  };

  const submit = () => {
    const place = originPlace.trim();

    if (!place) {
      setError("Add a starting address, ZIP, or city.");
      return;
    }

    const queries: string[] = [];
    for (let i = 0; i < stops.length; i++) {
      const row = stops[i];
      const out = rowToQuery(row);
      if (!out.ok) {
        if (out.reason === "empty") {
          continue;
        }
        setError(
          `Stop ${i + 1}: you turned on “Use specific address” — add an address or turn the toggle off.`
        );
        return;
      }
      queries.push(out.query);
    }

    if (queries.length < 2) {
      setError("Add at least 2 stops (empty rows are skipped).");
      return;
    }
    if (queries.length > 10) {
      setError("You can add at most 10 stops.");
      return;
    }

    setError(null);
    onSubmit({
      origin_place: place,
      stores: queries,
      trip_mode: tripMode
    });
  };

  const saveStopToProfile = async (stopId: string, name: string, address: string) => {
    if (!onSaveLocationToProfile) return;
    setProfileSaveNote(null);
    setProfileSaveBusyId(stopId);
    try {
      const r = await onSaveLocationToProfile(name, address);
      if (r.ok) {
        setProfileSaveNote({ stopId, kind: "ok", text: "Saved to your profile." });
        if (profileSaveClearTimer.current) clearTimeout(profileSaveClearTimer.current);
        profileSaveClearTimer.current = window.setTimeout(() => {
          profileSaveClearTimer.current = null;
          setProfileSaveNote((prev) => (prev?.stopId === stopId && prev.kind === "ok" ? null : prev));
        }, 4000);
      } else {
        setProfileSaveNote({ stopId, kind: "err", text: r.message });
      }
    } finally {
      setProfileSaveBusyId(null);
    }
  };

  const startLabel = startHeadline(originPlace, savedPlaces);

  return (
    <section className="hm-ref-planner-builder-card flex flex-col gap-5 p-6" aria-label="Route builder">
      <header className="space-y-2">
        <h1 className="hm-ref-planner-h1">Plan your route</h1>
        <p className="hm-ref-planner-lead">Add 2–10 stops and we’ll find the fastest route for your day.</p>
      </header>

      {/* Start row */}
      <div className="hm-ref-planner-start-block">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hm-ref-planner-icon-square hm-ref-planner-icon-square--sage shrink-0" aria-hidden>
              🏠
            </div>
            <div className="min-w-0 flex-1">
              <div className="hm-ref-planner-label-title">{startLabel}</div>
              <p className="hm-ref-planner-label-hint">Saved place, street, city, or ZIP</p>
            </div>
          </div>
          <button
            type="button"
            className="hm-ref-planner-start-edit-btn shrink-0"
            aria-label="Edit start location"
            onClick={() => document.getElementById("origin-place")?.focus()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <StartLocationCombobox
          inputId="origin-place"
          value={originPlace}
          onChange={setOriginPlace}
          savedPlaces={savedPlaces}
          placeholder="Where are you leaving from?"
          ariaLabel="origin-place-input"
        />
      </div>

      <p className="hm-ref-planner-stops-hint">
        <strong>Stops</strong>
        <span className="hm-ref-planner-stops-dot"> · </span>
        Drag to reorder
      </p>

      <div className="hm-ref-planner-stops-rail flex flex-col gap-3">
        {stops.map((row, i) => {
          const placeOptions = savedPlacesSelectableForRow(stops, row.id, savedPlaceList);
          const displayName = row.name.trim() || `Stop ${i + 1}`;
          const variant = stopIconVariantForName(row.name);
          return (
            <div key={row.id} className="hm-ref-planner-stop-chain-item relative">
              {i > 0 ? <div className="hm-ref-planner-stop-chain-line" aria-hidden /> : null}
            <StopRow
              dragId={row.id}
              orderIndex={i + 1}
              iconVariant={variant}
              icon={<span aria-hidden>{stopGlyphForName(row.name)}</span>}
              title={<span className="truncate">{displayName}</span>}
              showRemove={stops.length > 2}
              onRemove={() => removeStop(row.id)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            >
              <StopPlaceCombobox
                inputId={`stop-place-${row.id}`}
                value={row.name}
                savedPlaces={placeOptions}
                ariaLabel={`Stop ${i + 1} store or place name`}
                listboxAriaLabel={`Stop ${i + 1} place suggestions`}
                placeholder={savedPlaceList.length > 0 ? "Saved place or type a name…" : "e.g. Petco, Whole Foods"}
                onTypingChange={(name) => patchStop(row.id, { name, savedLocationId: null })}
                onPickSaved={(loc) =>
                  patchStop(row.id, {
                    savedLocationId: loc.id,
                    name: loc.label,
                    address: loc.address,
                    useSpecificAddress: true
                  })
                }
              />
              <label className="hm-ref-planner-checkbox-label flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-[color:var(--ref-line,rgba(255,255,255,0.15))] bg-[color:var(--ref-card-b,#0d1015)]"
                  checked={row.useSpecificAddress}
                  onChange={(e) =>
                    patchStop(row.id, {
                      useSpecificAddress: e.target.checked,
                      ...(e.target.checked ? {} : { address: "", savedLocationId: null })
                    })
                  }
                  aria-label={`Stop ${i + 1} use specific address`}
                />
                Use specific address
              </label>
              {row.useSpecificAddress ? (
                <div className="hm-ref-planner-nested space-y-2">
                  <p className="hm-ref-planner-nested-hint">
                    Pins this stop to the address you enter (geocoded as typed).
                  </p>
                  <AddressAutocomplete
                    inputId={`stop-address-${row.id}`}
                    value={row.address}
                    onChange={(v) => patchStop(row.id, { address: v, savedLocationId: null })}
                    placeholder="Street, city, or ZIP…"
                    ariaLabel={`Stop ${i + 1} specific address`}
                  />
                  {onSaveLocationToProfile && row.name.trim() && row.address.trim() ? (
                    <div className="flex flex-col gap-1.5">
                      {row.savedLocationId ? (
                        <p className="hm-ref-planner-muted-small">This stop uses a place from your profile list.</p>
                      ) : savedPlaceList.some((s) => sameSavedPlace(s.label, s.address, row.name, row.address)) ? (
                        <p className="hm-ref-planner-muted-small">Already in your saved places.</p>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="hm-ref-planner-save-btn w-full"
                            disabled={profileSaveBusyId === row.id}
                            onClick={() => void saveStopToProfile(row.id, row.name, row.address)}
                            aria-label={`Save stop ${i + 1} to profile locations`}
                          >
                            {profileSaveBusyId === row.id ? "Saving…" : "Save to my locations"}
                          </button>
                          {profileSaveNote?.stopId === row.id ? (
                            <p
                              role={profileSaveNote.kind === "err" ? "alert" : "status"}
                              className={
                                profileSaveNote.kind === "err"
                                  ? "text-[12px] font-semibold text-red-300"
                                  : "hm-ref-planner-text-sage text-[12px] font-semibold"
                              }
                            >
                              {profileSaveNote.text}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </StopRow>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="hm-ref-planner-ghost-btn"
        onClick={addStop}
        disabled={stops.length >= 10}
        aria-label="Add another stop"
      >
        <span className="text-lg leading-none">+</span> Add stop
      </button>

      <TripTypeSelector value={tripMode} onChange={setTripMode} />

      {error ? (
        <p role="alert" className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-[13px] font-semibold text-red-200">
          {error}
        </p>
      ) : null}

      <p className="hm-ref-planner-cta-preline">Your route will consider distance, timing, and optimal order.</p>

      <button
        type="button"
        onClick={submit}
        disabled={optimizeLoading}
        className="hm-ref-planner-cta hm-ref-planner-cta--ref-orange relative overflow-hidden"
      >
        {optimizeLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Optimizing…
          </span>
        ) : (
          "Optimize Route"
        )}
      </button>

      <p className="hm-ref-planner-footnote">
        Your route will consider distance, timing, and optimal order.
      </p>
    </section>
  );
}
