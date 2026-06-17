import React, { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline';

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
  
  const baseStyles = "font-medium py-3 px-6 rounded-xl transition duration-200 transform hover:-translate-y-1 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-olive hover:bg-[#5a6a46] text-brand-cream hover:shadow-[0_4px_20px_rgba(75,90,58,0.4)]",
    secondary: "bg-brand-sage hover:bg-[#8da379] text-brand-cream hover:shadow-[0_4px_20px_rgba(125,143,106,0.4)]",
    accent: "bg-brand-warm hover:bg-[#b87c47] text-brand-cream hover:shadow-[0_4px_20px_rgba(161,107,61,0.4)]",
    outline: "border-2 border-brand-sage text-brand-cream hover:bg-brand-sage/20",
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
