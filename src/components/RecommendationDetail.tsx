import React, { useState, useEffect } from 'react';
import type { Recommendation, Review, RatingLevel } from '../types';
import { calculateAverageRating, getTotalRatingsCount } from '../types';
import { useAuth } from '../context/AuthContext';
import { CategoryIcon, formatPrice, formatRating, getCategoryLabel } from './CategoryIcon';
import {
  subscribeToRecommendation,
  subscribeToReviews,
  saveReviewTransaction,
  deleteReviewTransaction,
  reportRecommendation,
} from '../services/recommendations';
import { ReviewFormSheet } from './ReviewFormSheet';
import { BookmarkButton } from './BookmarkButton';

interface RecommendationDetailProps {
  item: Recommendation;
  isSaved?: boolean;
  onToggleSave?: (item: Recommendation) => void;
  onBack: () => void;
  onEdit: (item: Recommendation) => void;
  onDelete: (item: Recommendation) => Promise<void>;
}

export const RecommendationDetail: React.FC<RecommendationDetailProps> = ({
  item: initialItem,
  isSaved = false,
  onToggleSave,
  onBack,
  onEdit,
  onDelete,
}) => {
  const { user, isAdmin, signInWithGoogle } = useAuth();

  const [item, setItem] = useState<Recommendation>(initialItem);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Review Sheet State
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);

  // Live subscription to recommendation and its reviews
  useEffect(() => {
    const unsubRec = subscribeToRecommendation(initialItem.id, (updated) => {
      if (updated) {
        setItem(updated);
      }
    });

    const unsubReviews = subscribeToReviews(initialItem.id, (reviewsList) => {
      setReviews(reviewsList);
    });

    return () => {
      unsubRec();
      unsubReviews();
    };
  }, [initialItem.id]);

  const canManagePlace = Boolean(user && (user.uid === item.authorId || isAdmin));
  const isAuthor = Boolean(user && user.uid === item.authorId);
  const isPaseo = item.category === 'paseo';
  const actionTitle = isPaseo ? 'Qué hacer' : 'Qué pedir';

  // Find user's existing review
  const myReview = user ? reviews.find((r) => r.authorId === user.uid) || null : null;

  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

  const handleReport = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setIsReporting(true);
    try {
      await reportRecommendation(item.id);
      setReportSuccessMessage('Esta recomendación ha sido reportada para revisión.');
      setTimeout(() => setReportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error reportando recomendación:', err);
    } finally {
      setIsReporting(false);
      setMenuOpen(false);
    }
  };

  // Live average & count calculation
  const average = calculateAverageRating(item);
  const totalRatings = getTotalRatingsCount(item);
  const averageFormatted = formatRating(average);

  const handleDeletePlace = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item);
    } catch (err) {
      console.error('Error al borrar recomendación:', err);
      setIsDeleting(false);
    }
  };

  const handleReviewButtonClick = () => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    setIsReviewSheetOpen(true);
  };

  const handleSaveReview = async (data: { rating: RatingLevel; comment: string }) => {
    if (!user) return;
    await saveReviewTransaction({
      recommendationId: item.id,
      authorId: user.uid,
      authorName: user.displayName || 'Amigo',
      rating: data.rating,
      comment: data.comment,
    });
  };

  const handleDeleteReview = async () => {
    if (!user) return;
    await deleteReviewTransaction(item.id, user.uid);
  };

  return (
    <div className="min-h-full pb-24 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-[#F7F7F5]/95 backdrop-blur-md px-4 py-2 border-b border-[#EAEAE6] flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="min-w-[44px] min-h-[44px] -ml-2 p-2 rounded-xl text-[#1F2328] hover:bg-black/5 active:scale-95 transition-all flex items-center gap-1 text-sm font-medium"
          aria-label="Volver al listado"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Volver</span>
        </button>

        {/* Top actions: Bookmark and optional 3-dots */}
        <div className="flex items-center gap-1">
          {onToggleSave && (
            <BookmarkButton
              isSaved={isSaved}
              onToggle={() => onToggleSave(item)}
            />
          )}

          {/* 3-dots menu: Editar/Borrar for author, Reportar for others */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl flex items-center justify-center text-[#1F2328] hover:bg-black/5 active:scale-95 transition-all"
              aria-label="Opciones de la recomendación"
              aria-expanded={menuOpen}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-48 bg-white rounded-2xl shadow-xl border border-[#E5E5E0] py-1.5 animate-in fade-in zoom-in-95 duration-150">
                  {isAuthor ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(item);
                        }}
                        className="w-full min-h-[44px] px-4 text-left text-sm text-[#1F2328] hover:bg-[#F7F7F5] flex items-center gap-2.5 font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#656D76]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmDelete(true);
                        }}
                        className="w-full min-h-[44px] px-4 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Borrar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isReporting || item.status === 'reportada'}
                      onClick={handleReport}
                      className={`w-full min-h-[44px] px-4 text-left text-sm flex items-center gap-2.5 font-medium transition-colors ${
                        item.status === 'reportada'
                          ? 'text-[#8C929D] cursor-not-allowed'
                          : 'text-[#656D76] hover:text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      <svg className="w-4 h-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                      <span>
                        {item.status === 'reportada' ? 'Reportada (en revisión)' : isReporting ? 'Reportando...' : 'Reportar lugar'}
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-5 space-y-6">
        {/* Banner de reporte / éxito */}
        {reportSuccessMessage && (
          <div className="p-3 bg-[#1F6F5C]/10 border border-[#1F6F5C]/20 rounded-xl text-xs text-[#1F6F5C] font-semibold animate-in fade-in">
            {reportSuccessMessage}
          </div>
        )}

        {/* Aviso de recomendación reportada */}
        {item.status === 'reportada' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <span className="font-semibold">Recomendación reportada:</span> sigue visible mientras la administradora decide.
            </div>
          </div>
        )}
        {/* Category, Zone & Price meta */}
        <div className="flex items-center gap-2.5 text-sm text-[#656D76]">
          <CategoryIcon category={item.category} size="sm" />
          <span className="font-semibold text-[#1F6F5C]">
            {getCategoryLabel(item.category)}
          </span>
          <span className="text-[#C4C7C5]">·</span>
          <span>{item.zone}</span>
          <span className="text-[#C4C7C5]">·</span>
          <span className="font-semibold text-[#1F2328] tracking-wider">
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Place Name */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2328] leading-tight">
            {item.name}
          </h1>
        </div>

        {/* Promedio grande con estrellas y "Promedio de N calificaciones" */}
        <div className="py-3 px-4 bg-white/70 rounded-2xl border border-[#EAEAE6] space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tracking-tight text-[#1F2328]">
              {averageFormatted}
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= Math.round(average);
                return (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      filled ? 'fill-[#C98A0B] text-[#C98A0B]' : 'text-[#D0D4DC]'
                    }`}
                    viewBox="0 0 24 24"
                    fill={filled ? '#C98A0B' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-[#656D76]">
            {totalRatings === 1
              ? 'Promedio de 1 calificación'
              : `Promedio de ${totalRatings} calificaciones`}
          </p>
        </div>

        {/* Botón principal "Yo también fui" / "Editar mi reseña" */}
        {!isAuthor && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleReviewButtonClick}
              className={`w-full min-h-[48px] py-3 px-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] ${
                myReview
                  ? 'bg-white border-2 border-[#1F6F5C] text-[#1F6F5C] hover:bg-[#1F6F5C]/5'
                  : 'bg-[#1F6F5C] text-white hover:bg-[#185949]'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>{myReview ? 'Editar mi reseña' : 'Yo también fui'}</span>
            </button>
          </div>
        )}

        {/* Qué pedir / Qué hacer */}
        <div className="py-4 border-t border-[#EAEAE6]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#656D76] mb-2">
            {actionTitle}
          </h2>
          <p className="text-base font-semibold text-[#1F6F5C] leading-snug">
            {item.whatToOrder}
          </p>
        </div>

        {/* Lo recomienda [nombre] */}
        <div className="py-4 border-t border-[#EAEAE6] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#656D76]">
              Lo recomienda {item.authorName || 'Alguien del grupo'}
            </h2>
            {/* Stars */}
            <div className="inline-flex items-center gap-1 font-semibold text-sm text-[#1F2328]">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= item.rating
                        ? 'fill-[#C98A0B] text-[#C98A0B]'
                        : 'text-[#D0D4DC]'
                    }`}
                    viewBox="0 0 24 24"
                    fill={star <= item.rating ? '#C98A0B' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="ml-1 text-[#1F2328]">
                {formatRating(item.rating)}
              </span>
            </div>
          </div>

          <div className="text-sm leading-relaxed text-[#1F2328] whitespace-pre-line bg-white/70 p-4 rounded-2xl border border-[#EAEAE6]">
            {item.comment}
          </div>
        </div>

        {/* Reseñas de otras personas (M) */}
        <div className="py-4 border-t border-[#EAEAE6] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#656D76]">
              Reseñas de otras personas ({reviews.length})
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="p-4 bg-white/40 rounded-2xl border border-[#EAEAE6] text-center text-xs text-[#656D76]">
              Aún no hay reseñas de otras personas. Si ya visitaste este lugar, toca &ldquo;Yo también fui&rdquo; para compartir tu opinión.
            </div>
          ) : (
            <div className="space-y-2.5">
              {reviews.map((rev) => {
                const isMine = user && rev.authorId === user.uid;
                return (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-white/80 rounded-2xl border border-[#EAEAE6] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1F2328]">
                          {rev.authorName || 'Alguien del grupo'}
                        </span>
                        {isMine && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#1F6F5C]/10 text-[#1F6F5C]">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rev.rating
                                ? 'fill-[#C98A0B] text-[#C98A0B]'
                                : 'text-[#D0D4DC]'
                            }`}
                            viewBox="0 0 24 24"
                            fill={star <= rev.rating ? '#C98A0B' : 'none'}
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-[#1F2328] whitespace-pre-line">
                      {rev.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Review Form Bottom Sheet */}
      <ReviewFormSheet
        isOpen={isReviewSheetOpen}
        onClose={() => setIsReviewSheetOpen(false)}
        placeName={item.name}
        existingReview={myReview}
        onSave={handleSaveReview}
        onDelete={handleDeleteReview}
      />

      {/* Delete Place Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-[#E5E5E0] space-y-4 text-center">
            <h3 className="text-base font-bold text-[#1F2328]">¿Borrar recomendación?</h3>
            <p className="text-xs text-[#656D76]">
              Se eliminará &ldquo;{item.name}&rdquo; para todos tus amigos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-[#E5E5E0] text-sm font-medium text-[#1F2328] hover:bg-[#F7F7F5] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeletePlace}
                className="flex-1 min-h-[44px] rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                {isDeleting ? 'Borrando...' : 'Borrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
