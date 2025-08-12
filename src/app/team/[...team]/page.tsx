// app/team/[...team]/page.tsx
'use client';
import { notFound } from 'next/navigation';
import { TeamPageContent } from '@/components/team-page-content';
import { PODS } from '@/lib/constants';

const CANON = new Map(PODS.map(p => [p.name.trim().toLowerCase(), p.name]));
CANON.set('cox travis', 'Cox Travis'); // Add AI opponent

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type Props = { params: { team?: string[] } };

export default function TeamPage({ params }: Props) {
  const segs = params.team ?? [];
  const raw = decodeURIComponent((segs[0] ?? '').trim());
  const key = raw.toLowerCase();
  const name = CANON.get(key);
  
  if (!name) return notFound();

  return <TeamPageContent teamName={name} />;
}
