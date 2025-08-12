// src/app/team/[...team]/page.tsx
'use client';
import { notFound } from 'next/navigation';
import { TeamPageContent } from '@/components/team-page-content';
import { PODS } from '@/lib/constants';

const CANON = new Map(PODS.map(p => [p.name.trim().toLowerCase(), p.name]));

type Props = { params: { team?: string[] } };

export default function TeamPage({ params }: Props) {
  const segs = params.team ?? [];
  const raw = decodeURIComponent((segs[0] ?? '').trim());
  const key = raw.toLowerCase();
  const name = CANON.get(key);
  
  if (!name) return notFound();

  return <TeamPageContent teamName={name} />;
}
