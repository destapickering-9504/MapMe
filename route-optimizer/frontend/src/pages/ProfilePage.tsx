import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
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
import { DeleteSavedPlaceConfirmModal } from "../components/DeleteSavedPlaceConfirmModal";
import { ProfileCoverModal, ProfilePhotoModal } from "../components/ProfileHeroMediaModals";
import {
  createProfileSavedPlaceId,
  parseProfileSavedPlaces,
  profileSavedPlacesUserDataUpdate,
  type ProfileSavedPlace
} from "../domain/profileSavedPlaces";
import { computeStartLocationQuery } from "../domain/savedStartLocations";
import { TRAVEL_MODE_UI, travelModeUiById } from "../domain/travelModesUi";
import { supabase } from "../lib/supabaseClient";
import "./history/historyRef.css";
import { useTheme } from "../theme/ThemeContext";

const AVATAR_BUCKET = import.meta.env.VITE_AVATAR_BUCKET ?? "avatars";

function storageOrAuthErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return "Something went wrong.";
}

/** Same Storage path on upsert keeps the public URL identical; browsers cache by URL, so bust after each upload. */
function withStorageCacheBust(url: string): string {
  const u = url.trim();
  if (!u) return u;
  const joiner = u.includes("?") ? "&" : "?";
  return `${u}${joiner}v=${Date.now()}`;
}

function hintForStorageError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("bucket not found") || m.includes("does not exist")) {
    return ` Create a public Storage bucket named "${AVATAR_BUCKET}" in Supabase (Storage → New bucket), then run the SQL in route-optimizer/supabase/schema.sql for avatars policies.`;
  }
  if (m.includes("row-level security") || m.includes("policy") || m.includes("rls")) {
    return " Run the Storage policies for the avatars bucket from route-optimizer/supabase/schema.sql (Supabase → SQL Editor).";
  }
  if (m.includes("jwt") || m.includes("not authorized") || m.includes("unauthorized")) {
    return " Try signing out and back in, then upload again.";
  }
  return "";
}

const NAME_PRESETS = ["Home", "Work", "Gym"] as const;
type NamePreset = (typeof NAME_PRESETS)[number] | "__other__";

function resolvePresetLabel(preset: NamePreset, otherName: string): string {
  if (preset === "__other__") return otherName.trim();
  return preset;
}

function normalizeStartLabel(s: string): string {
  return s.trim().toLowerCase();
}

function labelToPreset(label: string): { preset: NamePreset; other: string } {
  const trimmed = label.trim();
  if ((NAME_PRESETS as readonly string[]).includes(trimmed)) {
    return { preset: trimmed as NamePreset, other: "" };
  }
  return { preset: "__other__", other: trimmed };
}

function labelSetExcluding(places: ProfileSavedPlace[], excludeId: string | null): Set<string> {
  return new Set(
    places
      .filter((s) => (excludeId ? s.id !== excludeId : true))
      .map((s) => normalizeStartLabel(s.label))
  );
}

function IconPinStart({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

/** Solid home silhouette with chimney (profile “Home” preset). */
function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="2" width="3.25" height="6.75" rx="0.55" fill="currentColor" />
      <path
        fill="currentColor"
        d="M12 4.25L2.5 11.25V21.5h4.75v-5.75a2.25 2.25 0 012.25-2.25h5a2.25 2.25 0 012.25 2.25V21.5h4.75V11.25L12 4.25z"
      />
    </svg>
  );
}

/** Briefcase for “Work” preset. */
function IconWorkBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M9 5V4a1 1 0 011-1h4a1 1 0 011 1v1h3a2 2 0 012 2v1.25H4V8a2 2 0 012-2h3zm1 0h4V4h-4v1zM4 10.25h16V20a2 2 0 01-2 2H6a2 2 0 01-2-2v-9.75zm8 1.5c-.55 0-1 .35-1 .75v.5h-.5a.5.5 0 000 1h3a.5.5 0 000-1H13v-.5c0-.4-.45-.75-1-.75z"
      />
    </svg>
  );
}

