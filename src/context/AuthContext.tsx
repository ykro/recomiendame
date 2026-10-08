import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  type User,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  authError: null,
  clearAuthError: () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Check if admin document exists in admins/{uid} or matches bootstrapped admin
          let adminDocExists = false;
          try {
            const adminDocRef = doc(db, 'admins', currentUser.uid);
            const docSnap = await getDoc(adminDocRef);
            adminDocExists = docSnap.exists();
          } catch {
            // Permission or network error when checking admin doc is non-fatal for visitor/member
          }

          if (adminDocExists || currentUser.email === 'tu-correo@gmail.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';

      if (
        errorCode === 'auth/popup-blocked' ||
        errorMessage.toLowerCase().includes('popup-blocked') ||
        errorMessage.toLowerCase().includes('popup was blocked')
      ) {
        setAuthError(
          'Tu navegador bloqueó la ventana para entrar. Abre la app en una pestaña nueva o permite ventanas emergentes.'
        );
      } else if (errorCode === 'auth/popup-closed-by-user') {
        // User closed the popup, no need for loud error, or short note
        setAuthError(null);
      } else {
        setAuthError('No se pudo entrar con Google. Inténtalo de nuevo.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setAuthError(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        clearAuthError,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
