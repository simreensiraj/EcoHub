
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

export async function addProduct(
  name: string,
  price: number,
  description: string,
  authorId: string,
  businessName: string,
) {
  if (!name || !price || !description || !authorId || !businessName) {
    throw new Error('Missing required form data for creating a product.');
  }

  try {
    const product = {
      name,
      price,
      description,
      authorId,
      businessName,
      status: 'available',
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'products'), product);
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error("Could not add product due to a server error.");
  }
}

export async function updateProduct(
  productId: string,
  name: string,
  price: number,
  description: string,
) {
  if (!productId || !name || !price || !description) {
    throw new Error('Missing required form data for updating a product.');
  }
  const productRef = doc(db, 'products', productId);
  try {
    const data: any = { name, price, description };
    await updateDoc(productRef, data);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw new Error("Could not update product due to a server error.");
  }
}

export async function deleteProduct(productId: string) {
  if (!productId) {
    throw new Error('Missing product ID for deletion.');
  }
  const productRef = doc(db, 'products', productId);
  try {
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw new Error("Could not delete product due to a server error.");
  }
}

export async function updateProductStatus(
  productId: string,
  status: 'available' | 'sold'
) {
  if (!productId || !status) {
    throw new Error('Missing required data for updating product status.');
  }
  const productRef = doc(db, 'products', productId);
  try {
    await updateDoc(productRef, { status });
  } catch (error) {
    console.error("Error updating status: ", error);
    throw new Error("Could not update product status due to a server error.");
  }
}

    