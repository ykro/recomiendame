import React from 'react';

interface BookmarkButtonProps {
  isSaved: boolean;
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  isSaved,
  onToggle,
  className = '',
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6F5C] ${
        isSaved
          ? 'text-[#1F6F5C] hover:bg-[#1F6F5C]/10'
          : 'text-[#8C929D] hover:text-[#1F2328] hover:bg-black/5'
      } ${className}`}
      aria-label={isSaved ? 'Quitar de Quiero ir' : 'Guardar en Quiero ir'}
      title={isSaved ? 'Quitar de Quiero ir' : 'Guardar en Quiero ir'}
    >
      <svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
};
