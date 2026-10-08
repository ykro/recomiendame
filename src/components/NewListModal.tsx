import React, { useState } from 'react';

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}

export const NewListModal: React.FC<NewListModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTitle('');
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Escribe una pregunta para la lista.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(title.trim());
      onClose();
    } catch (err) {
      console.error('Error creando lista:', err);
      setError('No se pudo crear la lista. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#F7F7F5] rounded-t-3xl sm:rounded-2xl border border-[#E5E5E0] shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2328]">Nueva lista</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#656D76]">
              ¿Qué van a decidir en grupo?
            </label>
            <input
              type="text"
              autoFocus
              maxLength={150}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: ¿Dónde cenamos el viernes?"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-white border border-[#E5E5E0] text-sm text-[#1F2328] placeholder-[#9E9E9E] focus:outline-none focus:ring-2 focus:ring-[#1F6F5C] focus:border-transparent transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] py-3 rounded-xl bg-[#1F6F5C] text-white font-semibold text-sm hover:bg-[#185949] active:scale-[0.99] disabled:opacity-60 transition-all shadow-xs flex items-center justify-center"
            >
              {isSubmitting ? 'Creando lista...' : 'Crear lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
