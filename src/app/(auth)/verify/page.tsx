
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserProfile } from '@/services/firestore';

function VerifyComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        
        if (!email) {
          setError("Your session has expired or you are on a different device. Please try signing in again from the original device.");
          return;
        }

        try {
          // Sign the user in with the link.
          const result = await signInWithEmailLink(auth, email, window.location.href);
          
          // Clear the temporary email from storage.
          window.localStorage.removeItem('emailForSignIn');
          
          const profile = await getUserProfile(email);

          if (profile && profile.description) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding/start');
          }
          
        } catch (error) {
          console.error("Error signing in with email link", error);
          setError("The sign-in link is invalid or has expired. Please try signing in again.");
          toast({
            title: "Sign-In Failed",
            description: "The link may be invalid or expired. Please request a new one.",
            variant: "destructive",
          });
        }
      } else {
         setError("This is not a valid sign-in link. Please return to the login page.");
      }
    };

    verifyLink();
  }, [router, toast]);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-4">
        {error ? (
            <>
                <AlertTriangle className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold">Authentication Error</h1>
                <p className="text-muted-foreground max-w-sm">{error}</p>
                <Button onClick={() => router.push('/signin')}>Return to Sign In</Button>
            </>
        ) : (
            <>
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <h1 className="text-2xl font-bold">Verifying...</h1>
                <p className="text-muted-foreground">Please wait while we verify your sign-in link.</p>
            </>
        )}
    </div>
  );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 text-primary animate-spin" /></div>}>
            <VerifyComponent />
        </Suspense>
    )
}
