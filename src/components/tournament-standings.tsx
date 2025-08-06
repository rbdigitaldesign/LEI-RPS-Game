
'use client';

import type { Standing } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TournamentStandingsProps = {
  standings: Standing[];
};

export function TournamentStandings({ standings }: TournamentStandingsProps) {
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    if (a.losses !== b.losses) {
      return a.losses - b.losses;
    }
    return b.draws - a.draws;
  });

  return (
    <Card className="bg-card border-2 sticky top-20 flex-grow flex flex-col">
      <CardHeader className="p-2">
        <CardTitle className="text-accent text-base text-center">Tournament Standings</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <Table>
          <TableHeader>
            <TableRow className="text-[10px] uppercase">
              <TableHead className="p-1 text-center w-[2rem]">#</TableHead>
              <TableHead className="p-1 w-[2rem]"></TableHead>
              <TableHead className="p-1">Pod</TableHead>
              <TableHead className="p-1 text-center">P</TableHead>
              <TableHead className="p-1 text-center text-green-500">W</TableHead>
              <TableHead className="p-1 text-center text-red-500">L</TableHead>
              <TableHead className="p-1 text-center text-yellow-500">D</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStandings.map((pod, index) => (
              <TableRow key={pod.podId} className="text-xs">
                <TableCell className="p-1 font-bold text-center">{index + 1}</TableCell>
                <TableCell className="p-1 text-lg">{pod.emoji}</TableCell>
                <TableCell className="p-1 font-bold truncate">{pod.name}</TableCell>
                <TableCell className="p-1 text-center">{pod.gamesPlayed}</TableCell>
                <TableCell className="p-1 text-center font-bold text-green-500">{pod.wins}</TableCell>
                <TableCell className="p-1 text-center font-bold text-red-500">{pod.losses}</TableCell>
                <TableCell className="p-1 text-center font-bold text-yellow-500">{pod.draws}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
