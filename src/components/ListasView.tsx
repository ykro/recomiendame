import React, { useState } from 'react';
import type { GroupList } from '../types';
import { useAuth } from '../context/AuthContext';
import { NewListModal } from './NewListModal';
import { createGroupList } from '../services/recommendations';

interface ListasViewProps {
  lists: GroupList[];
  isLoading: boolean;
  onSelectList: (listId: string) => void;
}

export const ListasView: React.FC<ListasViewProps> = ({
  lists,
  isLoading,
  onSelectList,
}) => {
  const { user, signInWithGoogle } = useAuth();
  const [isNewListOpen, setIsNewListOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-[#1F6F5C]/10 text-[#1F6F5C] flex items-center justify-center">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1F2328]">Listas para decidir</h2>
        <p className="text-sm text-[#656D76] max-w-xs">
          Entra con tu cuenta de Google para crear listas, compartirlas con tus amigos por enlace y votar en vivo a dónde ir.
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

  const handleCreateList = async (title: string) => {
    if (!user) return;
    const newListId = await createGroupList(title, user.uid);
    onSelectList(newListId);
  };

  return (
    <div className="pb-28 min-h-screen animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="sticky top-[57px] z-20 bg-[#F7F7F5] px-5 py-3 border-b border-[#EAEAE6]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1F2328]">Listas en grupo</h2>
            <p className="text-xs text-[#656D76]">Vota con amigos a dónde salir</p>
          </div>
          <button
            type="button"
            onClick={() => setIsNewListOpen(true)}
            className="min-h-[44px] px-3.5 rounded-xl bg-[#1F6F5C] text-white text-xs font-semibold hover:bg-[#185949] active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
            aria-label="Crear nueva lista"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nueva lista</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {isLoading && lists.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#8C929D]">
            <div className="w-6 h-6 border-2 border-[#1F6F5C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Cargando tus listas...</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1F6F5C]/10 text-[#1F6F5C] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#1F2328]">
              No tienes listas todavía
            </h3>
            <p className="text-xs text-[#656D76] max-w-xs mx-auto leading-relaxed">
              Crea una lista para hacer una pregunta como &ldquo;¿Dónde cenamos el viernes?&rdquo;, comparte el enlace y voten en vivo.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsNewListOpen(true)}
                className="min-h-[44px] px-5 rounded-xl bg-[#1F6F5C] text-white text-xs font-semibold hover:bg-[#185949] active:scale-95 transition-all shadow-xs"
              >
                Crear tu primera lista
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white divide-y divide-[#EAEAE6] border-b border-[#EAEAE6]">
            {lists.map((l) => {
              const isOwner = l.ownerId === user.uid;
              const count = l.memberIds?.length || 1;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onSelectList(l.id)}
                  className="w-full min-h-[58px] p-4 text-left flex items-center justify-between gap-3 hover:bg-black/[0.02] active:bg-black/[0.04] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-[#1F2328] truncate tracking-tight">
                        {l.title}
                      </h3>
                      {isOwner && (
                        <span className="text-[10px] font-semibold text-[#1F6F5C] bg-[#1F6F5C]/10 px-1.5 py-0.5 rounded-md shrink-0">
                          Tu lista
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#656D76] mt-0.5">
                      {count === 1 ? '1 persona' : `${count} personas`}
                    </p>
                  </div>

                  <div className="text-[#C4C7C5] shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <NewListModal
        isOpen={isNewListOpen}
        onClose={() => setIsNewListOpen(false)}
        onCreate={handleCreateList}
      />
    </div>
  );
};
