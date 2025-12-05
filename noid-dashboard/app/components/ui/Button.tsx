import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-noid-gold/50';

  const variantStyles = {
    primary: 'bg-gradient-gold text-noid-black hover:shadow-gold-glow',
    secondary: 'bg-noid-charcoal text-noid-white border border-noid-charcoal-light hover:border-noid-gold/30',
    ghost: 'text-noid-silver hover:text-noid-white hover:bg-noid-charcoal'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
