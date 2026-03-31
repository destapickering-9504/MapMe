import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { ProfileSavedPlace } from "../domain/profileSavedPlaces";

const BLUR_CLOSE_MS = 200;

interface Props {
  value: string;
  savedPlaces: ProfileSavedPlace[];
  inputId: string;
  ariaLabel: string;
  listboxAriaLabel?: string;
  placeholder?: string;
  className?: string;
  onTypingChange: (name: string) => void;
  onPickSaved: (loc: ProfileSavedPlace) => void;
}

function savedMatchesQuery(s: ProfileSavedPlace, needle: string): boolean {
  if (!needle) return true;
  const n = needle.toLowerCase();
  return (
    s.label.toLowerCase().includes(n) ||
    s.address.toLowerCase().includes(n) ||
    (s.query || "").toLowerCase().includes(n)
  );
}

function formatSavedRow(s: ProfileSavedPlace): string {
  const line = s.address.trim();
  const short = line.length > 52 ? `${line.slice(0, 52)}…` : line;
  return `${s.label} — ${short}`;
}

export default function StopPlaceCombobox({
  value,
  savedPlaces,
  inputId,
  ariaLabel,
  listboxAriaLabel = "Place suggestions",
  placeholder,
  className = "input-field",
  onTypingChange,
  onPickSaved
}: Props) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputFocusedRef = useRef(false);
  const suppressOpenFromRowsEffectRef = useRef(false);

  const filteredSaved = useMemo(
    () => savedPlaces.filter((s) => savedMatchesQuery(s, value.trim())),
    [savedPlaces, value]
  );

  const totalRows = filteredSaved.length;

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

  const pickSaved = (s: ProfileSavedPlace) => {
    onPickSaved(s);
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
    if (filteredSaved.length > 0) {
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
      pickSaved(filteredSaved[highlight]);
    }
  };

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
      {open && totalRows > 0 && (
        <ul
          id={listboxId}
          className="address-autocomplete-list"
          role="listbox"
          aria-label={listboxAriaLabel}
        >
          {filteredSaved.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === highlight}
              className={`address-autocomplete-item ${i === highlight ? "address-autocomplete-item-active" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(ev) => {
                ev.preventDefault();
                pickSaved(s);
              }}
            >
              {formatSavedRow(s)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
