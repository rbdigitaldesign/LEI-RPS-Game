// app/team/[...team]/page.tsx  (Server Component for V6)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

const PODS = [
  'Owls','Racoons','Octopus','Dolphins','Orcas','Rakalis','Capybaras','Wombats',
  'Bees','Platypus','Functional Leads','Associate Directors','Portfolio Managers',
  'Pandas','Travis Cox','Cox Travis'
];

function norm(s: string) { return decodeURIComponent(s).trim().toLowerCase(); }

import TeamPageContent from '@/components/team-page-content';

export default function Page({ params }: { params: { team?: string[] } }) {
  const raw = (params.team ?? []).join('/');
  const map = new Map(PODS.map(n => [n.toLowerCase(), n]));
  const canonical = map.get(norm(raw));
  if (!canonical) {
    return <main style={{padding:24}}><h1>Team not found</h1><p>{raw || '(none)'}</p></main>;
  }
  return <TeamPageContent teamName={canonical} />;
}