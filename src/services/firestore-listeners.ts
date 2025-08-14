
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import type { Post, Product, UserProfile, VoteStatus } from './firestore';

export function getPosts(userEmail: string | null, callback: (posts: Post[]) => void) {
  // Sort by creation date on the backend, which doesn't require a composite index.
  // We will sort by upvotes on the client side.
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const posts: Post[] = [];
    const sanitizedUserEmail = userEmail ? userEmail.replace(/\./g, '_') : null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert timestamp to string to avoid serialization issues
      const createdAt = data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000) : new Date();
      
      let voteStatus: VoteStatus = null;
      if (sanitizedUserEmail && data.voters && data.voters[sanitizedUserEmail]) {
        voteStatus = data.voters[sanitizedUserEmail];
      }

      posts.push({
        id: doc.id,
        title: data.title,
        author: data.author,
        businessName: data.businessName,
        upvotes: data.upvotes,
        comments: data.comments || [],
        category: data.category,
        voters: data.voters || {},
        voteStatus: voteStatus,
        createdAt: createdAt.toISOString(), // Store as ISO string
        time: createdAt.toLocaleDateString(),
      });
    });
    callback(posts);
  }, (error) => {
    console.error("Error fetching posts:", error);
  });

  return unsubscribe;
}

export function getProducts(callback: (products: Product[]) => void) {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name,
        price: data.price,
        description: data.description,
        createdAt: data.createdAt,
        authorId: data.authorId,
        businessName: data.businessName,
        status: data.status || 'available',
      });
    });
    callback(products);
  }, (error) => {
    console.error("Error fetching products:", error);
  });

  return unsubscribe;
}


export function listenToUserProfile(email: string, callback: (profile: UserProfile | null) => void) {
    if (!email) {
        callback(null);
        return () => {}; // Return an empty unsubscribe function
    }
    const profileRef = doc(db, 'profiles', email);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert Firestore Timestamp to a serializable format (ISO string)
            const profile: UserProfile = {
                ...data,
                createdAt: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
            } as UserProfile;
            callback(profile);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to user profile:", error);
        callback(null);
    });

    return unsubscribe;
}
