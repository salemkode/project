import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, icon: Icon, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
      {(title || Icon) && (
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
} 