
'use server';

import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { updateUserProfile } from '@/services/firestore';

export async function createAccountAndProfile(email: string, businessName: string, password_do_not_use: string) {
  if (!email || !businessName || !password_do_not_use) {
    throw new Error('Email, Business Name, and password are required.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password_do_not_use);
    const user = userCredential.user;

    if (user) {
      await updateUserProfile(email, {
        businessName: businessName,
        contactEmail: email,
        website: '',
        profilePictureUrl: null,
      });
      return { success: true, message: "Account created successfully!" };
    } else {
      throw new Error("User was not created in Firebase Auth.");
    }
  } catch (error: any) {
     console.error('Error during account creation:', error);
     if (error.code === 'auth/email-already-in-use') {
         throw new Error('This email address is already in use by another account.');
     }
      if (error.code === 'auth/weak-password') {
         throw new Error('The password is too weak. Please choose a stronger password.');
     }
     throw new Error('Could not create the account. There was a server issue.');
  }
}


export async function sendPasswordReset(email: string) {
  if (!email) {
    throw new Error('Email is required to send a password reset link.');
  }
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent.' };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    // Don't reveal if the user exists or not for security reasons.
    // Instead, we can log the specific error on the server and return a generic message.
    if (error.code === 'auth/user-not-found') {
        // We can choose to still return a success-like message to prevent user enumeration
        return { success: true, message: 'If an account exists for this email, a reset link has been sent.' };
    }
    throw new Error('Could not send password reset email.');
  }
}
