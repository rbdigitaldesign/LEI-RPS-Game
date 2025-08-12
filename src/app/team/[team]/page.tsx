// app/team/[team]/page.tsx
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const PODS = [
  'Pandas','Owls','Racoons','Octopus','Dolphins','Orcas',
  'Rakali','Capybara','Wombats','Bees','Platypus',
  'Functional Leads','Portfolio Managers','Associate Directors','Travis Cox','Cox Travis'
];

const CANON = new Map(PODS.map(n => [n.trim().toLowerCase(), n]));

type Props = { params: { team?: string } };

export default async function TeamPage({ params }: Props) {
  const key = decodeURIComponent(params.team ?? '').trim().toLowerCase();
  const name = CANON.get(key);
  if (!name) return notFound();

  // TODO: replace with real data fetch keyed by `name`
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold">{name}</h1>
      {/* team content goes here */}
    </main>
  );
}
