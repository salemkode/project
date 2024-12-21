import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

type ButtonBaseProps = {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: LucideIcon;
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
};

type ButtonAsButton = ButtonBaseProps & 
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    as?: 'button';
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> & {
    as: typeof Link;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({ 
  children, 
  variant = 'primary', 
  icon: Icon,
  isLoading,
  as: Component = 'button',
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold';
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };

  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      {...(Component === 'button' ? { type: 'button', disabled: isLoading } : {})}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </Component>
  );
} 