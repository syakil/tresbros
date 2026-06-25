import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'olive' | 'warm' | 'default';
}

export function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  const baseStyles = "p-5 rounded-2xl transition duration-300";
  
  const variants = {
    default: "bg-white border border-zinc-200 shadow-sm",
    olive: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 cursor-pointer hover:border-emerald-500 shadow-sm",
    warm: "bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 cursor-pointer hover:border-blue-500 shadow-sm"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
