import React, { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <label className="text-sm text-brand-sage font-medium">{label}</label>
      <input 
        className="bg-[#2D2117] border border-brand-sage/50 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition duration-200 w-full placeholder-brand-sage/60"
        {...props}
      />
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <label className="text-sm text-brand-sage font-medium">{label}</label>
      <select 
        className="bg-[#2D2117] border border-brand-sage/50 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm focus:ring-1 focus:ring-brand-warm transition duration-200 w-full appearance-none"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
