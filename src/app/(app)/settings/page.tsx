
'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Brush, Save, Settings, User, Loader2, LogOut } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { updateUserProfile } from '@/services/firestore';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ImageUploader } from '@/components/image-uploader';

export default function SettingsPage() {
  const { user, profile, loading: authLoading, forceProfileRefresh } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && profile) {
      setBusinessName(profile.businessName || '');
      setWebsite(profile.website || '');
    }
  }, [authLoading, profile]);
  
  const handleSaveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.email) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to save settings.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    
    try {
        await updateUserProfile(user.email, {
            businessName,
            website,
        });
        
        forceProfileRefresh();

        toast({
            title: 'Settings Saved',
            description: 'Your business profile has been updated.',
        });

    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error Saving',
        description: error.message || 'Could not save your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      router.push('/');
       toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Failed to sign out', error);
       toast({
        title: 'Error Signing Out',
        description: 'Could not sign you out. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (authLoading || !user || !profile) {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
             <div>
                <div className="h-9 w-48 bg-muted rounded-md" />
                <div className="h-5 w-72 bg-muted rounded-md mt-2" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                <div className="lg:row-span-2 xl:col-span-2 h-96 bg-muted rounded-lg" />
                <div className="space-y-6">
                    <div className="h-40 bg-muted rounded-lg" />
                    <div className="h-32 bg-muted rounded-lg" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings /> Settings
        </h1>
        <p className="text-muted-foreground">Manage your account and application preferences.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        
        <Card className="lg:row-span-2 xl:col-span-2">
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>Update your business information here. Click save when you're done.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSaveChanges}>
               <div className="space-y-2">
                <Label>Profile Picture</Label>
                 <ImageUploader 
                  userId={user.uid}
                  userEmail={user.email!}
                  currentImageUrl={profile.profilePictureUrl || null}
                  onUploadComplete={forceProfileRefresh}
                />
                 <p className="text-xs text-muted-foreground">Upload a new image to change your profile picture (max 5MB).</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input id="business-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} disabled={isSaving}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" type="email" value={user.email || ''} disabled={true}/>
                 <p className="text-xs text-muted-foreground">Your sign-in email cannot be changed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" placeholder="https://example.com" value={website || ''} onChange={(e) => setWebsite(e.target.value)} disabled={isSaving}/>
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                 {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Brush /> Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="theme-toggle" className="font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
                </div>
                <ThemeToggle />
                </div>
            </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Log Out</CardTitle>
                <CardDescription>Sign out of your account on this device.</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will be returned to the sign-up page. You can sign back in at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSignOut}>Log Out</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
        </div>
        
      </div>
    </div>
  );
}
