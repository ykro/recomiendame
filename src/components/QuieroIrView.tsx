import React from 'react';
import type { Recommendation, SavedPlace } from '../types';
import { RecommendationItem } from './RecommendationItem';
import { useAuth } from '../context/AuthContext';

interface QuieroIrViewProps {
  savedPlaces: SavedPlace[];
  allRecommendations: Recommendation[];
  isLoading: boolean;
  onSelectItem: (item: Recommendation) => void;
  onToggleSave: (item: Recommendation) => void;
}

export const QuieroIrView: React.FC<QuieroIrViewProps> = ({
  savedPlaces,
  allRecommendations,
  isLoading,
  onSelectItem,
  onToggleSave,
}) => {
  const { user, signInWithGoogle } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-[#1F6F5C]/10 text-[#1F6F5C] flex items-center justify-center">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1F2328]">Quiero ir</h2>
        <p className="text-sm text-[#656D76] max-w-xs">
          Entra con tu cuenta de Google para guardar los lugares que quieres conocer y tener tu lista privada siempre a mano.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#1F6F5C] text-white text-sm font-semibold hover:bg-[#185949] active:scale-95 transition-all shadow-xs flex items-center gap-2"
        >
          <span>Entrar con Google</span>
        </button>
      </div>
    );
  }

  // Convert each saved place to Recommendation object (preferring full live recommendation from feed)
  const itemsToDisplay: Recommendation[] = savedPlaces.map((sp) => {
    const liveItem = allRecommendations.find((r) => r.id === sp.recommendationId);
    if (liveItem) return liveItem;

    // Fallback if recommendation is not in the current feed batch
    return {
      id: sp.recommendationId,
      name: sp.name,
      category: sp.category,
      zone: sp.zone,
      price: sp.price,
      rating: 5,
      whatToOrder: '',
      comment: '',
      authorId: '',
      authorName: '',
      status: 'publicada',
      reviewCount: 0,
      ratingSum: 0,
      createdAt: sp.savedAt,
    };
  });

  return (
    <div className="pb-28 min-h-screen animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="sticky top-[57px] z-20 bg-[#F7F7F5] px-5 py-3 border-b border-[#EAEAE6]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2328]">
            Lugares que quiero visitar
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1F6F5C]/10 text-[#1F6F5C]">
            {savedPlaces.length}
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {isLoading && savedPlaces.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#8C929D]">
            <div className="w-6 h-6 border-2 border-[#1F6F5C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Cargando tus lugares...</p>
          </div>
        ) : savedPlaces.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1F6F5C]/10 text-[#1F6F5C] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#1F2328]">
              No tienes lugares guardados
            </h3>
            <p className="text-xs text-[#656D76] max-w-xs mx-auto leading-relaxed">
              Toca el icono de marcador en cualquier recomendación para guardarla aquí y no olvidarte de ir.
            </p>
          </div>
        ) : (
          <div className="bg-white divide-y divide-[#EAEAE6] border-b border-[#EAEAE6]">
            {itemsToDisplay.map((item) => (
              <RecommendationItem
                key={item.id}
                item={item}
                isSaved={true}
                onToggleSave={onToggleSave}
                onClick={onSelectItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
