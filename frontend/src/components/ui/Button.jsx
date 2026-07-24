import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  className = "",
  leftIcon = null,
  rightIcon = null,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 select-none";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Mappings using your CSS variables for seamless dark/light mode
  const variants = {
    primary:
      "bg-[var(--primary)] text-white border-transparent hover:opacity-90 focus:ring-[var(--primary)]",
    danger:
      "bg-[var(--danger)] text-white border-transparent hover:opacity-90 focus:ring-[var(--danger)]",
    success:
      "bg-[var(--success)] text-white border-transparent hover:opacity-90 focus:ring-[var(--success)]",
    outline:
      "bg-transparent text-[var(--text)] border border-[var(--border)] hover:bg-[var(--hover)] focus:ring-[var(--border)]",
    ghost:
      "bg-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] focus:ring-[var(--hover)]",
    secondary:
      "bg-[var(--card)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--hover)] focus:ring-[var(--border)]",
    soft: "bg-[var(--hover)] text-[var(--text)] border border-transparent hover:bg-[color:rgba(37,99,235,0.1)]", // Subtle tint
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...props}
      className={`
        ${baseClasses} 
        ${sizes[size]} 
        ${variants[variant]} 
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
