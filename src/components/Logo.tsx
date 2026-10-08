import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const containerClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const iconSize = {
    sm: 18,
    md: 22,
    lg: 26,
  }[size];

  return (
    <div
      className={`${containerClasses} bg-[#1F6F5C] flex items-center justify-center shrink-0 shadow-sm`}
      aria-label="Logo de Recomiéndame"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* White map pin marker */}
        <path
          d="M12 2C7.58 2 4 5.58 4 10C4 15.25 12 22 12 22C12 22 20 15.25 20 10C20 5.58 16.42 2 12 2Z"
          fill="#FFFFFF"
        />
        {/* Golden star in center */}
        <path
          d="M12 6.5L13.1 8.7L15.5 9.1L13.8 10.7L14.2 13.1L12 11.9L9.8 13.1L10.2 10.7L8.5 9.1L10.9 8.7L12 6.5Z"
          fill="#C98A0B"
        />
      </svg>
    </div>
  );
};
