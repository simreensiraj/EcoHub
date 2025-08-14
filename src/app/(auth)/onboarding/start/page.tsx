
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function OnboardingStartPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [businessName, setBusinessName] = useState('your business');
  
  useEffect(() => {
    if (!loading && profile) {
        if(profile.description) {
            router.push('/dashboard');
        } else {
            setBusinessName(profile.businessName);
        }
    }
  }, [profile, loading, router]);
  
  useEffect(() => {
      // Clear previous partial onboarding data
      try {
        localStorage.removeItem('onboardingAnswers');
      } catch (error) {
        console.error("Failed to clear onboarding answers from localStorage", error);
      }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome, {businessName}!</h1>
            <p className="mt-2 text-muted-foreground">Let's set up your sustainability profile.</p>
        </div>
        
        <div className="w-full space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground">How would you like to provide your business information?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="items-center text-center">
                        <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                             <HelpCircle className="h-8 w-8" />
                        </div>
                        <CardTitle>Answer Questions</CardTitle>
                        <CardDescription>Answer 5 simple questions about your business.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" asChild>
                            <Link href="/onboarding/questions/1">Start Questionnaire</Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="items-center text-center">
                        <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                             <FileText className="h-8 w-8" />
                        </div>
                        <CardTitle>Upload a Document</CardTitle>
                        <CardDescription>Let our AI analyze your existing business plan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button className="w-full" variant="secondary" asChild>
                             <Link href="/onboarding/upload">Upload Document</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
