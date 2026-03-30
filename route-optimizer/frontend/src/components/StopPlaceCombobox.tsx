import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { fetchAddressSuggestions, type AddressSuggestion } from "../api/addressSuggestClient";
import type { SavedLocation } from "../domain/savedLocations";

const DEBOUNCE_MS = 280;
const BLUR_CLOSE_MS = 200;

type CombinedRow = { kind: "saved"; saved: SavedLocation } | { kind: "api"; api: AddressSuggestion };

interface Props {
  value: string;
  savedLocations: SavedLocation[];
  /** When false (e.g. “Use specific address” is on), only saved rows appear — no geocode suggestions on this field. */
  includeAddressSuggestions: boolean;
  inputId: string;
  ariaLabel: string;
  listboxAriaLabel?: string;
  placeholder?: string;
  className?: string;
  onTypingChange: (name: string) => void;
  onPickSaved: (loc: SavedLocation) => void;
  onPickAddressSuggestion: (label: string) => void;
}

function savedMatchesQuery(s: SavedLocation, needle: string): boolean {
  if (!needle) return true;
  const n = needle.toLowerCase();
  return s.name.toLowerCase().includes(n) || s.address.toLowerCase().includes(n);
}

function formatSavedRow(s: SavedLocation): string {
  const line = s.address.trim();
  const short = line.length > 52 ? `${line.slice(0, 52)}…` : line;
  return `${s.name} — ${short}`;
}

export default function StopPlaceCombobox({
  value,
  savedLocations,
  includeAddressSuggestions,
  inputId,
  ariaLabel,
  listboxAriaLabel = "Place suggestions",
  placeholder,
  className = "input-field",
  onTypingChange,
  onPickSaved,
  onPickAddressSuggestion
}: Props) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<AddressSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputFocusedRef = useRef(false);
  const suppressOpenFromRowsEffectRef = useRef(false);

  const filteredSaved = useMemo(
    () => savedLocations.filter((s) => savedMatchesQuery(s, value.trim())),
    [savedLocations, value]
  );

  const runSuggest = useCallback(
    (q: string) => {
      if (!includeAddressSuggestions || q.trim().length < 3) {
        setApiSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      fetchAddressSuggestions(q)
        .then(setApiSuggestions)
        .catch(() => setApiSuggestions([]))
        .finally(() => setLoading(false));
    },
    [includeAddressSuggestions]
  );

  useEffect(() => {
    if (!includeAddressSuggestions) {
      setApiSuggestions([]);
      setLoading(false);
    }
  }, [includeAddressSuggestions]);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!includeAddressSuggestions) {
      return;
    }
    debounceTimer.current = setTimeout(() => runSuggest(value), DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value, runSuggest, includeAddressSuggestions]);

  const rows: CombinedRow[] = useMemo(() => {
    const out: CombinedRow[] = [];
    for (const s of filteredSaved) out.push({ kind: "saved", saved: s });
    if (includeAddressSuggestions) {
      for (const a of apiSuggestions) out.push({ kind: "api", api: a });
    }
    return out;
  }, [filteredSaved, apiSuggestions, includeAddressSuggestions]);

  const totalRows = rows.length;

  useEffect(() => {
    if (totalRows === 0) {
      setOpen(false);
      setHighlight(-1);
      return;
    }
    if (suppressOpenFromRowsEffectRef.current) {
      suppressOpenFromRowsEffectRef.current = false;
    } else if (inputFocusedRef.current) {
      setOpen(true);
    }
    setHighlight((h) => {
      if (h < 0) return 0;
      return Math.min(h, totalRows - 1);
    });
  }, [totalRows]);

  const close = () => {
    setOpen(false);
    setHighlight(-1);
  };

  const pickRow = (row: CombinedRow) => {
    if (row.kind === "saved") {
      onPickSaved(row.saved);
    } else {
      onPickAddressSuggestion(row.api.label);
    }
    setApiSuggestions([]);
    suppressOpenFromRowsEffectRef.current = true;
    close();
  };

  const onInputBlur = () => {
    inputFocusedRef.current = false;
    blurTimer.current = setTimeout(close, BLUR_CLOSE_MS);
  };

  const onInputFocus = () => {
    inputFocusedRef.current = true;
    if (blurTimer.current) clearTimeout(blurTimer.current);
    if (
      filteredSaved.length > 0 ||
      (includeAddressSuggestions && value.trim().length >= 3 && apiSuggestions.length > 0)
    ) {
      setOpen(true);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && totalRows > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (h < 0 ? 0 : (h + 1) % totalRows));
      return;
    }
    if (!open || totalRows === 0) {
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? totalRows - 1 : h - 1));
      return;
    }
    if (e.key === "Enter" && highlight >= 0 && highlight < totalRows) {
      e.preventDefault();
      pickRow(rows[highlight]);
    }
  };

  const rowKey = (row: CombinedRow, i: number) =>
    row.kind === "saved" ? `saved-${row.saved.id}` : `api-${row.api.lat}-${row.api.lng}-${i}`;

  const formatRow = (row: CombinedRow) =>
    row.kind === "saved" ? formatSavedRow(row.saved) : row.api.label;

  return (
    <div className="address-autocomplete stop-place-combobox">
      <input
        id={inputId}
        type="text"
        className={className}
        value={value}
        onChange={(e) => onTypingChange(e.target.value)}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open && totalRows > 0}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {includeAddressSuggestions && loading && value.trim().length >= 3 && (
        <span className="address-autocomplete-hint" aria-live="polite">
          Looking up places…
        </span>
      )}
      {open && totalRows > 0 && (
        <ul
          id={listboxId}
          className="address-autocomplete-list"
          role="listbox"
          aria-label={listboxAriaLabel}
        >
          {rows.map((row, i) => {
            const showDivider = row.kind === "api" && i > 0 && rows[i - 1].kind === "saved";
            return (
              <li
                key={rowKey(row, i)}
                role="option"
                aria-selected={i === highlight}
                className={`address-autocomplete-item ${i === highlight ? "address-autocomplete-item-active" : ""} ${showDivider ? "address-autocomplete-item-section-start" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  pickRow(row);
                }}
              >
                {formatRow(row)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
