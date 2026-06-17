import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'olive' | 'warm' | 'default';
}

export function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  const baseStyles = "p-5 rounded-2xl shadow-lg backdrop-blur-sm transition duration-300";
  
  const variants = {
    default: "bg-black/20 border border-white/5",
    olive: "bg-gradient-to-br from-[#4B5A3A]/20 to-[#4B5A3A]/5 border border-brand-olive/40 cursor-pointer hover:border-brand-olive",
    warm: "bg-gradient-to-br from-[#A16B3D]/20 to-[#A16B3D]/5 border border-brand-warm/40 cursor-pointer hover:border-brand-warm"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
