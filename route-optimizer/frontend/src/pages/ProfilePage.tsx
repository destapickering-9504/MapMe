import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  sortTravelModes,
  TRAVEL_ORDER,
  toggleTravelMode,
  type TravelMode
} from "../auth/onboardingGate";
import { useAuth } from "../auth/AuthContext";
import AddressAutocomplete from "../components/AddressAutocomplete";
import ChangePasswordModal from "../components/ChangePasswordModal";
import {
  computeStartLocationQuery,
  createSavedStartLocationId,
  parseSavedStartLocations,
  toMetadataPayload,
  type SavedStartLocation
} from "../domain/savedStartLocations";
import {
  createSavedLocationId,
  parseSavedLocations,
  toSavedLocationsMetadataPayload,
  type SavedLocation
} from "../domain/savedLocations";
import { TRAVEL_MODE_UI, travelModeUiById } from "../domain/travelModesUi";
import { supabase } from "../lib/supabaseClient";

const AVATAR_BUCKET = import.meta.env.VITE_AVATAR_BUCKET ?? "avatars";

const NAME_PRESETS = ["Home", "Work", "Office", "Gym"] as const;
type NamePreset = (typeof NAME_PRESETS)[number] | "__other__";

function resolvePresetLabel(preset: NamePreset, otherName: string): string {
  if (preset === "__other__") return otherName.trim();
  return preset;
}

function normalizeStartLabel(s: string): string {
  return s.trim().toLowerCase();
}

