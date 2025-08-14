
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Leaf, LogIn, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/services/firestore';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function SignInPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    form.clearErrors();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      const userProfile = await getUserProfile(userCredential.user.email!);
      
      toast({
          title: "Sign In Successful!",
          description: "Welcome back!",
      });
      
      if (userProfile && userProfile.description) {
         router.push('/dashboard');
      } else {
         router.push('/onboarding/start');
      }

    } catch (error: any) {
      console.error("Failed to sign in:", error);
      let errorMessage = "Could not sign in. Please check your email and password.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMessage = "Invalid email or password. Please try again.";
      }
      toast({
          title: "Sign In Failed",
          description: errorMessage,
          variant: "destructive"
      });
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <div className="flex justify-center items-center mb-4">
                 <Leaf className="h-12 w-12 text-primary" />
            </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Welcome Back to EcoHub</h1>
          <p className="mt-2 text-muted-foreground">Sign in to manage your sustainability goals.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., contact@yourbusiness.com" {...field} disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col items-center gap-2">
                <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : <><LogIn className="mr-2 h-5 w-5" /> Sign In</>}
                </Button>
                <Link href="/forgot-password" passHref>
                    <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-sm"
                    >
                        Forgot Password?
                    </Button>
                </Link>
            </div>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/" className="font-semibold text-primary hover:underline">
                Sign up
            </Link>
        </p>
    </div>
  );
}
