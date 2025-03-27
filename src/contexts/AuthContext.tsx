import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    try {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          
        }
        setLoading(false);
      } else {
        console.log('No user found, signing in anonymously');
        const creds = await signInAnonymously(auth);
        const userDoc = await getDoc(doc(db, 'users', creds.user.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in auth state change:', error);
      setLoading(false);
    }
  });

  return unsubscribe;
}, []);


  const signIn = async (email: string, password: string) => {
    try {
      // Set persistence to session level
      await setPersistence(auth, browserSessionPersistence);
      
      // Then sign in (this will be persisted according to the setting above)
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as User);
      }
      else {
        setUser(null);
      }
      setLoading(false);
      
    } catch (error) {
      console.error("Error during sign in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{  user, loading, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 