
'use client';

import { Leaf } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex items-center justify-center">
        <Leaf className="h-16 w-16 text-primary animate-pulse" />
      </div>
    </div>
  );
}
