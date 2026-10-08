import React from 'react';
import type { FilterState, PriceLevel, SortOrder } from '../types';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  availableZones: string[];
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  availableZones,
}) => {
  const [selectedZone, setSelectedZone] = React.useState<string>(filters.zone);
  const [selectedPrice, setSelectedPrice] = React.useState<PriceLevel | 0>(filters.price);
  const [selectedSort, setSelectedSort] = React.useState<SortOrder>(filters.sortBy);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedZone(filters.zone);
      setSelectedPrice(filters.price);
      setSelectedSort(filters.sortBy);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters({
      zone: selectedZone,
      price: selectedPrice,
      sortBy: selectedSort,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedZone('');
    setSelectedPrice(0);
    setSelectedSort('recientes');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#F7F7F5] rounded-t-3xl border-t border-[#E5E5E0] p-5 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-250 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-[#D0D4DC] rounded-full mx-auto" />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1F2328]">Filtros</h2>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] px-2 text-xs font-medium text-[#656D76] hover:text-[#1F2328] flex items-center justify-center"
          >
            Restablecer
          </button>
        </div>

        {/* Zona */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
            Zona
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedZone('')}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs font-medium transition-all ${
                selectedZone === ''
                  ? 'bg-[#1F6F5C] text-white shadow-xs'
                  : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
              }`}
            >
              Todas las zonas
            </button>
            {availableZones.map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => setSelectedZone(zone)}
                className={`min-h-[44px] px-3.5 rounded-xl text-xs font-medium transition-all ${
                  selectedZone === zone
                    ? 'bg-[#1F6F5C] text-white shadow-xs'
                    : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Precio */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
            Precio
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedPrice(0)}
              className={`min-h-[44px] rounded-xl text-xs font-medium transition-all flex items-center justify-center ${
                selectedPrice === 0
                  ? 'bg-[#1F6F5C] text-white shadow-xs'
                  : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
              }`}
            >
              Todos
            </button>
            {([1, 2, 3] as PriceLevel[]).map((p) => {
              const label = p === 1 ? '$' : p === 2 ? '$$' : '$$$';
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPrice(p)}
                  className={`min-h-[44px] rounded-xl text-xs font-medium transition-all flex items-center justify-center ${
                    selectedPrice === p
                      ? 'bg-[#1F6F5C] text-white shadow-xs'
                      : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orden */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
            Orden
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedSort('recientes')}
              className={`min-h-[44px] px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center ${
                selectedSort === 'recientes'
                  ? 'bg-[#1F6F5C] text-white shadow-xs'
                  : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
              }`}
            >
              Más recientes
            </button>
            <button
              type="button"
              onClick={() => setSelectedSort('calificadas')}
              className={`min-h-[44px] px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center ${
                selectedSort === 'calificadas'
                  ? 'bg-[#1F6F5C] text-white shadow-xs'
                  : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
              }`}
            >
              Mejor calificadas
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleApply}
            className="w-full min-h-[44px] py-3 rounded-xl bg-[#1F6F5C] text-white font-semibold text-sm hover:bg-[#185949] active:scale-[0.99] transition-all shadow-xs"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
};
