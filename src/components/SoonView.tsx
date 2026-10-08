import React from 'react';

interface SoonViewProps {
  title: string;
  description: string;
}

export const SoonView: React.FC<SoonViewProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-3 animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[#1F6F5C]/10 text-[#1F6F5C] flex items-center justify-center">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#1F2328]">{title}</h2>
      <p className="text-sm text-[#656D76] max-w-xs">{description}</p>
      <div className="pt-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#1F6F5C]/10 text-[#1F6F5C]">
          Muy pronto
        </span>
      </div>
    </div>
  );
};
