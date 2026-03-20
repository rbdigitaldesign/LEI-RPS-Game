'use client';

import { Suspense, useEffect, useState } from 'react';
import { MainPageContent } from './main-page';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Prevents hydration mismatch by not rendering anything on server
  }

  return (
    <Suspense fallback={null}>
      <MainPageContent />
    </Suspense>
  );
}
