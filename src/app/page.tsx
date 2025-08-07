
'use client';

import { Suspense } from 'react';
import { MainPageContent } from '@/components/main-page';

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainPageContent />
    </Suspense>
  );
}
