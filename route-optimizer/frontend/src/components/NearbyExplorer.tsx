import { useState } from "react";
import AddressAutocomplete from "./AddressAutocomplete";
import { NEARBY_PIN_COLORS } from "../map/nearbyPinColors";
import type { NearbyPlace, NearbyRequest, NearbyResponse } from "../domain/routeTypes";

interface Props {
  onSearch: (payload: NearbyRequest) => void;
  loading: boolean;
  error: string | null;
  data: NearbyResponse | null;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export default function NearbyExplorer({ onSearch, loading, error, data }: Props) {
  const [origin, setOrigin] = useState("");
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const submit = () => {
    const o = origin.trim();
    const s = search.trim();
    if (!o) {
      setFormError("Enter your starting location.");
      return;
    }
    if (!s) {
      setFormError('Enter what to find (e.g. "Target", "pharmacy").');
      return;
    }
    setFormError(null);
    onSearch({ origin_place: o, search: s });
  };

  return (
    <section className="planner-card nearby-card" aria-label="Nearby stores search">
      <p className="muted-small">
        Enter <strong>one</strong> starting point and what you&apos;re looking for. We&apos;ll show matches around you on the map with different pin colors.
      </p>
      <label htmlFor="nearby-origin">Starting location</label>
      <p className="muted-small address-autocomplete-help">
        Type and pick a suggested address, or enter any location text.
      </p>
      <AddressAutocomplete
        inputId="nearby-origin"
        value={origin}
        onChange={setOrigin}
        placeholder="Start typing your address…"
        ariaLabel="nearby-origin-input"
      />
      <label htmlFor="nearby-search">Look for</label>
      <input
        id="nearby-search"
        className="input-field"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='e.g. Target, Whole Foods, coffee'
        aria-label="nearby-search-input"
      />
      {(formError || error) && (
        <p className="inline-error" role="alert">
          {formError || error}
        </p>
      )}
      <button type="button" className="primary-btn nearby-btn" onClick={submit} disabled={loading}>
        {loading ? "Searching…" : "Find nearby stores"}
      </button>
      {data && data.places.length > 0 && (
        <div className="nearby-legend">
          <h4 className="nearby-legend-title">Map pins</h4>
          <p className="muted-small nearby-legend-note">
            <span className="nearby-swatch nearby-swatch-you" aria-hidden /> You &middot;{" "}
            <span className="nearby-swatch nearby-swatch-route" aria-hidden /> Optimized route stops (if any)
          </p>
          <ul className="nearby-legend-list" aria-label="Nearby results">
            {data.places.map((p: NearbyPlace, i: number) => (
              <li key={`${p.lat}-${p.lng}-${i}`} className="nearby-legend-item">
                <span
                  className="nearby-swatch"
                  style={{ background: NEARBY_PIN_COLORS[i % NEARBY_PIN_COLORS.length] }}
                  aria-hidden
                />
                <span className="nearby-legend-text">
                  <strong>{p.name}</strong>
                  <span className="nearby-legend-meta">
                    {formatDistance(p.distance_m)} &middot; {p.address.slice(0, 80)}
                    {p.address.length > 80 ? "…" : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data && data.places.length === 0 && !loading && (
        <p className="status-text">No places found in this area. Try a broader term or different location.</p>
      )}
    </section>
  );
}
