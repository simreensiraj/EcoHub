
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  getDoc,
  writeBatch
} from 'firebase/firestore';

export async function addPost(
  title: string,
  category: string,
  businessName: string,
  author: string
) {
  if (!title || !category || !businessName || !author) {
    throw new Error('Missing required form data for creating a post.');
  }

  try {
    const post = {
      title,
      category,
      businessName,
      author,
      upvotes: 0,
      comments: [],
      createdAt: serverTimestamp(),
      voters: {}, // Initialize voters map
    };
    await addDoc(collection(db, 'posts'), post);
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add post due to a server error.");
  }
}

export async function handleVote(
  postId: string,
  userId: string,
  voteIncrement: number,
  newVoteStatus: 'up' | 'down' | null
) {
  if (!postId || !userId || typeof voteIncrement !== 'number') {
    throw new Error('Missing required data for voting.');
  }

  const postRef = doc(db, 'posts', postId);

  try {
    const batch = writeBatch(db);
    
    // Update the vote count
    batch.update(postRef, { upvotes: increment(voteIncrement) });

    // Update the voter's status
    const voterField = `voters.${userId.replace(/\./g, '_')}`; // Sanitize email for field path
    if (newVoteStatus) {
      batch.update(postRef, { [voterField]: newVoteStatus });
    } else {
      const docSnap = await getDoc(postRef);
      if (docSnap.exists()) {
        const postData = docSnap.data();
        if (postData.voters && postData.voters[userId.replace(/\./g, '_')]) {
           // Field exists, so we can update it to be removed.
           // Firestore doesn't have a direct 'remove field' in dot notation for updates,
           // so we set it to null or a sentinel value if needed, or reconstruct the map.
           // For simplicity, setting to null works if we handle it on the client.
           // A more robust way is to read, modify, and write the whole voters map.
           // Let's set to null and handle on client.
           batch.update(postRef, { [voterField]: null });
        }
      }
    }

    await batch.commit();

  } catch (error) {
    console.error("Error updating vote: ", error);
    throw new Error("Could not update vote due to a server error.");
  }
}

export async function addComment(postId: string, commentText: string, author: string) {
  if (!postId || !commentText || !author) {
      throw new Error('Missing required data for commenting.');
  }

  const postRef = doc(db, 'posts', postId);
  const newComment = {
      text: commentText,
      author: author,
      createdAt: new Date().toISOString(),
  };

  try {
      await updateDoc(postRef, {
          comments: arrayUnion(newComment)
      });
  } catch (error) {
      console.error("Error adding comment: ", error);
      throw new Error("Could not add comment due to a server error.");
  }
}
