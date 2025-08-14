// app/components/team-page-content.tsx  (Client Component for V6)
'use client';
import { useState, useEffect } from 'react';

export default function TeamPageContent({ teamName }: { teamName: string }) {
  // TODO: restore the real gameplay UI/state here (this file is client-safe).
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return (
    <main style={{padding:24}}>
      <h1>{teamName}</h1>
      {ready ? <p>Gameplay UI goes here.</p> : <p>Loading…</p>}
    </main>
  );
}