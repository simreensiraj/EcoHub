
import { Leaf } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <Leaf className="h-7 w-7 text-primary" />
            <span className="hidden sm:inline-block">EcoHub</span>
        </Link>
      </div>
      <div className="w-full max-w-md space-y-6">
        <Suspense fallback={<div>Loading...</div>}>
            {children}
        </Suspense>
      </div>
    </div>
  );
}
