import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  categories: string[];
  placeholder?: string;
  className?: string;
}

export default function CategoryCombobox({
  value,
  onChange,
  categories,
  placeholder = 'Select or type a category…',
  className = '',
}: Props) {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState(value);
  const containerRef          = useRef<HTMLDivElement>(null);

  // Sync input when value changes from outside
  useEffect(() => { setInput(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed  = input.trim();
  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(trimmed.toLowerCase()),
  );
  const isNew = trimmed !== '' && !categories.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase(),
  );

  function select(cat: string) {
    setInput(cat);
    onChange(cat);
    setOpen(false);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setInput(v);
    onChange(v);
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Enter' && trimmed) {
      if (filtered.length === 1) select(filtered[0]);
      else if (isNew) { onChange(trimmed); setOpen(false); }
      e.preventDefault();
    }
  }

  const showList = open && (filtered.length > 0 || isNew);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={input}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-800
          focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400
          bg-stone-50 focus:bg-white transition"
      />

      {/* Dropdown indicator */}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400 hover:text-stone-600"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 8L1 3h10z" />
        </svg>
      </button>

      {showList && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-stone-200
          rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(cat); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors
                  ${cat.toLowerCase() === trimmed.toLowerCase()
                    ? 'bg-amber-50 text-amber-800 font-semibold'
                    : 'text-stone-700 hover:bg-stone-50'
                  }`}
              >
                {cat}
              </button>
            </li>
          ))}
          {isNew && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(trimmed); }}
                className="w-full text-left px-3 py-2 text-sm text-amber-700 hover:bg-amber-50
                  border-t border-stone-100 flex items-center gap-2"
              >
                <span className="text-amber-500 font-bold">+</span>
                Add &ldquo;{trimmed}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
