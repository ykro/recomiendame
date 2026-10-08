import React, { useState } from 'react';
import type { CategoryType, PriceLevel, RatingLevel, Recommendation } from '../types';
import { useAuth } from '../context/AuthContext';
import { CategoryIcon } from './CategoryIcon';

interface RecommendationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    category: CategoryType;
    zone: string;
    price: PriceLevel;
    rating: RatingLevel;
    whatToOrder: string;
    comment: string;
    authorName: string;
  }) => Promise<void>;
  initialData?: Recommendation | null;
}

export const RecommendationFormModal: React.FC<RecommendationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('comer');
  const [zone, setZone] = useState('');
  const [price, setPrice] = useState<PriceLevel>(2);
  const [rating, setRating] = useState<RatingLevel>(5);
  const [whatToOrder, setWhatToOrder] = useState('');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setZone(initialData.zone);
      setPrice(initialData.price);
      setRating(initialData.rating);
      setWhatToOrder(initialData.whatToOrder);
      setComment(initialData.comment);
      setAuthorName(initialData.authorName);
    } else {
      setName('');
      setCategory('comer');
      setZone('');
      setPrice(2);
      setRating(5);
      setWhatToOrder('');
      setComment('');
      setAuthorName(user?.displayName || '');
    }
    setValidationError(null);
  }, [initialData, isOpen, user]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialData);
  const isPaseo = category === 'paseo';
  const actionLabel = isPaseo ? 'Qué hacer' : 'Qué pedir';
  const actionPlaceholder = isPaseo
    ? 'Ej: Caminata al atardecer por los miradores'
    : 'Ej: Milanesa a la napolitana o tarta de frambuesa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Escribe el nombre del lugar.');
      return;
    }
    if (!zone.trim()) {
      setValidationError('Escribe la zona o barrio.');
      return;
    }
    if (!whatToOrder.trim()) {
      setValidationError(isPaseo ? 'Indica qué hacer.' : 'Indica qué pedir.');
      return;
    }
    if (!comment.trim()) {
      setValidationError('Cuéntanos tu opinión sobre este lugar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        zone: zone.trim(),
        price,
        rating,
        whatToOrder: whatToOrder.trim(),
        comment: comment.trim(),
        authorName: authorName.trim() || user?.displayName || 'Amigo',
      });
      onClose();
    } catch (err: any) {
      console.error('Error guardando recomendación:', err);
      setValidationError('No se pudo guardar la recomendación. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: Array<{ id: CategoryType; label: string }> = [
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
        className="w-full max-w-md bg-[#F7F7F5] rounded-t-3xl sm:rounded-2xl border border-[#E5E5E0] shadow-2xl flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EAEAE6] flex items-center justify-between shrink-0 bg-[#F7F7F5] rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-lg font-bold text-[#1F2328]">
            {isEditing ? 'Editar recomendación' : 'Nueva recomendación'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#656D76] hover:text-[#1F2328]"
            aria-label="Cerrar formulario"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form body */}
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

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
              Nombre del lugar *
            </label>
            <input
              type="text"
              required
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pizzería Los Inmortales"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-[#E5E5E0] text-sm text-[#1F2328] placeholder-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:border-transparent transition-all"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
              Categoría
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`min-h-[44px] py-2 px-1 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                    category === cat.id
                      ? 'bg-[#1F6F5C] text-white shadow-xs'
                      : 'bg-white border border-[#E5E5E0] text-[#1F2328] hover:bg-black/5'
                  }`}
                >
                  <CategoryIcon category={cat.id} size="sm" />
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Zona */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
              Zona o barrio *
            </label>
            <input
              type="text"
              required
              value={zone}
              maxLength={100}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Ej: Centro, Palermo, Zona Norte"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-[#E5E5E0] text-sm text-[#1F2328] placeholder-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:border-transparent transition-all"
            />
          </div>

          {/* Precio y Calificación en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Precio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
                Precio
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([1, 2, 3] as PriceLevel[]).map((p) => {
                  const label = p === 1 ? '$' : p === 2 ? '$$' : '$$$';
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrice(p)}
                      className={`min-h-[44px] rounded-xl text-xs font-semibold transition-all flex items-center justify-center ${
                        price === p
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

            {/* Calificación */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
                Tu calificación
              </label>
              <div className="flex items-center justify-between min-h-[44px] bg-white border border-[#E5E5E0] rounded-xl px-2">
                {([1, 2, 3, 4, 5] as RatingLevel[]).map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="min-h-[40px] min-w-[32px] flex items-center justify-center p-1 rounded-md text-[#C98A0B] hover:scale-110 active:scale-95 transition-transform"
                    aria-label={`Calificar con ${star} estrellas`}
                  >
                    <svg
                      className="w-4 h-4"
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
          </div>

          {/* Qué pedir / Qué hacer */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
              {actionLabel} *
            </label>
            <input
              type="text"
              required
              value={whatToOrder}
              maxLength={200}
              onChange={(e) => setWhatToOrder(e.target.value)}
              placeholder={actionPlaceholder}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-[#E5E5E0] text-sm text-[#1F2328] placeholder-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:border-transparent transition-all"
            />
          </div>

          {/* Comentario */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
              Tu opinión o comentario *
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              maxLength={1000}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Por qué te gusta? ¿Algún detalle sobre la atención, el ambiente o los mejores horarios?"
              className="w-full p-3 rounded-xl bg-white border border-[#E5E5E0] text-sm text-[#1F2328] placeholder-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-3 rounded-xl bg-[#1F6F5C] text-white font-semibold text-sm hover:bg-[#185949] active:scale-[0.99] disabled:opacity-60 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <span>{isEditing ? 'Guardar cambios' : 'Publicar recomendación'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