export default function ProfilePage() {
  const { user, configured } = useAuth();
  const [savedStartLocations, setSavedStartLocations] = useState<SavedStartLocation[]>([]);
  const [draftStartPreset, setDraftStartPreset] = useState<NamePreset>("Home");
  const [draftStartOtherName, setDraftStartOtherName] = useState("");
  const [draftStartAddress, setDraftStartAddress] = useState("");

  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [draftSavedLocationName, setDraftSavedLocationName] = useState("");
  const [draftSavedLocationAddress, setDraftSavedLocationAddress] = useState("");

  const [editingTravel, setEditingTravel] = useState(false);
  const [draftTravelModes, setDraftTravelModes] = useState<TravelMode[]>(["driving"]);

  const [startLocBusy, setStartLocBusy] = useState(false);
  const [savedLocationsBusy, setSavedLocationsBusy] = useState(false);
  const [travelBusy, setTravelBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);

  const avatarUrl = useMemo(() => {
    const v = user?.user_metadata?.avatar_url;
    return typeof v === "string" && v.length > 0 ? v : null;
  }, [user]);

  const travelModes = useMemo((): TravelMode[] => {
    if (!user) return [];
    const raw = user.user_metadata?.travel_modes;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const parsed = raw.filter(
      (m): m is TravelMode => typeof m === "string" && (TRAVEL_ORDER as readonly string[]).includes(m)
    );
    return sortTravelModes(parsed);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata as Record<string, unknown>;
    setSavedStartLocations(parseSavedStartLocations(meta));
    setSavedLocations(parseSavedLocations(meta));
  }, [user]);

  const usedStartLabelSet = useMemo(
    () => new Set(savedStartLocations.map((s) => normalizeStartLabel(s.label))),
    [savedStartLocations]
  );

  const availableStartNamePresets = useMemo(
    () => NAME_PRESETS.filter((p) => !usedStartLabelSet.has(p.toLowerCase())),
    [usedStartLabelSet]
  );

  useEffect(() => {
    if (draftStartPreset === "__other__") return;
    if (!availableStartNamePresets.includes(draftStartPreset)) {
      setDraftStartPreset(availableStartNamePresets[0] ?? "__other__");
    }
  }, [draftStartPreset, availableStartNamePresets]);

  const persistSavedStartLocations = useCallback(
    async (next: SavedStartLocation[]) => {
      if (!supabase || !user) return;
      setStartLocBusy(true);
      setError(null);
      setSavedMsg(null);
      try {
        const { error: err } = await supabase.auth.updateUser({
          data: {
            saved_start_locations: toMetadataPayload(next)
          }
        });
        if (err) throw err;
        setSavedStartLocations(next);
        setSavedMsg("Start locations updated.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setStartLocBusy(false);
      }
    },
    [user]
  );

  const persistSavedLocations = useCallback(
    async (next: SavedLocation[]) => {
      if (!supabase || !user) return;
      setSavedLocationsBusy(true);
      setError(null);
      setSavedMsg(null);
      try {
        const { error: err } = await supabase.auth.updateUser({
          data: {
            saved_locations: toSavedLocationsMetadataPayload(next)
          }
        });
        if (err) throw err;
        setSavedLocations(next);
        setSavedMsg("Saved locations updated.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setSavedLocationsBusy(false);
      }
    },
    [user]
  );

  const saveNewStartLocation = () => {
    const addr = draftStartAddress.trim();
    if (!addr) {
      setError("Enter an address, ZIP, or neighborhood for this location.");
      return;
    }
    const label = resolvePresetLabel(draftStartPreset, draftStartOtherName);
    if (!label) {
      setError(draftStartPreset === "__other__" ? "Enter a custom name." : "Choose a name.");
      return;
    }
    if (usedStartLabelSet.has(normalizeStartLabel(label))) {
      setError("You already have a start location with this name. Remove it first or pick a different name.");
      return;
    }
    const query = computeStartLocationQuery(label, addr);
    const next: SavedStartLocation[] = [
      ...savedStartLocations,
      { id: createSavedStartLocationId(), label, address: addr, query }
    ];
    void persistSavedStartLocations(next);
    setDraftStartAddress("");
    if (draftStartPreset === "__other__") setDraftStartOtherName("");
  };

  const removeStartLocation = (id: string) => {
    const next = savedStartLocations.filter((s) => s.id !== id);
    void persistSavedStartLocations(next);
  };

  const saveNewSavedLocation = () => {
    const addr = draftSavedLocationAddress.trim();
    if (!addr) {
      setError("Enter an address for this saved location.");
      return;
    }
    const name = draftSavedLocationName.trim();
    if (!name) {
      setError("Enter a name for this saved location.");
      return;
    }
    const next: SavedLocation[] = [...savedLocations, { id: createSavedLocationId(), name, address: addr }];
    void persistSavedLocations(next);
    setDraftSavedLocationAddress("");
    setDraftSavedLocationName("");
  };

  const removeSavedLocation = (id: string) => {
    const next = savedLocations.filter((s) => s.id !== id);
    void persistSavedLocations(next);
  };

  const beginEditTravel = () => {
    setEditingTravel(true);
    setDraftTravelModes(travelModes.length > 0 ? [...travelModes] : ["driving"]);
    setError(null);
  };

  const cancelEditTravel = () => {
    setEditingTravel(false);
  };

  const saveTravelModes = async () => {
    if (!supabase || !user) return;
    const modes = sortTravelModes(draftTravelModes);
    if (modes.length === 0) {
      setError("Keep at least one way you travel selected.");
      return;
    }
    setTravelBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      const { error: err } = await supabase.auth.updateUser({
        data: { travel_modes: modes }
      });
      if (err) throw err;
      setEditingTravel(false);
      setSavedMsg("Travel options updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setTravelBusy(false);
    }
  };

  const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !supabase || !user) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setAvatarBusy(true);
    setError(null);
    try {
      const path = `${user.id}/avatar`;
      const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg"
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      if (metaErr) throw metaErr;
      setSavedMsg("Photo updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarBusy(false);
    }
  };

  if (!configured) {
    return (
      <main className="app-page app-page-narrow">
        <h1 className="app-page-title">Profile</h1>
        <p className="muted-small">Add Supabase env vars to use your profile.</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-page app-page-narrow">
        <h1 className="app-page-title">Profile</h1>
        <p className="muted-small">
          <Link to="/">Sign in</Link> to edit your profile.
        </p>
      </main>
    );
  }

  return (
    <main className="app-page app-page-narrow">
      <h1 className="app-page-title">Profile</h1>
      <p className="app-page-lead">Start locations, saved places for stops, how you travel, and your photo.</p>

      {error ? (
        <p className="status-text error-text" role="alert">
          {error}
        </p>
      ) : null}
      {savedMsg ? (
        <p className="status-text" role="status">
          {savedMsg}
        </p>
      ) : null}

      <section className="planner-card profile-section">
        <h2 className="profile-section-title">Photo</h2>
        <div className="profile-avatar-row">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="profile-avatar-img" width={96} height={96} />
          ) : (
            <div className="profile-avatar-placeholder" aria-hidden>
              ?
            </div>
          )}
          <label className="profile-avatar-upload">
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void onAvatarChange(e)} disabled={avatarBusy} />
            <span className="auth-flow-secondary profile-avatar-btn">{avatarBusy ? "Uploading…" : "Upload photo"}</span>
          </label>
        </div>
      </section>

      <section className="planner-card profile-section">
        <h2 className="profile-section-title">How you travel</h2>
        <p className="muted-small profile-hint">
          These options are used when planning routes. You can change them anytime.
        </p>
        {editingTravel ? (
          <>
            <p className="auth-flow-label-text auth-flow-travel-heading">How do you plan to travel?</p>
            <p className="auth-flow-sub auth-flow-sub-tight">Select all that apply. At least one must stay selected.</p>
            <div className="auth-flow-travel-grid" role="group" aria-label="Travel modes — select all that apply">
              {TRAVEL_MODE_UI.map(({ id, title, sub }) => {
                const selected = draftTravelModes.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={selected ? "auth-flow-travel-card auth-flow-travel-card-active" : "auth-flow-travel-card"}
                    aria-pressed={selected}
                    onClick={() => setDraftTravelModes((prev) => toggleTravelMode(prev, id))}
                  >
                    <span className="auth-flow-travel-title">{title}</span>
                    <span className="auth-flow-travel-sub">{sub}</span>
                    {selected ? <span className="auth-flow-travel-check">✓</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="profile-travel-edit-actions">
              <button type="button" className="auth-flow-primary" disabled={travelBusy} onClick={() => void saveTravelModes()}>
                {travelBusy ? "Saving…" : "Save travel options"}
              </button>
              <button type="button" className="auth-flow-secondary" disabled={travelBusy} onClick={cancelEditTravel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {travelModes.length > 0 ? (
              <ul className="profile-travel-summary">
                {travelModes.map((id) => {
                  const ui = travelModeUiById(id);
                  if (!ui) return null;
                  return (
                    <li key={id} className="profile-travel-summary-card">
                      <span className="profile-travel-summary-title">{ui.title}</span>
                      <span className="profile-travel-summary-sub">{ui.sub}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted-small">Not set yet — choose at least one option below.</p>
            )}
            <button type="button" className="auth-flow-secondary" onClick={beginEditTravel}>
              {travelModes.length > 0 ? "Edit" : "Set travel options"}
            </button>
          </>
        )}
      </section>

      <section className="planner-card profile-section">
        <h2 className="profile-section-title">Start locations</h2>
        <p className="muted-small profile-hint">
          Pick a name and enter an address. Each name (Home, Work, …) can only be used once; saved places show on the
          planner as starting options.
        </p>
        {savedStartLocations.length > 0 ? (
          <ul className="profile-saved-starts-list">
            {savedStartLocations.map((s) => (
              <li key={s.id} className="profile-saved-start-row">
                <div>
                  <span className="profile-saved-start-label">{s.label}</span>
                  <span className="profile-saved-start-query">{s.address || s.query}</span>
                </div>
                <button
                  type="button"
                  className="saved-trips-linkish danger"
                  disabled={startLocBusy}
                  onClick={() => removeStartLocation(s.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="auth-flow-label-text profile-saved-start-add-title">Add a location</p>
        <label className="auth-flow-label" htmlFor="profile-start-name-preset">
          <span className="auth-flow-label-text">Name</span>
          <select
            id="profile-start-name-preset"
            className="auth-flow-input"
            value={draftStartPreset}
            onChange={(e) => setDraftStartPreset(e.target.value as NamePreset)}
          >
            {availableStartNamePresets.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value="__other__">Other</option>
          </select>
        </label>
        {draftStartPreset === "__other__" ? (
          <label className="auth-flow-label">
            <span className="auth-flow-label-text">Custom name</span>
            <input
              type="text"
              className="auth-flow-input"
              value={draftStartOtherName}
              onChange={(e) => setDraftStartOtherName(e.target.value)}
              placeholder="e.g. Mom&apos;s house"
              autoComplete="off"
            />
          </label>
        ) : null}
        <label className="auth-flow-label" htmlFor="profile-start-address">
          <span className="auth-flow-label-text">Address</span>
        </label>
        <p className="muted-small address-autocomplete-help">
          Start typing and choose a suggestion, or keep your own text.
        </p>
        <AddressAutocomplete
          inputId="profile-start-address"
          value={draftStartAddress}
          onChange={setDraftStartAddress}
          placeholder="Street, city, ZIP, or neighborhood"
          ariaLabel="Start location address"
          className="auth-flow-input"
        />
        <button
          type="button"
          className="auth-flow-secondary"
          disabled={startLocBusy}
          onClick={saveNewStartLocation}
        >
          {startLocBusy ? "Saving…" : "Save location"}
        </button>
      </section>

      <section className="planner-card profile-section">
        <h2 className="profile-section-title">Saved locations</h2>
        <p className="muted-small profile-hint">
          Name and address for places you use often. They appear in the route optimizer under each stop so you can pick
          them quickly, or you can still type stops by hand.
        </p>
        {savedLocations.length > 0 ? (
          <ul className="profile-favorites-list">
            {savedLocations.map((s) => (
              <li key={s.id} className="profile-favorite-row">
                <div>
                  <span className="profile-saved-start-label">{s.name}</span>
                  <span className="profile-saved-start-query">{s.address}</span>
                </div>
                <button
                  type="button"
                  className="saved-trips-linkish danger"
                  disabled={savedLocationsBusy}
                  onClick={() => removeSavedLocation(s.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="auth-flow-label-text profile-saved-start-add-title">Add a saved location</p>
        <label className="auth-flow-label" htmlFor="profile-saved-location-name">
          <span className="auth-flow-label-text">Name</span>
          <input
            id="profile-saved-location-name"
            type="text"
            className="auth-flow-input"
            value={draftSavedLocationName}
            onChange={(e) => setDraftSavedLocationName(e.target.value)}
            placeholder="e.g. Target, dentist, gym"
            autoComplete="off"
          />
        </label>
        <label className="auth-flow-label" htmlFor="profile-saved-location-address">
          <span className="auth-flow-label-text">Address</span>
        </label>
        <p className="muted-small address-autocomplete-help">
          Start typing and choose a suggestion, or keep your own text.
        </p>
        <AddressAutocomplete
          inputId="profile-saved-location-address"
          value={draftSavedLocationAddress}
          onChange={setDraftSavedLocationAddress}
          placeholder="Street, city, or ZIP"
          ariaLabel="Saved location address"
          className="auth-flow-input"
        />
        <button
          type="button"
          className="auth-flow-secondary"
          disabled={savedLocationsBusy}
          onClick={saveNewSavedLocation}
        >
          {savedLocationsBusy ? "Saving…" : "Add saved location"}
        </button>
      </section>

      <section className="planner-card profile-section">
        <h2 className="profile-section-title">Password</h2>
        <p className="muted-small profile-hint">
          Change your password after entering your current one. Forgot it? Use <strong>Forgot password?</strong> on the
          sign-in page to reset by email.
        </p>
        {user.email ? (
          <button type="button" className="auth-flow-secondary" onClick={() => setChangePwdOpen(true)}>
            Change password
          </button>
        ) : (
          <p className="muted-small">Password changes require an email address on your account.</p>
        )}
      </section>

      {user.email ? (
        <ChangePasswordModal
          open={changePwdOpen}
          onClose={() => setChangePwdOpen(false)}
          userEmail={user.email}
          onSuccess={() => setSavedMsg("Password updated.")}
        />
      ) : null}
    </main>
  );
}
