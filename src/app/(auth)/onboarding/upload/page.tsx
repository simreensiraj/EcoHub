
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { analyzeBusinessDocument } from '../actions';
import { useAuth } from '@/hooks/use-auth';
import { updateUserProfile } from '@/services/firestore';

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF document.');
        setFile(null);
      } else if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size cannot exceed 5MB.');
        setFile(null);
      }
      else {
        setFile(selectedFile);
        setError(null);
      }
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    if (!user?.email) {
      setError('Authentication error. Please sign in again.');
      return;
    }
    
    setError(null);
    
    startTransition(async () => {
      try {
        toast({
          title: "Analyzing Document...",
          description: "Our AI is reading your document. This may take a moment.",
        });
        
        const formData = new FormData();
        formData.append('file', file);

        const businessPracticesSummary = await analyzeBusinessDocument(formData);
        
        await updateUserProfile(user.email!, { description: businessPracticesSummary });
        // Trigger a storage event to let other tabs know the profile has been updated
        window.localStorage.setItem('businessPractices', businessPracticesSummary);


        toast({
          title: "Analysis Complete!",
          description: "Your business profile has been generated from the document.",
        });

        router.push('/dashboard');

      } catch (err: any) {
        console.error("Analysis failed:", err);
        toast({
          title: "Analysis Failed",
          description: err.message || "There was an error analyzing your document. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const isUploading = isPending;

  return (
    <div className="w-full">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Upload Business Document</CardTitle>
          <CardDescription>
            Upload your business plan, mission statement, or other relevant documents (PDF only, max 5MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-document">Document</Label>
            <div className="flex items-center gap-2">
                <Input id="business-document" type="file" onChange={handleFileChange} accept=".pdf" disabled={isUploading} />
            </div>
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload and Analyze
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
