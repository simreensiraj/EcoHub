
'use client';

import {
  Activity,
  Lightbulb,
  Loader2,
  PlusCircle,
  Target,
  Edit,
  Save,
  CheckCircle,
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, YAxis, XAxis, Tooltip, TooltipProps } from 'recharts';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useCallback } from 'react';
import { generateSustainabilitySuggestions } from '@/ai/flows/generate-sustainability-suggestions';
import { scoreActivity } from '@/ai/flows/score-activity';
import { scoreBusiness } from '@/ai/flows/score-business';
import { generateSdgCompliance } from '@/ai/flows/generate-sdg-compliance';
import { updateUserProfile } from '@/services/firestore';
import { useAuth } from '@/hooks/use-auth';


const initialActivities: { title: string; description: string; }[] = [];

export default function DashboardPage() {
  const { user, profile, loading: authLoading, forceProfileRefresh } = useAuth();
  
  const [activities, setActivities] = useState<{ title: string; description: string; }[]>([]);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isScoringActivity, setIsScoringActivity] = useState(false);
  
  const [improvements, setImprovements] = useState<string[]>([]);
  const [sustainabilityScore, setSustainabilityScore] = useState(0);
  const [sdgData, setSdgData] = useState<{name: string, value: number}[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [businessPractices, setBusinessPractices] = useState('');
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);


  const { toast } = useToast();

  const fetchDashboardData = useCallback(async (currentPractices: string) => {
    // This is the critical guard: DO NOT run if practices are empty.
    if (!currentPractices) {
      setSustainabilityScore(profile?.sustainabilityScore || 0);
      setImprovements([]);
      setSdgData([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    try {
      const [scoreResult, suggestionsResult, sdgResult] = await Promise.all([
        scoreBusiness({ businessPractices: currentPractices }),
        generateSustainabilitySuggestions({ businessPractices: currentPractices }),
        generateSdgCompliance({ businessPractices: currentPractices })
      ]);

      const newScore = scoreResult.sustainabilityScore;
      setSustainabilityScore(newScore);
      
      const formattedSuggestions = suggestionsResult.suggestions.map(s => s.title);
      setImprovements(formattedSuggestions);

      setSdgData(sdgResult.sdgGoals);

      if (user?.email && newScore !== profile?.sustainabilityScore) {
         await updateUserProfile(user.email, { sustainabilityScore: newScore });
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({ title: 'Error', description: 'Could not fetch your sustainability data.', variant: 'destructive' });
      // Fallback to profile data on error
      setSustainabilityScore(profile?.sustainabilityScore || 0);
      setImprovements([]);
      setSdgData([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [profile, user, toast]);

  useEffect(() => {
    // This is the main refactored effect. It runs only when auth is settled.
    if (!authLoading && profile) {
        const currentPractices = profile.description || '';
        // Set all profile-derived state at once.
        setBusinessPractices(currentPractices);
        setActivities(profile.recentActivities || initialActivities);
        setSustainabilityScore(profile.sustainabilityScore || 0);
        // Now fetch data. The function itself will guard against empty practices.
        fetchDashboardData(currentPractices);
    } else if (!authLoading && !profile) {
      // Handle case where user is authenticated but has no profile data (e.g., error fetching).
      setIsLoadingData(false);
    }
  }, [authLoading, profile, fetchDashboardData]);


  const handleUpdateDescription = async () => {
    if (!user?.email || !businessPractices) return;
    setIsUpdatingProfile(true);
    
    try {
        await updateUserProfile(user.email, { description: businessPractices });
        await fetchDashboardData(businessPractices); // Refetch all data with new description

        forceProfileRefresh(); 

        toast({
            title: 'Profile Updated',
            description: `Your new sustainability score and suggestions have been generated.`,
        });
        setIsDescriptionDialogOpen(false);
    } catch (error) {
        console.error("Failed to update business profile:", error);
        toast({
            title: 'Error',
            description: 'Could not update your business profile. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsUpdatingProfile(false);
    }
  };

  const handleAddActivity = async () => {
    if (!user?.email) return;
    if (newActivityTitle && newActivityDescription) {
      setIsScoringActivity(true);
      try {
        const currentBusinessPractices = businessPractices || profile?.description || '';
        const result = await scoreActivity({
            activityDescription: `${newActivityTitle}: ${newActivityDescription}`,
            businessPractices: currentBusinessPractices,
        });

        const scoreChange = result.scoreChange;
        const newScore = Math.max(0, Math.min(100, sustainabilityScore + scoreChange));
        
        setSustainabilityScore(newScore);
        
        const newActivity = {
          title: newActivityTitle,
          description: newActivityDescription,
        };

        const updatedActivities = [newActivity, ...activities];
        setActivities(updatedActivities.slice(0, 5));
        setNewActivityTitle('');
        setNewActivityDescription('');
        setIsActivityDialogOpen(false);
        
        await updateUserProfile(user.email, { 
            sustainabilityScore: newScore,
            recentActivities: updatedActivities.slice(0, 5)
        });
        
        let toastTitle = "Activity Added";
        let toastDescription = `Your sustainability score changed by ${scoreChange}.`;

        if (scoreChange > 0) {
            toastTitle = "Great Job! \u{1F389}";
        } else if (scoreChange < 0) {
            toastTitle = "Room for Improvement";
        } else {
            toastTitle = "Activity Logged";
            toastDescription = "This activity didn't change your score, but keep it up!";
        }

        toast({
          title: toastTitle,
          description: toastDescription,
        });
        
      } catch (error) {
         console.error("Failed to score activity:", error);
         toast({
            title: 'Error',
            description: 'Could not score the activity. It has been added without a score change.',
            variant: 'destructive',
        });
        const newActivity = {
          title: newActivityTitle,
          description: newActivityDescription,
        };
        const updatedActivities = [newActivity, ...activities];
        setActivities(updatedActivities.slice(0,5));
        setIsActivityDialogOpen(false);
      } finally {
        setIsScoringActivity(false);
      }
    } else {
        toast({
            title: 'Incomplete Form',
            description: 'Please provide a title and description for the activity.',
            variant: 'destructive',
        });
    }
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm font-medium">{`${payload[0].payload.name}`}</p>
          <p className="text-sm text-primary">{`Compliance: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  const isLoading = authLoading || isLoadingData;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
            Welcome back! Here's your sustainability overview.
            </p>
        </div>
        <Dialog open={isDescriptionDialogOpen} onOpenChange={setIsDescriptionDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Business Profile</DialogTitle>
                    <DialogDescription>
                        Update your business practices below. This will regenerate your sustainability score and suggestions.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="business-practices" className="sr-only">Business Practices</Label>
                    <Textarea
                        id="business-practices"
                        value={businessPractices}
                        onChange={(e) => setBusinessPractices(e.target.value)}
                        rows={8}
                        className="w-full"
                        disabled={isUpdatingProfile}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button type="button" variant="secondary" disabled={isUpdatingProfile}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handleUpdateDescription} disabled={isUpdatingProfile}>
                        {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save and Recalculate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              Sustainability Score
            </CardTitle>
            <CardDescription>
              Your current business sustainability rating.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4">
             {isLoading ? (
                <Skeleton className="h-32 w-32 rounded-full" />
             ) : (
                <div className="relative h-32 w-32">
                <Progress value={sustainabilityScore} className="absolute h-full w-full rounded-full" />
                <div className="absolute inset-2 flex items-center justify-center rounded-full bg-background">
                    <span className="text-4xl font-bold text-primary">{sustainabilityScore}</span>
                </div>
                </div>
             )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
           <CardHeader className="flex flex-row items-start justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6" />
                Ways to Improve
                </CardTitle>
                <CardDescription>
                Top suggestions based on your business profile.
                </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                     <div key={i} className="flex items-start gap-3">
                        <Skeleton className="mt-1 h-5 w-5 rounded-full" />
                        <Skeleton className="h-5 flex-1" />
                      </div>
                  ))}
                </div>
            ) : improvements.length > 0 ? (
              <ul className="space-y-4">
                {improvements.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="flex-1 text-sm">{item}</p>
                  </li>
                ))}
              </ul>
            ) : (
                <div className="text-center text-muted-foreground py-4">
                    <p>No improvement suggestions available.</p>
                    <p className="text-xs">Add a business description or go to the SustainaBOT page to get suggestions.</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SDG Compliance</CardTitle>
            <CardDescription>
              Your progress on key Sustainable Development Goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full pl-0">
            {isLoading ? (
                <div className="w-full h-full">
                    <Skeleton className="w-full h-full" />
                </div>
            ) : sdgData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={sdgData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <XAxis dataKey="name" height={0} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            ) : (
                 <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                    <p>No SDG data to display.</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest sustainability-related actions.
                </CardDescription>
              </div>
              <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className={activities.length > 0 ? '' : 'hidden'}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Activity
                  </Button>
                </DialogTrigger>
            </CardHeader>
            <CardContent className="grid gap-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                     <div key={i} className="flex items-start gap_3">
                        <Skeleton className="mt-1 h-5 w-5 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
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
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <DialogTrigger asChild>
                    <Button variant="secondary" onClick={() => setIsActivityDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Log your first new activity
                    </Button>
                  </DialogTrigger>
                  <p className="text-sm text-muted-foreground mt-2">Start tracking your sustainability journey.</p>
                </div>
              )}
            </CardContent>
          </Card>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
              <DialogDescription>
                Log a new sustainability-related action your business has taken.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  className="col-span-3"
                  disabled={isScoringActivity}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newActivityDescription}
                  onChange={(e) => setNewActivityDescription(e.target.value)}
                  className="col-span-3"
                  disabled={isScoringActivity}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isScoringActivity}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleAddActivity} disabled={isScoringActivity}>
                {isScoringActivity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Activity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
