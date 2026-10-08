import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Recommendation } from '../types';
import { RecommendationItem } from './RecommendationItem';
import { seedExampleRecommendations, EXAMPLE_RECOMMENDATION_NAMES } from '../services/recommendations';

interface ProfileViewProps {
  allRecommendations: Recommendation[];
  savedIds?: Set<string>;
  onSelectItem: (item: Recommendation) => void;
  onToggleSave?: (item: Recommendation) => void;
  onOpenModeracion?: () => void;
  onRefresh?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  allRecommendations,
  savedIds,
  onSelectItem,
  onToggleSave,
  onOpenModeracion,
}) => {
  const { user, isAdmin, logout, signInWithGoogle } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);

  const reportedCount = allRecommendations.filter((r) => r.status === 'reportada').length;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-[#1F6F5C]/10 text-[#1F6F5C] flex items-center justify-center">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1F2328]">Tu perfil</h2>
        <p className="text-sm text-[#656D76] max-w-xs">
          Entra con tu cuenta de Google para compartir lugares con tus amigos y administrar tus recomendaciones.
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

  // User recommendations
  const myRecommendations = allRecommendations.filter(
    (item) => item.authorId === user.uid
  );

  // Check if example recommendations already exist in feed
  const examplesAlreadyLoaded = allRecommendations.some((item) =>
    EXAMPLE_RECOMMENDATION_NAMES.includes(item.name)
  );

  const handleSeedExamples = async () => {
    if (isSeeding || examplesAlreadyLoaded) return;
    setIsSeeding(true);
    setSeedSuccessMessage(null);
    try {
      await seedExampleRecommendations(user.uid, user.displayName || 'Administradora');
      setSeedSuccessMessage('Se cargaron los 8 ejemplos exitosamente.');
    } catch (err) {
      console.error('Error al cargar ejemplos:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="pb-24 animate-in fade-in duration-200">
      {/* User Header Row */}
      <div className="px-5 py-4 border-b border-[#EAEAE6] bg-white/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Avatar'}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#1F6F5C]/20 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#1F6F5C] text-white text-base font-bold flex items-center justify-center shrink-0">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1F2328] truncate">
              {user.displayName || 'Miembro'}
            </h2>
            <p className="text-xs text-[#656D76] truncate">{user.email}</p>
          </div>
        </div>

        {/* Salir button in the same row */}
        <button
          type="button"
          onClick={logout}
          className="min-h-[44px] px-3.5 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#1F2328] hover:bg-black/5 active:scale-95 transition-all shrink-0 flex items-center justify-center"
        >
          Salir
        </button>
      </div>

      {/* Mis recomendaciones */}
      <div className="py-4">
        <div className="px-5 mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#656D76]">
            Mis recomendaciones ({myRecommendations.length})
          </h3>
        </div>

        {myRecommendations.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-[#656D76] bg-white/30 rounded-2xl mx-4 border border-[#EAEAE6]">
            Aún no has recomendado ningún lugar. Toca el botón + en Explorar para compartir tu primer favorito.
          </div>
        ) : (
          <div className="bg-white/40 border-y border-[#EAEAE6] divide-y divide-[#EAEAE6]">
            {myRecommendations.map((item) => (
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

      {/* Sección Administración solo para administradora */}
      {isAdmin && (
        <div className="mt-6 px-5 py-5 border-t border-[#EAEAE6]">
          <div className="p-4 bg-white rounded-2xl border border-[#E5E5E0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1F6F5C]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2328]">
                Administración
              </h4>
            </div>
            <p className="text-xs text-[#656D76] leading-relaxed">
              Crea 8 recomendaciones variadas de prueba con nombres neutrales y zonas genéricas a tu nombre.
            </p>

            {seedSuccessMessage && (
              <p className="text-xs text-[#1F6F5C] font-medium">
                {seedSuccessMessage}
              </p>
            )}

            <button
              type="button"
              disabled={isSeeding || examplesAlreadyLoaded}
              onClick={handleSeedExamples}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                examplesAlreadyLoaded
                  ? 'bg-neutral-100 text-[#8C929D] cursor-not-allowed border border-[#E5E5E0]'
                  : 'bg-[#1F6F5C] text-white hover:bg-[#185949] active:scale-[0.99] shadow-xs disabled:opacity-60'
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

            {/* Moderación button */}
            <div className="pt-2 border-t border-[#EAEAE6]">
              <button
                type="button"
                onClick={onOpenModeracion}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#F7F7F5] text-xs font-semibold text-[#1F2328] hover:bg-black/5 active:scale-[0.99] transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Moderación</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    reportedCount > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-neutral-200 text-[#656D76]'
                  }`}
                >
                  {reportedCount} {reportedCount === 1 ? 'reportada' : 'reportadas'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
