
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';

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
import { sendPasswordReset } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await sendPasswordReset(values.email);
      toast({
        title: 'Check your email',
        description: 'If an account with that email exists, a password reset link has been sent to it.',
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Could not send password reset email. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
                Enter your email address and we will send you a link to reset your password.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <div className="space-y-2">
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                        </>
                    ) : (
                        <>
                            <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                        </>
                    )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Do check the spam folder.
                    </p>
                </div>
            </form>
            </Form>
             <Button variant="link" asChild className="mt-4 px-0">
                <Link href="/signin">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back to Sign In
                </Link>
            </Button>
        </CardContent>
    </Card>
  );
}
