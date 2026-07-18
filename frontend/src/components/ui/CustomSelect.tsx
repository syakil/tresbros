"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowDownToLine, Check, Search } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  className?: string;
  placeholder?: string;
  searchable?: boolean;
}

export function CustomSelect({ value, onChange, options, className = '', placeholder = 'Pilih...', searchable = true }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [options, searchQuery, searchable]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      // Small timeout to ensure element is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left flex items-center justify-between focus:outline-none transition-all duration-200 ${className} ${isOpen ? 'ring-1 ring-blue-600 border-blue-600' : ''}`}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ArrowDownToLine className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {searchable && (
            <div className="px-3 pb-2 pt-1 border-b border-zinc-100 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto custom-scrollbar-light">
            {filteredOptions.length === 0 ? (
              <li className="py-3 px-4 text-sm text-zinc-500 text-center">
                Tidak ditemukan
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={`relative cursor-pointer select-none py-2.5 pl-4 pr-10 text-zinc-700 hover:bg-zinc-50 transition-colors text-sm ${
                    value === option.value ? 'bg-blue-50/50 font-medium text-blue-600' : ''
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <span className="block truncate">{option.label}</span>
                  {value === option.value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
