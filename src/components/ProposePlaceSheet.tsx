import React, { useMemo, useState } from 'react';
import type { CategoryType, Recommendation } from '../types';
import { CategoryIcon, formatPrice, formatRating } from './CategoryIcon';

interface ProposePlaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: Recommendation[];
  existingOptionIds: Set<string>;
  onPropose: (place: Recommendation) => Promise<void>;
}

export const ProposePlaceSheet: React.FC<ProposePlaceSheetProps> = ({
  isOpen,
  onClose,
  recommendations,
  existingOptionIds,
  onPropose,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'todas' | CategoryType>('todas');
  const [proposingId, setProposingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSearch('');
      setCategory('todas');
      setProposingId(null);
    }
  }, [isOpen]);

  const filteredPlaces = useMemo(() => {
    let result = [...recommendations];
    if (category !== 'todas') {
      result = result.filter((r) => r.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.zone.toLowerCase().includes(q) ||
          r.whatToOrder.toLowerCase().includes(q)
      );
    }
    return result;
  }, [recommendations, category, search]);

  if (!isOpen) return null;

  const handleSelect = async (place: Recommendation) => {
    if (existingOptionIds.has(place.id) || proposingId) return;
    setProposingId(place.id);
    try {
      await onPropose(place);
      onClose();
    } catch (err) {
      console.error('Error proponiendo lugar:', err);
    } finally {
      setProposingId(null);
    }
  };

  const categories: Array<{ id: 'todas' | CategoryType; label: string }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'comer', label: 'Comer' },
    { id: 'cafe', label: 'Café' },
    { id: 'salir', label: 'Salir' },
    { id: 'paseo', label: 'Paseo' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#F7F7F5] rounded-t-3xl sm:rounded-2xl border border-[#E5E5E0] shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-2 border-b border-[#EAEAE6] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1F2328]">Proponer lugar</h2>
            <p className="text-xs text-[#656D76]">Elige un lugar para que el grupo vote</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#656D76] hover:text-[#1F2328]"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 space-y-2 border-b border-[#EAEAE6] shrink-0 bg-[#F7F7F5]">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C929D] pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar entre las recomendaciones..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white border border-[#E5E5E0] text-sm text-[#1F2328] placeholder-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  category === c.id
                    ? 'bg-[#1F6F5C] text-white shadow-xs'
                    : 'bg-white border border-[#E5E5E0] text-[#1F2328]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Place list */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#EAEAE6] bg-white">
          {filteredPlaces.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#656D76]">
              No se encontraron recomendaciones con ese nombre o categoría.
            </div>
          ) : (
            filteredPlaces.map((place) => {
              const alreadyProposed = existingOptionIds.has(place.id);
              const isCurrentProposing = proposingId === place.id;
              return (
                <button
                  key={place.id}
                  type="button"
                  disabled={alreadyProposed || isCurrentProposing}
                  onClick={() => handleSelect(place)}
                  className={`w-full min-h-[58px] p-3.5 text-left flex items-center justify-between gap-3 transition-colors ${
                    alreadyProposed
                      ? 'opacity-50 bg-[#F7F7F5] cursor-not-allowed'
                      : 'hover:bg-[#F7F7F5] active:bg-[#EFEFEA]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon category={place.category} size="sm" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[#1F2328] truncate">
                        {place.name}
                      </h4>
                      <p className="text-xs text-[#656D76] truncate">
                        {place.zone} · {formatPrice(place.price)} · ★ {formatRating(place.rating)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {alreadyProposed ? (
                      <span className="text-[11px] font-semibold text-[#8C929D] px-2 py-1 rounded-md bg-neutral-200">
                        Ya propuesto
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#1F6F5C] px-3 py-1.5 rounded-xl bg-[#1F6F5C]/10">
                        {isCurrentProposing ? 'Agregando...' : '+ Proponer'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
