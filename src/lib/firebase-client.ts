
// src/lib/firebase-client.ts
'use client';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase'; // Use the initialized app

const storage = getStorage(app);

function sanitizeFilename(filename: string): string {
  return filename.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_\.]/g, '');
}

export async function uploadProfilePicture(
  file: File,
  userId: string // This will now be the user's UID
): Promise<string> {
  if (!file || !userId) {
    throw new Error('File and user ID are required for upload.');
  }

  const sanitizedFileName = sanitizeFilename(file.name);
  // Ensure a unique file name to prevent cache issues
  const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;
  // Use the user's UID for the folder path, which is the standard practice.
  const storageRef = ref(storage, `profile-pictures/${userId}/${uniqueFileName}`);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    if (error.code === 'storage/unauthorized') {
      throw new Error('Firebase Storage security rules do not allow this action. Please check your rules in the Firebase Console.');
    }
    throw new Error('Could not upload file. Please ensure Cloud Storage is enabled in your Firebase project and that your security rules allow write access.');
  }
}
