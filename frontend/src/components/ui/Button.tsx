import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  
  const baseStyles = "font-medium py-2.5 px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md border border-transparent",
    secondary: "bg-zinc-800 hover:bg-zinc-900 text-white shadow-sm hover:shadow-md border border-transparent",
    accent: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md border border-transparent",
    outline: "bg-transparent border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md border border-transparent",
  };

  const widthClass = fullWidth ? "w-full" : "w-auto";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