/** Dumbbell for “Gym” preset. */
function IconGymDumbbell({ className }: { className?: string }) {
  return (
    <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <rect x="2.25" y="7" width="3.75" height="10" rx="1.25" fill="currentColor" />
      <rect x="18" y="7" width="3.75" height="10" rx="1.25" fill="currentColor" />
      <rect x="6" y="10" width="12" height="4" rx="1.1" fill="currentColor" />
    </svg>
  );
}

function SavedPlaceCardBadge({ label }: { label: string }) {
  const key = label.trim().toLowerCase();
  const tile = (node: ReactNode) => (
    <div className="profile-spot-card-icon profile-spot-card-icon--tile" aria-hidden>
      {node}
    </div>
  );
  if (key === "home") return tile(<IconHome />);
  if (key === "work") return tile(<IconWorkBriefcase />);
  if (key === "gym") return tile(<IconGymDumbbell />);
  return tile(<IconPinStart />);
}

/** Theme toggle in its own planner card (profile grid or guest / no-Supabase states). */
function ProfileAppearanceSettings({ profileGridStack = false }: { profileGridStack?: boolean }) {
  const { theme, setTheme } = useTheme();
  const themeLabelId = useId();
  const isDark = theme === "dark";
  const modeLabel = isDark ? "Dark Mode" : "Light Mode";
  return (
    <section
      className="planner-card profile-section profile-ref-panel"
      aria-labelledby="appearance-block-title"
      style={profileGridStack ? undefined : { marginTop: "1.25rem" }}
    >
      <h2 id="appearance-block-title">Appearance</h2>
      <div className="profile-appearance-row">
        <span className="profile-appearance-row-label" id={themeLabelId}>
          {modeLabel}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-labelledby={themeLabelId}
          className={`profile-theme-switch${isDark ? " profile-theme-switch--on" : ""}`}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          <span className="profile-theme-switch-thumb" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function IconCar({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 0 1-3 0m12.75 0a1.5 1.5 0 0 1-3 0M3 10.5h-.75m18 0H21m-1.5-3H4.5m2.25 0 1.32-2.638a1.5 1.5 0 0 1 1.342-.862h5.256a1.5 1.5 0 0 1 1.342.862L17.25 7.5M5.25 7.5l-.563 4.5m15.626 0-.563-4.5M6.75 7.5h10.5a2.25 2.25 0 0 1 2.25 2.25v6.75a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75v-6.75a2.25 2.25 0 0 1 2.25-2.25Z"
      />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, configured } = useAuth();
  const [savedPlaces, setSavedPlaces] = useState<ProfileSavedPlace[]>([]);
  const [draftPlacePreset, setDraftPlacePreset] = useState<NamePreset>("Home");
  const [draftPlaceOtherName, setDraftPlaceOtherName] = useState("");
  const [draftPlaceAddress, setDraftPlaceAddress] = useState("");

  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editPlacePreset, setEditPlacePreset] = useState<NamePreset>("Home");
  const [editPlaceOtherName, setEditPlaceOtherName] = useState("");
  const [editPlaceAddress, setEditPlaceAddress] = useState("");

  const [editingTravel, setEditingTravel] = useState(false);
  const [draftTravelModes, setDraftTravelModes] = useState<TravelMode[]>(["driving"]);

  const [placesBusy, setPlacesBusy] = useState(false);
  const [travelBusy, setTravelBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [bannerBusy, setBannerBusy] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [placePendingDelete, setPlacePendingDelete] = useState<ProfileSavedPlace | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverObjectUrl, setPendingCoverObjectUrl] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverPickRef = useRef<HTMLInputElement>(null);

  const avatarUrl = useMemo(() => {
    const v = user?.user_metadata?.avatar_url;
    return typeof v === "string" && v.length > 0 ? v : null;
  }, [user]);

  const bannerUrl = useMemo(() => {
    const v = user?.user_metadata?.profile_banner_url;
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return "";
    const meta = user.user_metadata;
    const fromProfile = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
    if (fromProfile) return fromProfile;
    return "Your account";
  }, [user]);

  const avatarInitials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [displayName]);

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
    setSavedPlaces(parseProfileSavedPlaces(meta));
  }, [user]);

  const usedPlaceLabelSet = useMemo(() => labelSetExcluding(savedPlaces, null), [savedPlaces]);

  const availablePlaceNamePresets = useMemo(
    () => NAME_PRESETS.filter((p) => !usedPlaceLabelSet.has(p.toLowerCase())),
    [usedPlaceLabelSet]
  );

  const availableEditPlacePresets = useMemo(() => {
    if (!editingPlaceId) return [...NAME_PRESETS];
    const taken = labelSetExcluding(savedPlaces, editingPlaceId);
    return NAME_PRESETS.filter((p) => !taken.has(p.toLowerCase()));
  }, [savedPlaces, editingPlaceId]);

  useEffect(() => {
    if (draftPlacePreset === "__other__") return;
    if (!availablePlaceNamePresets.includes(draftPlacePreset)) {
      setDraftPlacePreset(availablePlaceNamePresets[0] ?? "__other__");
    }
  }, [draftPlacePreset, availablePlaceNamePresets]);

  useEffect(() => {
    if (!editingPlaceId) return;
    if (editPlacePreset === "__other__") return;
    if (!availableEditPlacePresets.includes(editPlacePreset)) {
      setEditPlacePreset(availableEditPlacePresets[0] ?? "__other__");
    }
  }, [editingPlaceId, editPlacePreset, availableEditPlacePresets]);

  const persistSavedPlaces = useCallback(
    async (next: ProfileSavedPlace[]) => {
      if (!supabase || !user) return;
      setPlacesBusy(true);
      setError(null);
      setSavedMsg(null);
      try {
        const { error: err } = await supabase.auth.updateUser({
          data: profileSavedPlacesUserDataUpdate(next)
        });
        if (err) throw err;
        setSavedPlaces(next);
        setSavedMsg("Places updated.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setPlacesBusy(false);
      }
    },
    [user]
  );

  const saveNewPlace = () => {
    const addr = draftPlaceAddress.trim();
    if (!addr) {
      setError("Add an address (or ZIP / neighborhood) for this place.");
      return;
    }
    const label = resolvePresetLabel(draftPlacePreset, draftPlaceOtherName);
    if (!label) {
      setError(draftPlacePreset === "__other__" ? "Name this place." : "Pick a label.");
      return;
    }
    if (usedPlaceLabelSet.has(normalizeStartLabel(label))) {
      setError("That label is already used. Edit it or pick another.");
      return;
    }
    const query = computeStartLocationQuery(label, addr);
    const next: ProfileSavedPlace[] = [
      ...savedPlaces,
      { id: createProfileSavedPlaceId(), label, address: addr, query }
    ];
    void persistSavedPlaces(next);
    setDraftPlaceAddress("");
    if (draftPlacePreset === "__other__") setDraftPlaceOtherName("");
  };

  const confirmDeleteSavedPlace = useCallback(async () => {
    if (!placePendingDelete) return;
    const id = placePendingDelete.id;
    const next = savedPlaces.filter((s) => s.id !== id);
    await persistSavedPlaces(next);
    setPlacePendingDelete(null);
    if (editingPlaceId === id) setEditingPlaceId(null);
  }, [placePendingDelete, savedPlaces, persistSavedPlaces, editingPlaceId]);

  const beginEditPlace = (s: ProfileSavedPlace) => {
    const { preset, other } = labelToPreset(s.label);
    setEditingPlaceId(s.id);
    setEditPlacePreset(preset);
    setEditPlaceOtherName(other);
    setEditPlaceAddress(s.address);
    setError(null);
  };

  const cancelEditPlace = () => {
    setEditingPlaceId(null);
  };

  const saveEditPlace = () => {
    if (!editingPlaceId) return;
    const addr = editPlaceAddress.trim();
    if (!addr) {
      setError("Add an address for this place.");
      return;
    }
    const label = resolvePresetLabel(editPlacePreset, editPlaceOtherName);
    if (!label) {
      setError(editPlacePreset === "__other__" ? "Name this place." : "Pick a label.");
      return;
    }
    const taken = labelSetExcluding(savedPlaces, editingPlaceId);
    if (taken.has(normalizeStartLabel(label))) {
      setError("That label is already used.");
      return;
    }
    const query = computeStartLocationQuery(label, addr);
    const next = savedPlaces.map((s) =>
      s.id === editingPlaceId ? { ...s, label, address: addr, query } : s
    );
    void persistSavedPlaces(next);
    setEditingPlaceId(null);
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
      setSavedMsg("Travel preferences saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setTravelBusy(false);
    }
  };

  const uploadAvatarFile = useCallback(
    async (file: File) => {
      if (!supabase || !user) throw new Error("Not signed in");
      if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
      const path = `${user.id}/avatar`;
      const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg"
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const publicUrl = withStorageCacheBust(pub.publicUrl);
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      if (metaErr) throw metaErr;
      await supabase.auth.refreshSession();
    },
    [user]
  );

  const uploadBannerFile = useCallback(
    async (file: File) => {
      if (!supabase || !user) throw new Error("Not signed in");
      if (!file.type.startsWith("image/")) throw new Error("Choose an image file for the cover.");
      const path = `${user.id}/profile-banner`;
      const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg"
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const publicUrl = withStorageCacheBust(pub.publicUrl);
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { profile_banner_url: publicUrl }
      });
      if (metaErr) throw metaErr;
      await supabase.auth.refreshSession();
    },
    [user]
  );

  const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !supabase || !user) return;
    setAvatarBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      await uploadAvatarFile(file);
      setSavedMsg("Photo updated.");
      setPhotoModalOpen(false);
    } catch (err) {
      const base = storageOrAuthErrorMessage(err);
      setError(base + hintForStorageError(base));
    } finally {
      setAvatarBusy(false);
    }
  };

  const clearAvatar = useCallback(async () => {
    if (!supabase || !user) return;
    setAvatarBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      const { error: rmErr } = await supabase.storage.from(AVATAR_BUCKET).remove([`${user.id}/avatar`]);
      if (rmErr && !String(rmErr.message).toLowerCase().includes("not found")) {
        throw rmErr;
      }
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { avatar_url: "" }
      });
      if (metaErr) throw metaErr;
      await supabase.auth.refreshSession();
      setSavedMsg("Photo removed.");
      setPhotoModalOpen(false);
    } catch (err) {
      const base = storageOrAuthErrorMessage(err);
      setError(base + hintForStorageError(base));
    } finally {
      setAvatarBusy(false);
    }
  }, [user]);

  const closeCoverModal = useCallback(() => {
    setCoverModalOpen(false);
    setPendingCoverFile(null);
    setPendingCoverObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const onCoverPickPending = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for the cover.");
      return;
    }
    setError(null);
    setPendingCoverFile(file);
    setPendingCoverObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const savePendingCover = async () => {
    if (!pendingCoverFile) return;
    setBannerBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      await uploadBannerFile(pendingCoverFile);
      setSavedMsg("Cover photo updated.");
      closeCoverModal();
    } catch (err) {
      const base = storageOrAuthErrorMessage(err);
      setError(base + hintForStorageError(base));
    } finally {
      setBannerBusy(false);
    }
  };

  const clearBanner = useCallback(async (): Promise<boolean> => {
    if (!supabase || !user) return false;
    setBannerBusy(true);
    setError(null);
    setSavedMsg(null);
    try {
      const { error: rmErr } = await supabase.storage.from(AVATAR_BUCKET).remove([`${user.id}/profile-banner`]);
      if (rmErr && !String(rmErr.message).toLowerCase().includes("not found")) {
        throw rmErr;
      }
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { profile_banner_url: "" }
      });
      if (metaErr) throw metaErr;
      await supabase.auth.refreshSession();
      setSavedMsg("Cover reset to default.");
      return true;
    } catch (err) {
      const base = storageOrAuthErrorMessage(err);
      setError(base + hintForStorageError(base));
      return false;
    } finally {
      setBannerBusy(false);
    }
  }, [user]);

  const handleCoverReset = async () => {
    const ok = await clearBanner();
    if (ok) closeCoverModal();
  };

  if (!configured) {
    return (
      <main className="app-page app-page-profile">
        <h1 className="app-page-title">Profile</h1>
        <p className="muted-small">Add Supabase env vars to use your profile.</p>
        <ProfileAppearanceSettings />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-page app-page-profile">
        <h1 className="app-page-title">Profile</h1>
        <p className="muted-small">
          <Link to="/">Sign in</Link> to open your profile.
        </p>
        <ProfileAppearanceSettings />
      </main>
    );
  }

  return (
    <main className="profile-ref-main app-page">
      <div className="profile-ref-main-inner">
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

          <section className="profile-ref-hero profile-ref-hero--bleed" aria-labelledby="profile-hero-name">
            <input ref={avatarFileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void onAvatarChange(e)} />
            <input ref={coverPickRef} type="file" accept="image/*" className="sr-only" onChange={onCoverPickPending} />

            <div className="profile-ref-hero-banner">
              <button
                type="button"
                className="profile-ref-hero-banner-bg profile-ref-hero-banner-open"
                aria-label={bannerBusy ? "Cover photo loading" : "Edit cover photo"}
                title="Edit cover photo"
                disabled={bannerBusy}
                onClick={() => setCoverModalOpen(true)}
                style={
                  bannerUrl
                    ? { backgroundImage: `url(${JSON.stringify(bannerUrl)})` }
                    : undefined
                }
              />
            </div>

            <div className="profile-ref-hero-avatar-anchor">
              <button
                type="button"
                className="profile-ref-avatar-ring profile-ref-avatar-trigger"
                disabled={avatarBusy}
                onClick={() => setPhotoModalOpen(true)}
                aria-label={avatarBusy ? "Uploading photo" : "Profile photo — open options"}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="profile-ref-avatar" width={112} height={112} />
                ) : (
                  <div className="profile-ref-avatar--placeholder" aria-hidden>
                    {avatarInitials}
                  </div>
                )}
              </button>
            </div>
            <div className="profile-ref-hero-body">
                <div className="profile-ref-hero-text">
                <h1 id="profile-hero-name" className="profile-ref-hero-name">
                  {displayName}
                </h1>
              </div>
            </div>
          </section>

          <ProfilePhotoModal
            open={photoModalOpen}
            onClose={() => !avatarBusy && setPhotoModalOpen(false)}
            previewSrc={avatarUrl}
            showPlaceholder={!avatarUrl}
            initials={avatarInitials}
            busy={avatarBusy}
            hasStoredPhoto={Boolean(avatarUrl)}
            onUpdateClick={() => avatarFileRef.current?.click()}
            onRemoveClick={() => void clearAvatar()}
          />
          <ProfileCoverModal
            open={coverModalOpen}
            onClose={() => !bannerBusy && closeCoverModal()}
            bannerPreviewUrl={pendingCoverObjectUrl ?? bannerUrl}
            useDefaultBannerArt={!pendingCoverObjectUrl && !bannerUrl}
            avatarSrc={avatarUrl}
            avatarShowPlaceholder={!avatarUrl}
            avatarInitials={avatarInitials}
            busy={bannerBusy}
            hasPendingFile={Boolean(pendingCoverFile)}
            hasSavedCover={Boolean(bannerUrl)}
            onPickFile={() => coverPickRef.current?.click()}
            onSave={() => void savePendingCover()}
            onReset={() => void handleCoverReset()}
          />

          {/* —— How you move —— */}
          <section className="planner-card profile-section profile-ref-panel" aria-labelledby="travel-block-title">
        <h2 id="travel-block-title">How you move</h2>
        <p className="muted-small profile-hint">
          Driving, walking, and transit — pick any mix. We use this for realistic route times.
        </p>

        {editingTravel ? (
          <>
            <p className="auth-flow-label-text auth-flow-travel-heading">Tap to toggle</p>
            <p className="auth-flow-sub auth-flow-sub-tight">Keep at least one selected.</p>
            <div className="auth-flow-travel-grid" role="group" aria-label="Travel modes">
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
                {travelBusy ? "Saving…" : "Save"}
              </button>
              <button type="button" className="auth-flow-secondary" disabled={travelBusy} onClick={cancelEditTravel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {travelModes.length > 0 ? (
              <ul className="profile-travel-summary profile-travel-summary--inline">
                {travelModes.map((id) => {
                  const ui = travelModeUiById(id);
                  if (!ui) return null;
                  return (
                    <li key={id} className="profile-travel-summary-card">
                      <span className="profile-travel-summary-title profile-travel-summary-title--with-icon">
                        <span className="profile-travel-mode-icon" aria-hidden>
                          <IconCar />
                        </span>
                        {ui.title}
                      </span>
                      <span className="profile-travel-summary-sub">{ui.sub}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted-small">Not set yet — tell us how you usually get around.</p>
            )}
            <div className="profile-inline-actions">
              <button type="button" className="auth-flow-secondary" onClick={beginEditTravel}>
                {travelModes.length > 0 ? "Edit" : "Set travel modes"}
              </button>
            </div>
          </>
        )}
          </section>

          {/* —— Your places —— */}
          <div className="profile-places-wrap">
            <div className="profile-places-lead">
              <h2 id="places-block-title">Your places</h2>
              <p className="muted-small profile-hint">Save your favorite places to easily start or end a route.</p>
            </div>
            <section
              className="planner-card profile-section profile-ref-panel"
              aria-labelledby="profile-saved-places-heading"
            >
              <h3 id="profile-saved-places-heading" className="profile-places-block-title">
                Saved places
              </h3>

              <div className="profile-places-grid">
                {savedPlaces.length === 0 ? (
                  <p className="muted-small profile-places-empty">No saved places yet — add your first one below.</p>
                ) : null}
                {savedPlaces.map((s) => {
                  const editing = editingPlaceId === s.id;
                  return (
                    <div key={s.id} className={editing ? "profile-spot-card profile-spot-card--editing" : "profile-spot-card"}>
                      {!editing ? (
                        <>
                          <div className="profile-spot-card-row">
                            <div className="profile-spot-card-main">
                              <SavedPlaceCardBadge label={s.label} />
                              <div className="profile-spot-card-text">
                                <span className="profile-saved-start-label">{s.label}</span>
                                <span className="profile-saved-start-query">{s.address || s.query}</span>
                              </div>
                            </div>
                            <div className="profile-spot-card-actions profile-spot-card-actions--edge">
                              <button
                                type="button"
                                className="auth-flow-secondary profile-place-edit-btn"
                                disabled={placesBusy}
                                onClick={() => beginEditPlace(s)}
                              >
                                Edit
                              </button>
                              <details className="profile-place-menu">
                                <summary className="profile-place-menu-trigger" aria-label={`More actions for ${s.label}`}>
                                  ⋯
                                </summary>
                                <div className="profile-place-menu-panel">
                                  <button
                                    type="button"
                                    className="profile-place-menu-item danger"
                                    disabled={placesBusy}
                                    onClick={() => setPlacePendingDelete(s)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </details>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="profile-spot-card-edit">
                          <p className="auth-flow-label-text" style={{ marginBottom: 10 }}>
                            Edit place
                          </p>
                          <label className="auth-flow-label" htmlFor={`edit-place-preset-${s.id}`}>
                            <span className="auth-flow-label-text">Label</span>
                            <select
                              id={`edit-place-preset-${s.id}`}
                              className="auth-flow-input"
                              value={editPlacePreset}
                              onChange={(e) => setEditPlacePreset(e.target.value as NamePreset)}
                            >
                              {availableEditPlacePresets.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                              <option value="__other__">Other</option>
                            </select>
                          </label>
                          {editPlacePreset === "__other__" ? (
                            <label className="auth-flow-label">
                              <span className="auth-flow-label-text">Custom name</span>
                              <input
                                type="text"
                                className="auth-flow-input"
                                value={editPlaceOtherName}
                                onChange={(e) => setEditPlaceOtherName(e.target.value)}
                                placeholder="e.g. Studio"
                                autoComplete="off"
                              />
                            </label>
                          ) : null}
                          <label className="auth-flow-label" htmlFor={`edit-place-addr-${s.id}`}>
                            <span className="auth-flow-label-text">Address</span>
                          </label>
                          <AddressAutocomplete
                            inputId={`edit-place-addr-${s.id}`}
                            value={editPlaceAddress}
                            onChange={setEditPlaceAddress}
                            placeholder="Street, city, ZIP…"
                            ariaLabel="Saved place address"
                            className="auth-flow-input"
                          />
                          <div className="profile-inline-actions">
                            <button type="button" className="auth-flow-primary" disabled={placesBusy} onClick={saveEditPlace}>
                              {placesBusy ? "Saving…" : "Save"}
                            </button>
                            <button type="button" className="auth-flow-secondary" disabled={placesBusy} onClick={cancelEditPlace}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="profile-place-composer profile-place-composer--add">
                <p className="profile-places-compose-title">Add place</p>
                <div className="profile-place-add-row">
                  <div className="profile-place-add-name-cell">
                    <span className="profile-place-add-pin" aria-hidden>
                      <IconPinStart />
                    </span>
                    <div className="profile-place-add-name-inputs">
                      <label className="sr-only" htmlFor="profile-place-name-preset">
                        Place name
                      </label>
                      <select
                        id="profile-place-name-preset"
                        className="auth-flow-input profile-place-add-control"
                        value={draftPlacePreset}
                        onChange={(e) => setDraftPlacePreset(e.target.value as NamePreset)}
                        aria-label="Place name preset"
                      >
                        {availablePlaceNamePresets.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        <option value="__other__">Other…</option>
                      </select>
                      {draftPlacePreset === "__other__" ? (
                        <>
                          <label className="sr-only" htmlFor="profile-place-custom-name">
                            Custom place name
                          </label>
                          <input
                            id="profile-place-custom-name"
                            type="text"
                            className="auth-flow-input profile-place-add-control"
                            value={draftPlaceOtherName}
                            onChange={(e) => setDraftPlaceOtherName(e.target.value)}
                            placeholder="Name (e.g. Home, Work, Gym)"
                            autoComplete="off"
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="profile-place-add-address-cell">
                    <label className="sr-only" htmlFor="profile-place-address">
                      Address
                    </label>
                    <AddressAutocomplete
                      inputId="profile-place-address"
                      value={draftPlaceAddress}
                      onChange={setDraftPlaceAddress}
                      placeholder="Address"
                      ariaLabel="Address for new saved place"
                      className="auth-flow-input profile-place-add-control"
                    />
                  </div>
                </div>
                <p className="muted-small address-autocomplete-help profile-place-add-hint">
                  Suggestions appear as you type — or paste any address.
                </p>
                <button
                  type="button"
                  className="auth-flow-primary profile-place-save-wide"
                  disabled={placesBusy}
                  onClick={saveNewPlace}
                >
                  {placesBusy ? "Saving…" : "Save place"}
                </button>
              </div>
            </section>
          </div>

          <div className="profile-ref-col-stack">
            <section className="planner-card profile-section profile-ref-panel" aria-labelledby="account-block-title">
              <h2 id="account-block-title">Account</h2>
              <p className="muted-small profile-hint">Security and sign-in.</p>
              <div className="profile-account-password-block">
                {user.email ? (
                  <button type="button" className="auth-flow-primary" onClick={() => setChangePwdOpen(true)}>
                    Change password
                  </button>
                ) : (
                  <p className="muted-small profile-account-password-hint">
                    Password changes aren&apos;t available for this sign-in method.
                  </p>
                )}
              </div>
            </section>
            <ProfileAppearanceSettings profileGridStack />
          </div>
        </div>

      {user.email ? (
        <ChangePasswordModal
          open={changePwdOpen}
          onClose={() => setChangePwdOpen(false)}
          userEmail={user.email}
          onSuccess={() => setSavedMsg("Password updated.")}
        />
      ) : null}

      <DeleteSavedPlaceConfirmModal
        open={placePendingDelete !== null}
        placeLabel={placePendingDelete?.label ?? ""}
        placeAddress={placePendingDelete?.address ?? placePendingDelete?.query ?? ""}
        busy={placesBusy && placePendingDelete !== null}
        onCancel={() => !placesBusy && setPlacePendingDelete(null)}
        onConfirm={() => void confirmDeleteSavedPlace()}
      />
    </main>
  );
}
