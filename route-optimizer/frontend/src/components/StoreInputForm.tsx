import { useState } from "react";
import type { OptimizeRequest } from "../domain/routeTypes";
import { buildStopSearchQuery } from "../domain/stopQueryBuild";
import AddressAutocomplete from "./AddressAutocomplete";

interface Props {
  onSubmit: (payload: OptimizeRequest) => void;
}

type StopRow = {
  id: string;
  name: string;
  useSpecificAddress: boolean;
  address: string;
};

function newStopRow(partial?: Partial<Pick<StopRow, "name" | "useSpecificAddress" | "address">>): StopRow {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `stop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    name: partial?.name ?? "",
    useSpecificAddress: partial?.useSpecificAddress ?? false,
    address: partial?.address ?? ""
  };
}

function rowToQuery(row: StopRow): { ok: true; query: string } | { ok: false; reason: "empty" | "address" } {
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

export default function StoreInputForm({ onSubmit }: Props) {
  const [originPlace, setOriginPlace] = useState("");
  const [stops, setStops] = useState<StopRow[]>(() => [newStopRow(), newStopRow()]);
  const [error, setError] = useState<string | null>(null);

  const patchStop = (id: string, patch: Partial<StopRow>) => {
    setStops((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addStop = () => {
    if (stops.length >= 10) return;
    setStops((rows) => [...rows, newStopRow()]);
  };

  const removeStop = (id: string) => {
    setStops((rows) => (rows.length <= 2 ? rows : rows.filter((r) => r.id !== id)));
  };

  const submit = () => {
    const place = originPlace.trim();

    if (!place) {
      setError("Please enter a starting address, ZIP, or city.");
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
      setError("Add at least 2 stops with a store or place name (empty rows are skipped).");
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
      trip_mode: "round_trip"
    });
  };

  return (
    <section className="planner-card" aria-label="Route planning form">
      <p>
        We compare <strong>every possible order</strong> of your stops from the start and pick the fastest round trip
        (you return to your starting location). Add <strong>2–10</strong> stops. Use a name only, or turn on{" "}
        <strong>Use specific address</strong> to pin a particular location.
      </p>
      <label htmlFor="origin-place">Starting location</label>
      <p className="muted-small address-autocomplete-help">
        Type your address and choose a match from the list to finish it, or keep typing your own text.
      </p>
      <AddressAutocomplete
        inputId="origin-place"
        value={originPlace}
        onChange={setOriginPlace}
        placeholder="Start typing street, city, or ZIP…"
        ariaLabel="origin-place-input"
      />

      <p className="stops-section-title">Stops to visit</p>
      <p className="muted-small stops-section-hint">Each stop is one store or place. Add or remove rows as needed.</p>

      {stops.map((row, i) => (
        <div key={row.id} className="stop-card">
          <div className="stop-card-header">
            <span className="stop-card-label">Stop {i + 1}</span>
            {stops.length > 2 ? (
              <button
                type="button"
                className="stop-remove-btn"
                onClick={() => removeStop(row.id)}
                aria-label={`Remove stop ${i + 1}`}
              >
                Remove
              </button>
            ) : null}
          </div>
          <label className="stop-name-label" htmlFor={`stop-name-${row.id}`}>
            Store or place name
          </label>
          <input
            id={`stop-name-${row.id}`}
            className="input-field"
            value={row.name}
            onChange={(e) => patchStop(row.id, { name: e.target.value })}
            placeholder="e.g. Target, Whole Foods, Petco"
            aria-label={`Stop ${i + 1} store or place name`}
          />
          <label className="stop-toggle-label">
            <input
              type="checkbox"
              checked={row.useSpecificAddress}
              onChange={(e) =>
                patchStop(row.id, {
                  useSpecificAddress: e.target.checked,
                  ...(e.target.checked ? {} : { address: "" })
                })
              }
              aria-label={`Stop ${i + 1} use specific address`}
            />
            Use specific address
          </label>
          {row.useSpecificAddress ? (
            <>
              <label className="stop-address-label" htmlFor={`stop-address-${row.id}`}>
                Address for this stop
              </label>
              <p className="muted-small address-autocomplete-help">
                We pin this stop to this address (geocoded as you typed it)—we won&apos;t swap it for another
                search hit.
              </p>
              <AddressAutocomplete
                inputId={`stop-address-${row.id}`}
                value={row.address}
                onChange={(v) => patchStop(row.id, { address: v })}
                placeholder="Street, city, or ZIP…"
                ariaLabel={`Stop ${i + 1} specific address`}
              />
            </>
          ) : null}
        </div>
      ))}

      <button
        type="button"
        className="add-stop-btn"
        onClick={addStop}
        disabled={stops.length >= 10}
        aria-label="Add another stop"
      >
        + Add stop
      </button>

      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <button className="primary-btn" type="button" onClick={submit}>
        Optimize Route
      </button>
    </section>
  );
}
