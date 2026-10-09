import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export const SearchableSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  // Find currently selected option object
  const selectedOption = options.find((opt) => {
    const optVal = typeof opt === 'object' ? opt.value : opt;
    return String(optVal) === String(value);
  });

  const selectedLabel = selectedOption
    ? typeof selectedOption === 'object'
      ? selectedOption.label
      : selectedOption
    : '';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on typed search term
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const optLabel = typeof opt === 'object' ? opt.label : String(opt);
    const subLabel = typeof opt === 'object' && opt.sublabel ? String(opt.sublabel) : '';
    const term = searchTerm.toLowerCase();
    return optLabel.toLowerCase().includes(term) || subLabel.toLowerCase().includes(term);
  });

  const handleSelect = (option) => {
    const optVal = typeof option === 'object' ? option.value : option;
    if (onChange) {
      onChange({ target: { value: optVal } });
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { value: '' } });
    }
    setSearchTerm('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className={`w-full text-left ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          onClick={handleInputClick}
          className={`relative flex items-center w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm cursor-text transition-colors ${
            disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : ''
          } ${
            error
              ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-200'
              : 'border-slate-300 hover:border-slate-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            ref={inputRef}
            id={selectId}
            type="text"
            disabled={disabled}
            value={isOpen ? searchTerm : (selectedLabel || searchTerm)}
            onChange={handleInputChange}
            onFocus={() => {
              if (!disabled) setIsOpen(true);
            }}
            placeholder={isOpen && selectedLabel ? selectedLabel : placeholder}
            className="w-full bg-transparent border-none p-0 text-sm focus:outline-none placeholder:text-slate-400"
            autoComplete="off"
          />

          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) setIsOpen(!isOpen);
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Dropdown list */}
        {isOpen && !disabled && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-slate-400 text-center">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const optVal = typeof option === 'object' ? option.value : option;
                const optLabel = typeof option === 'object' ? option.label : option;
                const subLabel = typeof option === 'object' ? option.sublabel : null;
                const isSelected = String(optVal) === String(value);

                return (
                  <button
                    key={`${optVal}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="leading-snug">{optLabel}</div>
                      {subLabel && (
                        <div className="text-xs text-slate-400 font-normal">{subLabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};

export default SearchableSelect;
