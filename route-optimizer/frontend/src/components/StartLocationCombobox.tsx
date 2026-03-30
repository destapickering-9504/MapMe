import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { fetchAddressSuggestions, type AddressSuggestion } from "../api/addressSuggestClient";
import { savedStartToOriginQuery, type SavedStartLocation } from "../domain/savedStartLocations";

const DEBOUNCE_MS = 280;
const BLUR_CLOSE_MS = 200;

type RowKind = "saved" | "api";

type CombinedRow =
  | { kind: "saved"; saved: SavedStartLocation }
  | { kind: "api"; api: AddressSuggestion };

interface Props {
  value: string;
  onChange: (value: string) => void;
  savedStarts: SavedStartLocation[];
  inputId: string;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
}

function savedMatchesQuery(s: SavedStartLocation, needle: string): boolean {
  if (!needle) return true;
  const n = needle.toLowerCase();
  return (
    s.label.toLowerCase().includes(n) ||
    (s.address || "").toLowerCase().includes(n) ||
    (s.query || "").toLowerCase().includes(n)
  );
}

export default function StartLocationCombobox({
  value,
  onChange,
  savedStarts,
  inputId,
  placeholder,
  ariaLabel,
  className = "input-field"
}: Props) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<AddressSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputFocusedRef = useRef(false);
  /** After picking a row, `totalRows` may stay > 0 while input stays focused — do not reopen the list. */
  const suppressOpenFromRowsEffectRef = useRef(false);

  const filteredSaved = useMemo(
    () => savedStarts.filter((s) => savedMatchesQuery(s, value.trim())),
    [savedStarts, value]
  );

  const runSuggest = useCallback((q: string) => {
    if (q.trim().length < 3) {
      setApiSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAddressSuggestions(q)
      .then((rows) => {
        setApiSuggestions(rows);
      })
      .catch(() => {
        setApiSuggestions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runSuggest(value), DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value, runSuggest]);

  const rows: CombinedRow[] = useMemo(() => {
    const out: CombinedRow[] = [];
    for (const s of filteredSaved) out.push({ kind: "saved", saved: s });
    for (const a of apiSuggestions) out.push({ kind: "api", api: a });
    return out;
  }, [filteredSaved, apiSuggestions]);

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
      onChange(savedStartToOriginQuery(row.saved));
    } else {
      onChange(row.api.label);
    }
    setApiSuggestions([]);
    suppressOpenFromRowsEffectRef.current = true;
    close();
  };

  const onInputBlur = () => {
    inputFocusedRef.current = false;
    blurTimer.current = setTimeout(() => {
      close();
    }, BLUR_CLOSE_MS);
  };

  const onInputFocus = () => {
    inputFocusedRef.current = true;
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
    }
    if (filteredSaved.length > 0 || (value.trim().length >= 3 && apiSuggestions.length > 0)) {
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

  const formatRow = (row: CombinedRow) => {
    if (row.kind === "saved") {
      const line = (row.saved.address || row.saved.query).trim();
      const short = line.length > 52 ? `${line.slice(0, 52)}…` : line;
      return `${row.saved.label} — ${short}`;
    }
    return row.api.label;
  };

  return (
    <div className="address-autocomplete start-location-combobox">
      <input
        id={inputId}
        type="text"
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
      {loading && value.trim().length >= 3 && (
        <span className="address-autocomplete-hint" aria-live="polite">
          Looking up addresses…
        </span>
      )}
      {open && totalRows > 0 && (
        <ul
          id={listboxId}
          className="address-autocomplete-list"
          role="listbox"
          aria-label="Starting location suggestions"
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
