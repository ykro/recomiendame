import React, { useMemo, useState } from 'react';
import type { CategoryType, FilterState, Recommendation } from '../types';
import { calculateAverageRating } from '../types';
import { RecommendationItem } from './RecommendationItem';
import { FilterBottomSheet } from './FilterBottomSheet';
import { useAuth } from '../context/AuthContext';
import { seedExampleRecommendations, EXAMPLE_RECOMMENDATION_NAMES } from '../services/recommendations';

interface ExplorarViewProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  savedIds?: Set<string>;
  onSelectItem: (item: Recommendation) => void;
  onToggleSave?: (item: Recommendation) => void;
  onOpenNewRecommendation: () => void;
}

export const ExplorarView: React.FC<ExplorarViewProps> = ({
  recommendations,
  isLoading,
  savedIds,
  onSelectItem,
  onToggleSave,
  onOpenNewRecommendation,
}) => {
  const { user, isAdmin, signInWithGoogle } = useAuth();

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Category ('todas' or specific category)
  const [selectedCategory, setSelectedCategory] = useState<'todas' | CategoryType>('todas');

  // Filter bottom sheet state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    zone: '',
    price: 0,
    sortBy: 'recientes',
  });

  // Admin seeding in empty state
  const [isSeeding, setIsSeeding] = useState(false);

  // Available unique zones
  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    recommendations.forEach((r) => {
      if (r.zone) zones.add(r.zone);
    });
    return Array.from(zones).sort();
  }, [recommendations]);

  // Check if example names are already present
  const examplesAlreadyLoaded = useMemo(() => {
    return recommendations.some((r) => EXAMPLE_RECOMMENDATION_NAMES.includes(r.name));
  }, [recommendations]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...recommendations];

    // Filter by category
    if (selectedCategory !== 'todas') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query (name, zone, whatToOrder)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.zone.toLowerCase().includes(q) ||
          item.whatToOrder.toLowerCase().includes(q)
      );
    }

    // Filter by zone
    if (filters.zone) {
      result = result.filter((item) => item.zone.toLowerCase() === filters.zone.toLowerCase());
    }

    // Filter by price
    if (filters.price !== 0) {
      result = result.filter((item) => item.price === filters.price);
    }

    // Sort order
    if (filters.sortBy === 'recientes') {
      result.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    } else if (filters.sortBy === 'calificadas') {
      result.sort((a, b) => calculateAverageRating(b) - calculateAverageRating(a));
    }

    return result;
  }, [recommendations, selectedCategory, searchQuery, filters]);

  const handleSeedExamples = async () => {
    if (!user || isSeeding || examplesAlreadyLoaded) return;
    setIsSeeding(true);
    try {
      await seedExampleRecommendations(user.uid, user.displayName || 'Administradora');
    } catch (err) {
      console.error('Error al cargar ejemplos:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handlePlusClick = () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    onOpenNewRecommendation();
  };

  const categories: Array<{ id: 'todas' | CategoryType; label: string }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'comer', label: 'Comer' },
    { id: 'cafe', label: 'Café' },
    { id: 'salir', label: 'Salir' },
    { id: 'paseo', label: 'Paseo' },
  ];

  const hasActiveFilters = Boolean(filters.zone || filters.price !== 0 || filters.sortBy !== 'recientes');

  return (
    <div className="pb-28 min-h-screen">
      {/* Search and Filter row */}
      <div className="sticky top-[57px] z-20 bg-[#F7F7F5] px-4 pt-3 pb-2 space-y-2.5 border-b border-[#EAEAE6]">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {/* Search Input */}
          <div className="relative flex-1">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, zona o plato..."
              className="w-full min-h-[44px] pl-10 pr-9 rounded-2xl bg-white border border-[#E5E5E0] text-sm text-[#1F2328] placeholder-[#8C929D] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#8C929D] hover:text-[#1F2328]"
                aria-label="Limpiar búsqueda"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter button 44px */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`min-w-[44px] min-h-[44px] rounded-2xl flex items-center justify-center border transition-all active:scale-95 shadow-2xs ${
              hasActiveFilters
                ? 'bg-[#1F6F5C] border-[#1F6F5C] text-white'
                : 'bg-white border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
            }`}
            aria-label="Abrir filtros"
          >
            <div className="relative">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#C98A0B] rounded-full ring-2 ring-white" />
              )}
            </div>
          </button>
        </div>

        {/* Categories horizontal scroll row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-md mx-auto -mx-1 px-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-[#1F6F5C] text-white shadow-xs'
                    : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List */}
      <div className="max-w-md mx-auto">
        {isLoading && recommendations.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#8C929D]">
            <div className="w-6 h-6 border-2 border-[#1F6F5C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Cargando recomendaciones...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1F6F5C]/10 text-[#1F6F5C] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#1F2328]">
              {recommendations.length === 0
                ? 'Aún no hay recomendaciones'
                : 'No se encontraron lugares'}
            </h3>
            <p className="text-xs text-[#656D76] max-w-xs mx-auto">
              {recommendations.length === 0
                ? 'Sé la primera persona en compartir un lugar favorito o carga ejemplos si eres administradora.'
                : 'Intenta cambiar los filtros o el término de búsqueda.'}
            </p>

            {/* If feed is empty and admin is signed in, show "Cargar ejemplos" right here */}
            {recommendations.length === 0 && isAdmin && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSeeding || examplesAlreadyLoaded}
                  onClick={handleSeedExamples}
                  className={`min-h-[44px] px-5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 ${
                    examplesAlreadyLoaded
                      ? 'bg-neutral-100 text-[#8C929D] cursor-not-allowed border border-[#E5E5E0]'
                      : 'bg-[#1F6F5C] text-white hover:bg-[#185949] active:scale-95 shadow-xs'
                  }`}
                >
                  {isSeeding ? (
                    <span>Cargando ejemplos...</span>
                  ) : examplesAlreadyLoaded ? (
                    <span>Ya cargados</span>
                  ) : (
                    <span>Cargar ejemplos</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white divide-y divide-[#EAEAE6] border-y border-[#EAEAE6]">
            {filteredItems.map((item) => (
              <RecommendationItem
                key={item.id}
                item={item}
                isSaved={savedIds?.has(item.id)}
                onToggleSave={onToggleSave}
                onClick={onSelectItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating round action button with + (min 44px -> 56x56px) */}
      <div className="fixed bottom-20 right-4 z-20 sm:right-[calc(50%-220px+16px)]">
        <button
          type="button"
          onClick={handlePlusClick}
          className="w-14 h-14 rounded-full bg-[#1F6F5C] text-white flex items-center justify-center shadow-lg hover:bg-[#185949] active:scale-95 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1F6F5C]/30"
          aria-label="Recomendar un lugar"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        availableZones={availableZones}
      />
    </div>
  );
};
