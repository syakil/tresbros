import React, { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <label className="text-sm text-zinc-600 font-medium">{label}</label>
      <input 
        className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition duration-200 w-full placeholder-zinc-400"
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
      <label className="text-sm text-zinc-600 font-medium">{label}</label>
      <select 
        className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition duration-200 w-full appearance-none"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
