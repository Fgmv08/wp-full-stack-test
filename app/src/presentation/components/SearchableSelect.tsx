import React, { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  options,
  placeholder = 'Buscar o seleccionar...',
  disabled = false,
  error,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync input query with selected value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset query to current value if closed without selection
        setQuery(value || '');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [value]);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setQuery(option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-300 mb-1 tracking-wide">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all pr-10 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500'
              : 'border-slate-800 focus:border-indigo-500/80'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200 transition"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full mt-1.5 max-h-48 overflow-y-auto rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl py-1 text-sm divide-y divide-slate-800/40">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`px-3.5 py-2 cursor-pointer transition text-xs font-medium flex items-center justify-between ${
                  opt === value
                    ? 'bg-indigo-600/30 text-indigo-300 font-bold'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{opt}</span>
                {opt === value && (
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            ))
          ) : (
            <li className="px-3.5 py-2.5 text-xs text-slate-400 text-center italic">
              No se encontraron resultados
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
