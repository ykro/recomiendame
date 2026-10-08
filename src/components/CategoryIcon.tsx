import React from 'react';
import type { CategoryType } from '../types';

interface CategoryIconProps {
  category: CategoryType;
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 'md' }) => {
  const containerClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }[size];

  const iconClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  // Specific muted color accents per category for the circle background
  const theme = {
    comer: 'bg-[#F2ECE4] text-[#A05C2F]',
    cafe: 'bg-[#EFEAE6] text-[#7C5335]',
    salir: 'bg-[#EDE8F5] text-[#5D478B]',
    paseo: 'bg-[#E3EFEA] text-[#1F6F5C]',
  }[category] || 'bg-neutral-100 text-[#1F2328]';

  return (
    <div
      className={`${containerClasses} ${theme} rounded-full flex items-center justify-center shrink-0`}
      aria-label={category}
    >
      {category === 'comer' && (
        <svg
          className={iconClasses}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Utensils */}
          <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
          <path d="M15 11v11" />
          <path d="M5 2v8a2.5 2.5 0 0 0 5 0V2" />
          <path d="M7.5 12.5V22" />
        </svg>
      )}

      {category === 'cafe' && (
        <svg
          className={iconClasses}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Coffee cup */}
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      )}

      {category === 'salir' && (
        <svg
          className={iconClasses}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Glass / Cocktail */}
          <path d="M8 22h8" />
          <path d="M12 11v11" />
          <path d="m19 3-7 8-7-8Z" />
        </svg>
      )}

      {category === 'paseo' && (
        <svg
          className={iconClasses}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Trees / Outdoor nature */}
          <path d="M10 10v11" />
          <path d="M14 14v7" />
          <path d="M4 14a4 4 0 0 1 8-2 4 4 0 0 1 8 2" />
          <path d="M7 10a5 5 0 0 1 10 0" />
        </svg>
      )}
    </div>
  );
};

export function getCategoryLabel(category: CategoryType): string {
  switch (category) {
    case 'comer':
      return 'Comer';
    case 'cafe':
      return 'Café';
    case 'salir':
      return 'Salir';
    case 'paseo':
      return 'Paseo';
  }
}

export function formatPrice(price: number): string {
  if (price === 3) return '$$$';
  if (price === 2) return '$$';
  return '$';
}

export function formatRating(rating: number): string {
  return Number(rating).toFixed(1).replace('.', ',');
}
