
'use client';

import {
  addProduct,
  deleteProduct,
  updateProduct,
  updateProductStatus,
} from './actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getProducts, type Product } from '@/services/firestore-listeners';
import { useAuth } from '@/hooks/use-auth';
import {
  Loader2,
  PlusCircle,
  Recycle,
  MoreVertical,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

export default function GreenMartPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const invalidateSustainabilityData = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('sustainabilityScore');
      localStorage.removeItem('sustainabilityImprovements');
      localStorage.removeItem('sdgData');
    } catch (error) {
      console.error(
        'Failed to invalidate sustainability data from localStorage',
        error
      );
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeProducts = getProducts((newProducts) => {
      setProducts(newProducts);
      setIsLoading(false);
    });

    return () => {
        unsubscribeProducts();
    };
  }, []);

  const handleContactSeller = (product: Product) => {
    if (!product.authorId || !profile || !user?.email) return;
    const buyerBusinessName = profile.businessName || 'a potential buyer';
    const buyerContactEmail = user.email || 'their email';
    const mailtoLink = `mailto:${product.authorId}?subject=Interest in your GreenMart item: ${product.name}&body=Hello ${product.businessName},%0D%0A%0D%0AI saw your listing for "${product.name}" on EcoHub's GreenMart and I am interested in purchasing it.%0D%0A%0D%0APlease let me know the next steps.%0D%0A%0D%0AThank you,%0D%0A${buyerBusinessName}%0D%0A${buyerContactEmail}`;
    window.location.href = mailtoLink;
    toast({
        title: 'Opening Email Client',
        description: `You can now contact the seller for "${product.name}".`
    });
  };

  const resetForm = () => {
    setCurrentProduct(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
  };
  
  const handleOpenDialog = (product: Product | null = null) => {
    if (product) {
      setCurrentProduct(product);
      setProductName(product.name || '');
      setProductDescription(product.description || '');
      setProductPrice(product.price?.toString() || '');
    } else {
      resetForm();
    }
    setIsSellDialogOpen(true);
  };

  const handleSubmitProduct = async () => {
    const priceNumber = parseFloat(productPrice);
    if (!productName || !productDescription || !productPrice || isNaN(priceNumber)) {
      toast({
        title: 'Incomplete Form',
        description: 'Please fill out all fields with valid information.',
        variant: 'destructive',
      });
      return;
    }
    if (!user || !profile) {
        toast({ title: "Authentication Error", description: "Could not identify user. Please sign in again.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);

    try {
      if (currentProduct) {
        await updateProduct(
          currentProduct.id,
          productName,
          priceNumber,
          productDescription,
        );
        toast({ title: 'Product Updated!', description: `${productName} has been successfully updated.` });
      } else {
        await addProduct(
          productName,
          priceNumber,
          productDescription,
          user.email!,
          profile.businessName,
        );
        invalidateSustainabilityData();
        toast({ title: 'Item Listed!', description: `${productName} has been added to the GreenMart.` });
      }

      setIsSellDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to submit product:', error);
      toast({
        title: `Error ${currentProduct ? 'Updating' : 'Listing'} Item`,
        description: `Could not ${currentProduct ? 'update' : 'list'} your item. Please try again later.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      toast({ title: 'Product Deleted', description: 'The product has been removed from the marketplace.' });
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: 'Error Deleting Product',
        description: 'Could not delete the product. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSoldStatus = async (product: Product) => {
    const newStatus = product.status === 'sold' ? 'available' : 'sold';
    try {
      await updateProductStatus(product.id, newStatus);
      toast({
        title: `Product Marked as ${newStatus === 'sold' ? 'Sold' : 'Available'}`,
        description: `Buyers will now see the updated status.`,
      });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Error Updating Status',
        description: 'Could not update the product status. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Recycle /> GreenMart
          </h1>
          <p className="text-muted-foreground">
            Turn your waste into wealth. Buy and sell recyclable materials.
          </p>
        </div>
        <Dialog open={isSellDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); setIsSellDialogOpen(isOpen);}}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Sell Your Waste
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentProduct ? 'Edit Your Product' : 'Sell Your Waste Material'}</DialogTitle>
              <DialogDescription>{currentProduct ? 'Update the details of your product listing below.' : 'Fill out the details below to list your item on the GreenMart.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input id="item-name" placeholder="e.g., Used Cooking Oil" value={productName} onChange={(e) => setProductName(e.target.value)} disabled={isSubmitting} />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="item-price">Price (in AED per kg)</Label>
                <Input id="item-price" type="number" placeholder="e.g., 50" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} disabled={isSubmitting} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="item-description">Description</Label>
                <Textarea id="item-description" placeholder="Provide details about the material, its condition, and quantity." value={productDescription || ''} onChange={(e) => setProductDescription(e.target.value)} disabled={isSubmitting}/>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmitProduct} disabled={isSubmitting || authLoading}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentProduct ? 'Save Changes' : 'List Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading || authLoading
          ? [...Array(8)].map((_, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 pt-2">
                  <Skeleton className="h-6 w-1/4 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          : products.length === 0
          ? <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center p-8 border rounded-lg">
              <h3 className="text-lg font-semibold">The marketplace is empty.</h3>
              <p className="text-muted-foreground mt-1">Be the first to list an item for sale!</p>
            </div>
          : products.map((product) => (
              <Card key={product.id} className="flex flex-col relative overflow-hidden transition-shadow hover:shadow-lg">
                <CardHeader className="flex-row items-start justify-between pb-2">
                  <div className="flex-grow">
                    <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                    <p className="text-xs text-muted-foreground pt-1">
                      Sold by <Link href={product.authorId === user?.email ? '/dashboard' : `/profile/${encodeURIComponent(product.authorId)}`} className="font-medium text-foreground hover:underline">{product.businessName}</Link>
                    </p>
                  </div>
                   {product.authorId === user?.email && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 -mt-2"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(product)}><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleSoldStatus(product)}>
                          {product.status === 'sold' ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                          <span>{product.status === 'sold' ? 'Mark as Available' : 'Mark as Sold'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. This will permanently delete your product listing.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteProduct(product.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
                <CardContent className="flex-grow py-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 pt-2">
                    <div className="w-full flex justify-between items-center">
                        <p className="font-bold text-primary text-lg">{product.price} AED / kg</p>
                        {product.status === 'sold' && (<Badge variant="destructive" className="shadow-md">Sold</Badge>)}
                    </div>
                    <Button className="w-full" variant="secondary" onClick={() => handleContactSeller(product)} disabled={product.status === 'sold' || product.authorId === user?.email}>
                        {product.authorId === user?.email ? 'This is your listing' : product.status === 'sold' ? 'Item Unavailable' : 'Contact Seller'}
                    </Button>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  );
}
