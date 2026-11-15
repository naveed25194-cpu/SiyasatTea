import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export interface PlatformUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'editor' | 'researcher';
}

interface AuthContextValue {
  firebaseUser: User | null;
  dbUser: PlatformUser | null;
  idToken: string | null;
  isLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<PlatformUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncBackendUser = useCallback(async (user: User) => {
    const token = await user.getIdToken();
    setIdToken(token);
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { user?: PlatformUser };
      setDbUser(data.user ?? null);
    } else {
      setDbUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          await syncBackendUser(user);
        } catch {
          setDbUser(null);
        }
      } else {
        setIdToken(null);
        setDbUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [syncBackendUser]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      await syncBackendUser(result.user);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to complete Google sign-in.';
      setAuthError(msg);
    }
  }, [syncBackendUser]);

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOut(auth);
    setIdToken(null);
    setDbUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) {
      await syncBackendUser(firebaseUser);
    }
  }, [firebaseUser, syncBackendUser]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        idToken,
        isLoading,
        authError,
        signInWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
