// app/team/[...team]/page.tsx
import { notFound } from 'next/navigation';
import { TeamPageContent } from '@/components/team-page-content';
import { PODS } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Add safe aliases so legacy links and singular/plural resolve
const ALIASES: Record<string, string> = {
  'rakali': 'Rakalis',
  'rakalis': 'Rakalis',
  'capybara': 'Capybaras',
  'capybaras': 'Capybaras',
  'cox travis': 'Cox Travis',
  'travis cox': 'Travis Cox',
};

const CANON = new Map(
  PODS.map(p => [p.name.trim().toLowerCase(), p.name])
);
CANON.set('cox travis', 'Cox Travis');


// Resolve by canonical first, then aliases
function resolveName(raw: string): string | null {
  const key = raw.trim().toLowerCase();
  const aliased = ALIASES[key];
  if (aliased && CANON.has(aliased.toLowerCase())) return CANON.get(aliased.toLowerCase())!;
  if (CANON.has(key)) return CANON.get(key)!;
  return null;
}

type Props = { params: { team?: string[] } };

export default async function TeamPage({ params }: Props) {
  const segs = params.team ?? [];
  const raw = decodeURIComponent((segs[0] ?? '').trim());
  const name = resolveName(raw);
  if (!name) return notFound();

  return <TeamPageContent teamName={name} />;
}
