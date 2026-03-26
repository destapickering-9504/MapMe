import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { fetchAddressSuggestions, type AddressSuggestion } from "../api/addressSuggestClient";

interface Props {
  inputId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
}

const DEBOUNCE_MS = 280;
const BLUR_CLOSE_MS = 200;

export default function AddressAutocomplete({
  inputId,
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "input-field"
}: Props) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputFocusedRef = useRef(false);

  const runSuggest = useCallback((q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAddressSuggestions(q)
      .then((rows) => {
        setSuggestions(rows);
        setHighlight(rows.length > 0 ? 0 : -1);
      })
      .catch(() => {
        setSuggestions([]);
        setHighlight(-1);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      runSuggest(value);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, runSuggest]);

  const close = () => {
    setOpen(false);
    setHighlight(-1);
  };

  const pick = (s: AddressSuggestion) => {
    onChange(s.label);
    setSuggestions([]);
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
    if (suggestions.length > 0) {
      setOpen(true);
    }
  };

  useEffect(() => {
    if (suggestions.length > 0 && inputFocusedRef.current) {
      setOpen(true);
    }
  }, [suggestions]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && suggestions.length > 0) {
      setOpen(true);
    }
    if (!open || suggestions.length === 0) {
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
      return;
    }
    if (e.key === "Enter" && highlight >= 0 && highlight < suggestions.length) {
      e.preventDefault();
      pick(suggestions[highlight]);
    }
  };

  return (
    <div className="address-autocomplete">
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
        aria-expanded={open && suggestions.length > 0}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {loading && value.trim().length >= 3 && (
        <span className="address-autocomplete-hint" aria-live="polite">
          Looking up addresses…
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          className="address-autocomplete-list"
          role="listbox"
          aria-label="Address suggestions"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lng}-${i}`}
              role="option"
              aria-selected={i === highlight}
              className={`address-autocomplete-item ${i === highlight ? "address-autocomplete-item-active" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(ev) => {
                ev.preventDefault();
                pick(s);
              }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
