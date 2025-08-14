
'use client';

import {
  Bell,
  Bot,
  LayoutDashboard,
  Leaf,
  MessageSquare,
  PanelLeft,
  Recycle,
  Settings as SettingsIcon,
  User,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  useSidebar,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { SidebarNav } from '@/components/sidebar-nav';
import { auth } from '@/lib/firebase';

type Notification = {
  id: string;
  title: string;
  description: string;
  read: boolean;
};

function Header() {
  const { profile, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const [hasUnread, setHasUnread] = useState(false);


   useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      let currentNotifications: Notification[] = [];
      if (savedNotifications) {
        currentNotifications = JSON.parse(savedNotifications);
      } else {
         const initialNotifications = [{
            id: 'activity-reminder-initial',
            title: 'Welcome!',
            description: "Don't forget to log your first sustainability activity on the dashboard.",
            read: false,
          }];
          localStorage.setItem('notifications', JSON.stringify(initialNotifications));
          currentNotifications = initialNotifications;
      }

      const lastUpdated = localStorage.getItem('lastActivityUpdate');
      if (lastUpdated) {
        const lastUpdatedDate = new Date(lastUpdated);
        const now = new Date();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (now.getTime() - lastUpdatedDate.getTime() > oneWeek) {
          const reminderExists = currentNotifications.some(n => n.id === 'activity-reminder');
          if (!reminderExists) {
            currentNotifications.push({
              id: 'activity-reminder',
              title: 'Update Reminder',
              description: "It's been over a week! Time to add a new activity to your log.",
              read: false,
            });
            localStorage.setItem('notifications', JSON.stringify(currentNotifications));
          }
        }
      }
      setNotifications(currentNotifications);
      setHasUnread(currentNotifications.some(n => !n.read));
    } catch (error) {
       console.error("Failed to get notifications from localStorage", error);
    }
  }, [pathname]);

  const handleOpenNotifications = () => {
    const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setHasUnread(false);
    try {
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
        console.error("Failed to save notifications to localStorage", error);
    }
  };

  const dismissNotification = (id: string) => {
    const newNotifications = notifications.filter(n => n.id !== id);
    setNotifications(newNotifications);
     try {
        localStorage.setItem('notifications', JSON.stringify(newNotifications));
    } catch (error) {
        console.error("Failed to save notifications to localStorage", error);
    }
  };


  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
             <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleSidebar}
              >
                <PanelLeft />
                <span className="sr-only">Toggle Sidebar</span>
              </Button>
            <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold sm:hidden">
              <Leaf className="text-primary" />
              <span>EcoHub</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
             <ThemeToggle />
            <Popover onOpenChange={(open) => open && handleOpenNotifications()}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell />
                  {hasUnread && (
                    <span className="absolute top-0 right-0 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                  <span className="sr-only">Open notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Recent alerts and reminders.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-start gap-4 rounded-md border p-4"
                        >
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {notification.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-4">No new notifications.</p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Link href="/settings" className="cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.profilePictureUrl ?? undefined} alt={profile?.businessName} />
                <AvatarFallback>{profile?.businessName ? profile.businessName.substring(0,2).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold">
                <Leaf className="h-7 w-7 text-primary" />
                <span>EcoHub</span>
              </Link>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="mb-2 p-2 flex flex-col gap-2">
           <div className="w-full overflow-hidden">
             {loading ? (
                <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left flex-grow min-w-0">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-16 bg-muted rounded animate-pulse mt-1" />
                  </div>
                </Button>
              ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.profilePictureUrl ?? undefined} alt={profile?.businessName} />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left flex-grow min-w-0">
                        <span className="text-sm font-bold whitespace-nowrap truncate">{profile?.businessName}</span>
                        <span className="text-xs text-muted-foreground">View Profile</span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" side="right" align="start">
                   <div className="space-y-4">
                      <h4 className="font-medium">User Profile</h4>
                      <div className="space-y-2 text-sm">
                        <p className="truncate"><span className="font-medium">Business:</span> {profile?.businessName}</p>
                        <p className="truncate"><span className="font-medium">Email:</span> {user?.email}</p>
                      </div>
                      <Button variant="outline" onClick={handleSignOut} className="w-full">
                          <LogOut className="mr-2 h-4 w-4"/>
                          Sign Out
                      </Button>
                    </div>
                </PopoverContent>
              </Popover>
              )}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <footer className="border-t px-4 py-2 text-center text-xs text-muted-foreground md:px-6">
          EcoHub &copy; {new Date().getFullYear()} - Your partner in sustainability.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
        <Layout>{children}</Layout>
    </AuthProvider>
  )
}
