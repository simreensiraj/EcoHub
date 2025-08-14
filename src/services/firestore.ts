
'use server';

import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';


export interface Comment {
  author: string;
  text: string;
  createdAt: string;
}

export type VoteStatus = 'up' | 'down' | null;

export interface Post {
  id: string;
  title: string;
  author: string;
  businessName: string;
  time: any;
  upvotes: number;
  comments: Comment[];
  category: string;
  voters: { [key: string]: 'up' | 'down' };
  voteStatus: VoteStatus;
  createdAt: string; // Changed to string
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  createdAt: any;
  authorId: string;
  businessName: string;
  status: 'available' | 'sold';
}

export interface Activity {
    title: string;
    description: string;
}

export interface UserProfile {
    businessName: string;
    contactEmail: string;
    website: string;
    profilePictureUrl: string | null;
    sustainabilityScore?: number;
    recentActivities?: Activity[];
    description?: string;
    createdAt?: any; // For date of joining
}


export async function updateUserProfile(email: string, profileData: Partial<UserProfile>) {
    if (!email) throw new Error("User email is required to update a profile.");
    const profileRef = doc(db, 'profiles', email);
    try {
        const docSnap = await getDoc(profileRef);
        const isNewUser = !docSnap.exists();

        const updateData: Partial<UserProfile> = { ...profileData };

        // Only set createdAt if the user is new
        if (isNewUser) {
          updateData.createdAt = serverTimestamp();
        }

        await setDoc(profileRef, updateData, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw new Error("Could not update user profile in the database.");
    }
}

export async function getUserProfile(email: string): Promise<UserProfile | null> {
    if (!email) return null;
    const profileRef = doc(db, 'profiles', email);
    try {
        const docSnap = await getDoc(profileRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert Firestore Timestamp to a serializable format (ISO string)
            const profile: UserProfile = {
                ...data,
                createdAt: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
            } as UserProfile;
            return profile;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw new Error("Could not fetch user profile from the database.");
    }
}
