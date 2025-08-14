
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getUserProfile, UserProfile } from '@/services/firestore';
import { useRouter, usePathname } from 'next/navigation';
import Loading from '@/app/(app)/loading';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  forceProfileRefresh: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  forceProfileRefresh: () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = useCallback(async (uid: string) => {
    try {
        const userProfile = await getUserProfile(uid);
        setProfile(userProfile);
        // If user is on an auth page but has a full profile, redirect them
        if (userProfile?.description && pathname.startsWith('/onboarding')) {
            router.push('/dashboard');
        }
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setProfile(null);
    } finally {
        setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchProfile(firebaseUser.email!);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
        // Redirect to sign-up page if not authenticated and not on an auth page
        const isPublicAuthPage = pathname === '/' || pathname.startsWith('/signin') || pathname.startsWith('/verify') || pathname.startsWith('/forgot-password');
        if (!isPublicAuthPage) {
            router.push('/');
        }
      }
    });

    return () => unsubscribe();
  }, [fetchProfile, router, pathname]);
  
  const forceProfileRefresh = useCallback(() => {
    if (user) {
        setLoading(true);
        fetchProfile(user.email!);
    }
  }, [user, fetchProfile]);

  const value = {
    user,
    profile,
    loading,
    forceProfileRefresh,
  };

  // Do not render children on auth pages if loading state is still resolving
  // to prevent flashes of content.
  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/verify') || pathname.startsWith('/onboarding') || pathname === '/' || pathname.startsWith('/forgot-password');
  if (loading && !isAuthPage) {
      return <Loading />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
