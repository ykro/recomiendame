import React, { useEffect, useMemo, useState } from 'react';
import type { GroupList, ListOption, ListVote, Recommendation } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToGroupList,
  subscribeToListOptions,
  subscribeToListVotes,
  voteForOption,
  removeVote,
  addOptionToList,
  deleteOptionFromList,
  deleteGroupList,
} from '../services/recommendations';
import { CategoryIcon, formatPrice } from './CategoryIcon';
import { ProposePlaceSheet } from './ProposePlaceSheet';

interface ListDetailViewProps {
  listId: string;
  onBack: () => void;
  allRecommendations: Recommendation[];
  onOpenRecommendation?: (item: Recommendation) => void;
}

export const ListDetailView: React.FC<ListDetailViewProps> = ({
  listId,
  onBack,
  allRecommendations,
  onOpenRecommendation,
}) => {
  const { user, signInWithGoogle } = useAuth();

  const [list, setList] = useState<GroupList | null>(null);
  const [options, setOptions] = useState<ListOption[]>([]);
  const [votes, setVotes] = useState<ListVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sheets and menus
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  // Subscribe to list document, options, and votes
  useEffect(() => {
    setIsLoading(true);
    const unsubList = subscribeToGroupList(listId, (fresh) => {
      setList(fresh);
      setIsLoading(false);
    });

    const unsubOptions = subscribeToListOptions(listId, (freshOptions) => {
      setOptions(freshOptions);
    });

    const unsubVotes = subscribeToListVotes(listId, (freshVotes) => {
      setVotes(freshVotes);
    });

    return () => {
      unsubList();
      unsubOptions();
      unsubVotes();
    };
  }, [listId]);

  const isOwner = Boolean(user && list && user.uid === list.ownerId);

  // Count votes per option
  const voteCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of votes) {
      map.set(v.optionId, (map.get(v.optionId) || 0) + 1);
    }
    return map;
  }, [votes]);

  // Current user's vote
  const myVotedOptionId = useMemo(() => {
    if (!user) return null;
    const v = votes.find((item) => item.userId === user.uid);
    return v ? v.optionId : null;
  }, [votes, user]);

  // Options sorted: highest vote count first!
  const sortedOptions = useMemo(() => {
    const arr = [...options];
    arr.sort((a, b) => {
      const countA = voteCounts.get(a.id) || 0;
      const countB = voteCounts.get(b.id) || 0;
      if (countB !== countA) return countB - countA;
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    return arr;
  }, [options, voteCounts]);

  const existingOptionIds = useMemo(() => {
    return new Set(options.map((o) => o.id));
  }, [options]);

  const handleToggleVote = async (optionId: string) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    try {
      if (myVotedOptionId === optionId) {
        // Tocar tu voto lo quita
        await removeVote(listId, user.uid);
      } else {
        // Tocar un lugar es votar (o cambiar tu voto)
        await voteForOption(listId, user.uid, optionId);
      }
    } catch (err) {
      console.error('Error votando:', err);
    }
  };

  const handlePropose = async (place: Recommendation) => {
    if (!user) return;
    await addOptionToList(
      listId,
      {
        id: place.id,
        name: place.name,
        category: place.category,
        zone: place.zone,
        price: place.price,
      },
      user.uid
    );
  };

  const handleDeleteList = async () => {
    try {
      await deleteGroupList(listId);
      onBack();
    } catch (err) {
      console.error('Error borrando lista:', err);
    }
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?lista=${listId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareWhatsApp = () => {
    const text = `¡Vota a dónde vamos! "${list?.title || 'Lista de lugares'}" 👉 ${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading && !list) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-2 text-[#8C929D]">
        <div className="w-6 h-6 border-2 border-[#1F6F5C] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Cargando lista...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="p-8 text-center space-y-3">
        <h3 className="text-base font-bold text-[#1F2328]">Esta lista no existe o ya no está disponible</h3>
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 rounded-xl bg-[#1F6F5C] text-white text-xs font-semibold"
        >
          Volver a Listas
        </button>
      </div>
    );
  }

  const totalVotesCount = votes.length;
  const memberCount = list.memberIds?.length || 1;

  return (
    <div className="min-h-full pb-28 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-[#F7F7F5]/95 backdrop-blur-md px-4 py-2 border-b border-[#EAEAE6] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] -ml-2 p-2 rounded-xl text-[#1F2328] hover:bg-black/5 active:scale-95 transition-all flex items-center gap-1 text-sm font-medium"
          aria-label="Volver a las listas"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Listas</span>
        </button>

        <div className="flex items-center gap-1">
          {/* Botón Compartir arriba */}
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="min-h-[44px] px-3 rounded-xl bg-[#1F6F5C]/10 text-[#1F6F5C] text-xs font-semibold hover:bg-[#1F6F5C]/20 active:scale-95 transition-all flex items-center gap-1.5"
            aria-label="Compartir lista con enlace"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Compartir</span>
          </button>

          {/* Menú de tres puntos con "Borrar lista" solo para la creadora */}
          {isOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl flex items-center justify-center text-[#1F2328] hover:bg-black/5 active:scale-95 transition-all"
                aria-label="Opciones de la lista"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-40 w-40 bg-white rounded-2xl shadow-xl border border-[#E5E5E0] py-1 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                      }}
                      className="w-full min-h-[44px] px-4 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                    >
                      <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Borrar lista</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-5 space-y-5">
        {/* Pregunta y métricas */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2328] leading-tight">
            {list.title}
          </h1>
          <p className="text-xs text-[#656D76] mt-1.5">
            {memberCount === 1 ? '1 persona' : `${memberCount} personas`} · {totalVotesCount === 1 ? '1 voto' : `${totalVotesCount} votos`}
          </p>
        </div>

        {/* Botón principal Proponer lugar */}
        <div>
          <button
            type="button"
            onClick={() => setIsProposeOpen(true)}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-[#1F6F5C] text-[#1F6F5C] bg-[#1F6F5C]/5 hover:bg-[#1F6F5C]/10 active:scale-[0.99] transition-all text-xs font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Proponer lugar</span>
          </button>
        </div>

        {/* Lista de lugares con barra y votos (el más votado arriba) */}
        <div className="space-y-2.5">
          {sortedOptions.length === 0 ? (
            <div className="p-8 text-center bg-white/50 rounded-2xl border border-[#EAEAE6] space-y-2">
              <p className="text-sm font-semibold text-[#1F2328]">
                Aún no hay lugares propuestos
              </p>
              <p className="text-xs text-[#656D76] max-w-xs mx-auto">
                Toca &ldquo;Proponer lugar&rdquo; para agregar opciones de la app y empezar a votar en grupo.
              </p>
            </div>
          ) : (
            sortedOptions.map((opt, index) => {
              const count = voteCounts.get(opt.id) || 0;
              const isMyVote = myVotedOptionId === opt.id;
              const percent = totalVotesCount > 0 ? Math.round((count / totalVotesCount) * 100) : 0;
              const isTop = index === 0 && count > 0;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleToggleVote(opt.id)}
                  role="button"
                  tabIndex={0}
                  className={`relative overflow-hidden rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                    isMyVote
                      ? 'border-[#1F6F5C] bg-[#1F6F5C]/5 ring-1 ring-[#1F6F5C]'
                      : 'border-[#EAEAE6] bg-white hover:border-[#1F6F5C]/40'
                  }`}
                >
                  {/* Visual Vote Progress Bar */}
                  {totalVotesCount > 0 && count > 0 && (
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-300 pointer-events-none ${
                        isTop ? 'bg-[#1F6F5C]/15' : 'bg-[#1F6F5C]/8'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  )}

                  {/* Option Content Row */}
                  <div className="relative z-10 min-h-[58px] p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <CategoryIcon category={opt.category} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#1F2328] truncate tracking-tight">
                            {opt.name}
                          </h3>
                          {isTop && (
                            <span className="text-[10px] font-bold text-[#C98A0B] bg-[#C98A0B]/15 px-1.5 py-0.5 rounded-md shrink-0">
                              Top
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#656D76] truncate">
                          {opt.zone} · {formatPrice(opt.price)}
                        </p>
                      </div>
                    </div>

                    {/* Vote status and count */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {isMyVote && (
                        <span className="text-[11px] font-semibold text-[#1F6F5C] flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Tu voto</span>
                        </span>
                      )}

                      <div className="text-right">
                        <span className="text-sm font-bold text-[#1F2328]">
                          {count}
                        </span>
                        <span className="text-[11px] text-[#656D76] ml-1">
                          {count === 1 ? 'voto' : 'votos'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Propose Place Bottom Sheet */}
      <ProposePlaceSheet
        isOpen={isProposeOpen}
        onClose={() => setIsProposeOpen(false)}
        recommendations={allRecommendations}
        existingOptionIds={existingOptionIds}
        onPropose={handlePropose}
      />

      {/* Share Modal */}
      {isShareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsShareOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-[#E5E5E0] space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1F2328]">Compartir lista</h3>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#656D76]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-[#656D76]">
              Cualquiera con el enlace que entre con Google se unirá automáticamente a esta lista para votar y proponer lugares.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full min-h-[44px] py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20ba59] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.15c-.24.67-1.39 1.28-1.92 1.35-.49.06-1.12.1-3.23-.78-2.69-1.12-4.41-3.86-4.55-4.04-.13-.19-1.09-1.45-1.09-2.77 0-1.32.69-1.97.94-2.23.25-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.39-.06.61.47.23.55.78 1.91.85 2.05.07.14.12.31.02.49-.1.19-.15.31-.3.48-.15.17-.31.38-.45.51-.15.15-.3.32-.13.62.17.3 75 1.23 1.62 2 1.11.99 2.05 1.3 2.34 1.44.29.14.47.12.64-.07.18-.2.76-.88.96-1.18.2-.3.41-.25.68-.15.28.1 1.76.83 2.07.98.3.15.51.23.58.36.07.13.07.75-.17 1.42z" />
                </svg>
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full min-h-[44px] py-3 rounded-xl border border-[#E5E5E0] bg-[#F7F7F5] text-[#1F2328] text-sm font-semibold hover:bg-black/5 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-[#656D76]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-[#E5E5E0] space-y-4 text-center">
            <h3 className="text-base font-bold text-[#1F2328]">¿Borrar esta lista?</h3>
            <p className="text-xs text-[#656D76]">
              Se eliminará &ldquo;{list.title}&rdquo; y todas las votaciones para todos los miembros.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-[#E5E5E0] text-sm font-medium text-[#1F2328]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                className="flex-1 min-h-[44px] rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
