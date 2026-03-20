'use client';

import { Suspense, useEffect, useState } from 'react';
import { MainPageContent } from './main-page';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white font-mono">LOADING BATTLEGROUND...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <MainPageContent />
    </Suspense>
  );
}
