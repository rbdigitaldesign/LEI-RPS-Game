'use client';

import { notFound } from 'next/navigation';
import { TeamPageContent } from '@/components/team-page-content';
import { PODS } from '@/lib/constants';

const ALIASES: Record<string, string> = {
  'rakali': 'Rakalis',
  'capybara': 'Capybaras',
};

const ALL_POD_NAMES = [...PODS.map(p => p.name), 'Cox Travis'];
const CANON = new Map(ALL_POD_NAMES.map(p => [p.trim().toLowerCase(), p]));

function resolveName(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  if (CANON.has(key)) return CANON.get(key)!;
  const aliased = ALIASES[key];
  if (aliased && CANON.has(aliased.toLowerCase())) return CANON.get(aliased.toLowerCase())!;
  return null;
}

type Props = { params: { team?: string[] } };

export default function TeamPage({ params }: Props) {
  const segs = params.team ?? [];
  const raw = decodeURIComponent(segs.join('/')).trim();
  const name = resolveName(raw);

  if (!name) {
    return notFound();
  }
  
  return <TeamPageContent teamName={name} />;
}
