import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass' | 'outline' | 'neon';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  size = 'md',
  ...props 
}) => {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
  };

  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-3xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent active:scale-95 tracking-wide";
  
  const variants = {
    // Primary gradient
    primary: "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-violet-900/20 border border-white/10",
    
    // Glassy
    secondary: "bg-white/10 backdrop-blur-md text-white border border-white/5 hover:bg-white/20",
    
    // Danger
    danger: "bg-red-500/10 text-red-200 border border-red-500/10 hover:bg-red-500/20",
    
    // Ghost
    ghost: "text-white/60 hover:bg-white/5 hover:text-white",
    
    // Pure Glass
    glass: "bg-white/5 backdrop-blur-sm border border-white/5 text-white hover:bg-white/10 shadow-sm",
    
    // Outline
    outline: "bg-transparent border border-white/20 text-white hover:border-violet-500/50 hover:text-violet-400",

    // Neon Action
    neon: "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/50 hover:bg-blue-400"
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`} 
      {...props}
    >
      {icon && <span className={size === 'sm' ? "w-4 h-4" : "w-5 h-5"}>{icon}</span>}
      {children}
    </button>
  );
};