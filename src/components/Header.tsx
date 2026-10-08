import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

interface HeaderProps {
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onProfileClick }) => {
  const { user, signInWithGoogle, authError, clearAuthError } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#F7F7F5]/95 backdrop-blur-md border-b border-[#E5E5E0] px-4 py-2.5">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <h1 className="text-xl font-bold tracking-tight text-[#1F2328]">
            Recomiéndame
          </h1>
        </div>

        {/* User Action */}
        <div>
          {user ? (
            <button
              type="button"
              onClick={onProfileClick}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 rounded-full hover:bg-black/5 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6F5C]"
              aria-label="Ir a tu perfil"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Tu perfil'}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#1F6F5C]/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1F6F5C] text-white text-sm font-semibold flex items-center justify-center shadow-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-[#1F6F5C] text-white hover:bg-[#185949] active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6F5C]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth error notification */}
      {authError && (
        <div
          role="alert"
          className="mt-2.5 max-w-md mx-auto p-3 text-xs leading-relaxed text-red-900 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 shadow-xs animate-in fade-in"
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>{authError}</p>
          </div>
          <button
            type="button"
            onClick={clearAuthError}
            className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-red-700 hover:text-red-950"
            aria-label="Cerrar aviso"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </header>
  );
};
