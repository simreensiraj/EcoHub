
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { uploadProfilePicture } from '@/lib/firebase-client';
import { updateUserProfile } from '@/services/firestore';
import { Loader2, User, Camera, Upload } from 'lucide-react';
import { compressAndResizeImage } from '@/lib/image-utils';

interface ImageUploaderProps {
  userId: string;
  userEmail: string;
  currentImageUrl: string | null;
  onUploadComplete: () => void;
}

export function ImageUploader({
  userId,
  userEmail,
  currentImageUrl,
  onUploadComplete,
}: ImageUploaderProps) {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileToUpload(null);
      setPreviewUrl(null);
      return;
    };

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'File Too Large',
        description: 'Image cannot exceed 5MB.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
        const compressedFile = await compressAndResizeImage(file);
        setFileToUpload(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch(error) {
        console.error("Failed to compress image:", error);
        toast({
            title: 'Image Processing Failed',
            description: 'Could not process the selected image. Please try another one.',
            variant: 'destructive'
        });
    }
  };
  
  const handleUpload = async () => {
    if (!fileToUpload) return;

    setUploadStatus('uploading');

    try {
      const downloadURL = await uploadProfilePicture(fileToUpload, userId);
      await updateUserProfile(userEmail, { profilePictureUrl: downloadURL });
      
      toast({
        title: 'Profile Picture Updated',
        description: 'Your new picture has been saved.',
      });
      
      setFileToUpload(null);
      setPreviewUrl(null);
      onUploadComplete();
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      setUploadStatus('error');
      toast({
        title: 'Upload Failed',
        description: error.message || 'Could not upload your new picture.',
        variant: 'destructive',
      });
    } finally {
        setUploadStatus('idle');
    }
  }

  const isLoading = uploadStatus === 'uploading';
  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 relative group">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-10">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          <AvatarImage src={displayUrl ?? undefined} alt="Profile" />
          <AvatarFallback>
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>

        <Input
          id="profile-picture-upload"
          type="file"
          accept="image/png, image/jpeg, image/gif"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <Button asChild variant="outline" size="sm">
            <label htmlFor="profile-picture-upload" className="cursor-pointer">
            <Camera className="mr-2 h-4 w-4" />
            Choose Picture
            </label>
        </Button>
      </div>

       {fileToUpload && (
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground flex-1">
            New image selected. Click upload to save.
          </p>
          <Button onClick={handleUpload} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Picture
          </Button>
        </div>
      )}
    </div>
  );
}
