
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Leaf, UserPlus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
import { createAccountAndProfile } from './actions';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const signUpFormSchema = z
  .object({
    email: z.string().email('Please enter a valid email address.'),
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export default function SignUpPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: '',
      businessName: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    try {
      await createAccountAndProfile(
        values.email,
        values.businessName,
        values.password
      );
      
      // After successful creation, sign the user in automatically
      await signInWithEmailAndPassword(auth, values.email, values.password);

      toast({
        title: 'Account Created!',
        description: "You are now signed in. Let's get you set up.",
      });

      // Redirect to onboarding
      router.push('/onboarding/start');
    } catch (error: any) {
      console.error('Sign-up process failed:', error);
      toast({
        title: 'Sign-Up Error',
        description:
          error.message || 'Could not complete sign-up. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <>
      {form.formState.isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Leaf className="h-16 w-16 text-primary animate-pulse" />
            <p className="text-lg font-medium text-muted-foreground">
              Creating your account...
            </p>
          </div>
        </div>
      )}
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Leaf className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Get Started with EcoHub
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create your account to begin your sustainability journey.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g., The Green Cafe"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g., contact@yourbusiness.com"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
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
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" /> Create Account
                </>
              )}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/signin"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
