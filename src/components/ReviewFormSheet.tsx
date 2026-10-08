import React, { useState, useEffect } from 'react';
import type { RatingLevel, Review } from '../types';

interface ReviewFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  placeName: string;
  existingReview: Review | null;
  onSave: (data: { rating: RatingLevel; comment: string }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const ReviewFormSheet: React.FC<ReviewFormSheetProps> = ({
  isOpen,
  onClose,
  placeName,
  existingReview,
  onSave,
  onDelete,
}) => {
  const [rating, setRating] = useState<RatingLevel>(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Each time it opens, reset state to existing review or default
  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setIsDeleting(false);
      setConfirmDelete(false);
      setValidationError(null);
      if (existingReview) {
        setRating(existingReview.rating);
        setComment(existingReview.comment);
      } else {
        setRating(5);
        setComment('');
      }
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!comment.trim()) {
      setValidationError('Cuéntanos qué te pareció tu visita.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        rating,
        comment: comment.trim(),
      });
      // Close after saving
      onClose();
    } catch (err) {
      console.error('Error al guardar reseña:', err);
      setValidationError('No se pudo guardar tu reseña. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      console.error('Error al borrar reseña:', err);
      setValidationError('No se pudo borrar tu reseña. Inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#F7F7F5] rounded-t-3xl sm:rounded-2xl border border-[#E5E5E0] shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle / Header */}
        <div className="px-5 pt-3 pb-2 border-b border-[#EAEAE6] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1F2328]">
              {existingReview ? 'Editar mi reseña' : 'Yo también fui'}
            </h2>
            <p className="text-xs text-[#656D76] truncate max-w-[260px]">
              {placeName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isDeleting}
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#656D76] hover:text-[#1F2328]"
            aria-label="Cerrar reseña"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {validationError && (
            <div className="p-3 text-xs text-red-900 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          {/* Calificación con estrellas táctiles */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
              Tu calificación
            </label>
            <div className="flex items-center justify-center gap-2 p-3 bg-white border border-[#E5E5E0] rounded-2xl shadow-2xs">
              {([1, 2, 3, 4, 5] as RatingLevel[]).map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-[#C98A0B] hover:scale-115 active:scale-95 transition-all"
                  aria-label={`Calificar con ${star} estrellas`}
                >
                  <svg
                    className="w-7 h-7"
                    viewBox="0 0 24 24"
                    fill={star <= rating ? '#C98A0B' : 'none'}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Comentario */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
              Tu experiencia o recomendación *
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              maxLength={1000}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te pareció el lugar? ¿Recomiendas probar algo en especial?"
              className="w-full p-3.5 rounded-xl bg-white border border-[#E5E5E0] text-sm text-[#1F2328] placeholder-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="w-full min-h-[44px] py-3 rounded-xl bg-[#1F6F5C] text-white font-semibold text-sm hover:bg-[#185949] active:scale-[0.99] disabled:opacity-60 transition-all shadow-xs flex items-center justify-center"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <span>{existingReview ? 'Guardar cambios' : 'Publicar mi reseña'}</span>
              )}
            </button>

            {existingReview && (
              <>
                {!confirmDelete ? (
                  <button
                    type="button"
                    disabled={isSubmitting || isDeleting}
                    onClick={() => setConfirmDelete(true)}
                    className="w-full min-h-[44px] py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 active:scale-98 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Borrar mi reseña</span>
                  </button>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-center animate-in fade-in duration-150">
                    <p className="text-xs text-red-900 font-medium">¿Seguro que quieres borrar tu reseña?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 min-h-[44px] text-xs font-semibold rounded-lg bg-white border border-[#E5E5E0] text-[#1F2328]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="flex-1 min-h-[44px] text-xs font-semibold rounded-lg bg-red-600 text-white"
                      >
                        {isDeleting ? 'Borrando...' : 'Sí, borrar'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
