import React from 'react';
import type { Recommendation } from '../types';
import { calculateAverageRating, getTotalRatingsCount } from '../types';
import { CategoryIcon, formatPrice, formatRating } from './CategoryIcon';
import { BookmarkButton } from './BookmarkButton';

interface RecommendationItemProps {
  item: Recommendation;
  isSaved?: boolean;
  onToggleSave?: (item: Recommendation) => void;
  onClick: (item: Recommendation) => void;
}

export const RecommendationItem: React.FC<RecommendationItemProps> = ({
  item,
  isSaved = false,
  onToggleSave,
  onClick,
}) => {
  const average = calculateAverageRating(item);
  const totalRatings = getTotalRatingsCount(item);

  return (
    <div className="w-full min-h-[58px] py-2 px-4 flex items-center gap-3 hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors border-b border-[#EAEAE6] last:border-b-0">
      {/* Clickable Area for Detail */}
      <button
        type="button"
        onClick={() => onClick(item)}
        className="flex-1 min-w-0 py-1 text-left flex items-center gap-3.5 focus:outline-none focus-visible:bg-[#1F6F5C]/5"
        aria-label={`Ver detalles de ${item.name}`}
      >
        {/* Category icon inside circle */}
        <CategoryIcon category={item.category} size="md" />

        {/* Main info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#1F2328] truncate tracking-tight">
              {item.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#656D76]">
            <span className="truncate">{item.zone}</span>
            <span className="text-[#B0B4BA] select-none">·</span>
            <span className="font-medium text-[#1F2328] shrink-0 tracking-wider">
              {formatPrice(item.price)}
            </span>
            <span className="text-[#B0B4BA] select-none">·</span>
            {/* Promedio con una estrella y N entre paréntesis */}
            <div className="inline-flex items-center gap-1 shrink-0 font-medium text-[#1F2328]">
              <svg
                className="w-3.5 h-3.5 fill-[#C98A0B] text-[#C98A0B] shrink-0"
                viewBox="0 0 24 24"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{formatRating(average)}</span>
              <span className="text-[#656D76] font-normal text-[11px]">({totalRatings})</span>
            </div>
          </div>
        </div>
      </button>

      {/* Bookmark Marker Button (at least 44px) */}
      {onToggleSave && (
        <div className="shrink-0 -mr-1">
          <BookmarkButton
            isSaved={isSaved}
            onToggle={(e) => {
              e.stopPropagation();
              onToggleSave(item);
            }}
          />
        </div>
      )}
    </div>
  );
};
