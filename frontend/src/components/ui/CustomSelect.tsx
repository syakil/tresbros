"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownToLine, Check } from 'lucide-react';

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
}

export function CustomSelect({ value, onChange, options, className = '', placeholder = 'Pilih...' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
        className={`w-full text-left flex items-center justify-between focus:outline-none transition-all duration-200 ${className} ${isOpen ? 'ring-1 ring-brand-warm border-brand-warm' : ''}`}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ArrowDownToLine className={`w-4 h-4 text-brand-sage transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#251b12] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <ul className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <li
                key={option.value}
                className={`relative cursor-pointer select-none py-2.5 pl-4 pr-10 text-brand-cream hover:bg-brand-warm/20 transition-colors ${
                  value === option.value ? 'bg-brand-warm/10 font-medium text-brand-warm' : ''
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="block truncate">{option.label}</span>
                {value === option.value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-brand-warm">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
