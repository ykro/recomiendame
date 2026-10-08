import React, { useEffect, useState } from 'react';
import type { Recommendation } from '../types';
import { subscribeToModeration, moderateRecommendation } from '../services/recommendations';
import { CategoryIcon, formatPrice, formatRating } from './CategoryIcon';

interface ModeracionViewProps {
  onBack: () => void;
  onSelectItem?: (item: Recommendation) => void;
}

export const ModeracionView: React.FC<ModeracionViewProps> = ({ onBack, onSelectItem }) => {
  const [activeTab, setActiveTab] = useState<'reportadas' | 'ocultas'>('reportadas');
  const [items, setItems] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToModeration(
      (list) => {
        setItems(list);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error cargando moderación:', error);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const reportadas = items.filter((r) => r.status === 'reportada');
  const ocultas = items.filter((r) => r.status === 'oculta');
  const displayedItems = activeTab === 'reportadas' ? reportadas : ocultas;

  const handleModerate = async (id: string, newStatus: 'publicada' | 'oculta') => {
    setActionLoadingId(id);
    try {
      await moderateRecommendation(id, newStatus);
    } catch (err) {
      console.error('Error al moderar recomendación:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-full pb-24 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-[#F7F7F5]/95 backdrop-blur-md px-4 py-2 border-b border-[#EAEAE6] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] -ml-2 p-2 rounded-xl text-[#1F2328] hover:bg-black/5 active:scale-95 transition-all flex items-center gap-1 text-sm font-medium"
          aria-label="Volver a Perfil"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Perfil</span>
        </button>

        <h1 className="text-base font-bold text-[#1F2328]">Moderación</h1>
        <div className="w-8" />
      </div>

      {/* Tabs Row */}
      <div className="sticky top-[53px] z-10 bg-[#F7F7F5] px-4 py-2.5 border-b border-[#EAEAE6]">
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('reportadas')}
            className={`min-h-[44px] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'reportadas'
                ? 'bg-[#1F6F5C] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
            }`}
          >
            <span>Reportadas</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'reportadas'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {reportadas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ocultas')}
            className={`min-h-[44px] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'ocultas'
                ? 'bg-[#1F6F5C] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
            }`}
          >
            <span>Ocultas</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'ocultas'
                  ? 'bg-white/20 text-white'
                  : 'bg-neutral-200 text-[#1F2328]'
              }`}
            >
              {ocultas.length}
            </span>
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="max-w-md mx-auto">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2 text-[#8C929D]">
            <div className="w-6 h-6 border-2 border-[#1F6F5C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Cargando moderación...</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-2 text-[#656D76]">
            <p className="text-sm font-semibold text-[#1F2328]">
              {activeTab === 'reportadas'
                ? 'No hay recomendaciones reportadas'
                : 'No hay recomendaciones ocultas'}
            </p>
            <p className="text-xs max-w-xs mx-auto">
              {activeTab === 'reportadas'
                ? 'Los lugares que un miembro reporte aparecerán aquí para revisión.'
                : 'Los lugares que decidas ocultar se listarán aquí y dejarán de ser visibles en el feed.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAEAE6] bg-white border-b border-[#EAEAE6]">
            {displayedItems.map((r) => {
              const isBusy = actionLoadingId === r.id;
              return (
                <div key={r.id} className="p-4 space-y-3">
                  {/* Info row */}
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => onSelectItem?.(r)}
                  >
                    <CategoryIcon category={r.category} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#1F2328] truncate">
                          {r.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                            r.status === 'reportada'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-neutral-100 text-[#656D76] border border-neutral-200'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#656D76] mt-0.5">
                        {r.zone} · {formatPrice(r.price)} · ★ {formatRating(r.rating)}
                      </p>
                      <p className="text-xs text-[#656D76] mt-1">
                        Por <span className="font-semibold text-[#1F2328]">{r.authorName}</span>
                      </p>
                      {r.comment && (
                        <p className="text-xs text-[#1F2328] mt-1.5 line-clamp-2 italic bg-[#F7F7F5] p-2 rounded-xl">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Ocultar y Restaurar */}
                  <div className="flex gap-2 pt-1 border-t border-[#F0F0EC]">
                    <button
                      type="button"
                      disabled={isBusy || r.status === 'oculta'}
                      onClick={() => handleModerate(r.id, 'oculta')}
                      className={`flex-1 min-h-[44px] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        r.status === 'oculta'
                          ? 'bg-neutral-100 text-[#8C929D] cursor-not-allowed'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 active:scale-98 border border-red-200'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                      <span>{isBusy ? 'Guardando...' : 'Ocultar'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy || r.status === 'publicada'}
                      onClick={() => handleModerate(r.id, 'publicada')}
                      className={`flex-1 min-h-[44px] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        r.status === 'publicada'
                          ? 'bg-neutral-100 text-[#8C929D] cursor-not-allowed'
                          : 'bg-[#1F6F5C]/10 text-[#1F6F5C] hover:bg-[#1F6F5C]/20 active:scale-98 border border-[#1F6F5C]/20'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{isBusy ? 'Guardando...' : 'Restaurar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
