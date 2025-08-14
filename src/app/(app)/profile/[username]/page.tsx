'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { listenToUserProfile, type UserProfile } from '@/services/firestore-listeners';
import { Building, Info, Mail, Target, Activity as ActivityIcon, CalendarDays } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-8 w-48" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Skeleton className="h-6 w-6 rounded-full" /> <Skeleton className="h-6 w-40" /></CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-2">
                <Skeleton className="h-24 w-24 rounded-full" />
              </CardContent>
            </Card>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-8 w-52" /></CardTitle>
            <div className="text-sm text-muted-foreground"><Skeleton className="h-5 w-64" /></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    setIsLoading(true);
    const decodedUsername = decodeURIComponent(username);
    
    const unsubscribe = listenToUserProfile(decodedUsername, (userProfile) => {
      if (userProfile) {
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [username]);

  if (isLoading) {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold">User Profile</h1>
                <p className="text-muted-foreground">Loading sustainability profile...</p>
            </div>
            <ProfileSkeleton />
        </div>
    )
  }
  
  if (!profile) {
    notFound();
  }
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Just now'; // Fallback for invalid dates
        }
        return format(date, 'PPP');
    } catch (e) {
        return 'N/A';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">
          Sustainability profile for {profile.businessName}.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                        <AvatarImage src={profile.profilePictureUrl ?? undefined} alt={profile.businessName} />
                        <AvatarFallback>{profile.businessName ? profile.businessName.substring(0, 2).toUpperCase() : 'P'}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-bold">{profile.businessName}</h2>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Sustainability Score
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-2">
                    <div className="relative h-24 w-24">
                        <Progress value={profile.sustainabilityScore ?? 0} className="absolute h-full w-full rounded-full" />
                        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-background">
                        <span className="text-3xl font-bold text-primary">{profile.sustainabilityScore ?? 0}</span>
                        </div>
                    </div>
                    {!profile.sustainabilityScore && <p className="text-xs text-muted-foreground text-center mt-2">This user hasn't generated a score yet.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/>Business Information</CardTitle>
                <CardDescription>Details about {profile.businessName}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                        <span className="font-medium">Business Name:</span> {profile.businessName}
                    </div>
                </li>
                <li className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                        <span className="font-medium">Email:</span> <a href={`mailto:${profile.contactEmail}`} className="text-primary hover:underline break-all">{profile.contactEmail}</a>
                    </div>
                </li>
                <li className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                        <span className="font-medium">Date Joined:</span> {formatDate(profile.createdAt)}
                    </div>
                </li>
                </ul>
                {profile.description && (
                    <div>
                        <h4 className="font-medium mb-2">Business Description</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                            {profile.description}
                        </p>
                    </div>
                )}
            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ActivityIcon className="h-5 w-5" />Recent Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {profile.recentActivities && profile.recentActivities.length > 0 ? (
                        profile.recentActivities.map((activity, index) => (
                             <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                                <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary flex-shrink-0">
                                    <span className="text-xs font-bold">{index + 1}</span>
                                </div>
                                <div className="grid gap-1">
                                <p className="text-sm font-medium leading-none">
                                    {activity.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {activity.description}
                                </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">No recent activities logged.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
