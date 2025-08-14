export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
const PODS = ['Owls','Racoons','Octopus','Dolphins','Orcas','Rakalis','Capybaras','Wombats','Bees','Platypus','Functional Leads','Associate Directors','Portfolio Managers','Pandas','Travis Cox','Cox Travis'];
function norm(s:string){return decodeURIComponent(s).trim().toLowerCase();}
export default function Page({params}:{params:{team?:string[]}}){
  const raw=(params.team??[]).join('/'); const map=new Map(PODS.map(n=>[n.toLowerCase(),n]));
  const name=map.get(norm(raw)); if(!name){return <main style={{padding:24}}><h1>team not found</h1><p>{raw||'(none)'}</p></main>;}
  return <main style={{padding:24}}><h1>{name}</h1><p>route ok.</p></main>;
}