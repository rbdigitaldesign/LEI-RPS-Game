
'use client';

import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { TournamentState, Match, Pod, Move } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Skull } from 'lucide-react';

type TournamentReportProps = {
  tournament: TournamentState | null;
};

const getEmojiForMove = (move: string) => {
  switch (move) {
    case 'rock': return '🪨';
    case 'paper': return '📄';
    case 'scissors': return '✂️';
    default: return '';
  }
};

export function TournamentReport({ tournament }: TournamentReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportPDF = async () => {
    if (!reportRef.current || !tournament) return;

    setIsGenerating(true);

    const element = reportRef.current;
    
    // Temporarily make the element visible for capture
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '-9999px';
    element.style.display = 'block';
    element.style.width = '800px';

    const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        backgroundColor: '#1a1a1a'
    });

    // Hide the element again
    element.style.position = '';
    element.style.left = '';
    element.style.top = '';
    element.style.display = 'none';

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`RPS_Pod_Battle_Report_${new Date().toISOString().slice(0, 10)}.pdf`);

    setIsGenerating(false);
  };
  
  if (!tournament || !tournament.winner) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={isGenerating}
      >
        <Download className="mr-2" />
        {isGenerating ? 'Generating...' : 'Export'}
      </Button>

      <div ref={reportRef} className="p-8 bg-background text-foreground" style={{ display: 'none' }}>
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-headline text-accent">RPS Pod Battle</h1>
            <p className="text-lg text-primary">Tournament Report</p>
        </div>

        {tournament.winner && (
             <div className="mb-12">
                <Card className="w-full max-w-lg mx-auto text-center bg-card border-4 border-accent">
                    <CardHeader>
                        <p className="text-sm font-medium text-accent">Ultimate Pod Champion</p>
                        <CardTitle className="text-5xl font-bold font-headline tracking-tighter text-primary">{tournament.winner.name}</CardTitle>
                        <p className="text-muted-foreground">Represented by {tournament.winner.manager}</p>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <div className="relative w-48 h-48 border-4 border-primary bg-secondary flex items-center justify-center">
                            <span className="text-8xl">{tournament.winner.emoji}</span>
                        </div>
                        <div className="flex items-center gap-2 text-2xl font-semibold text-primary">
                            <Trophy className="w-8 h-8"/>
                            <span>Absolute Victory!</span>
                        </div>
                    </CardContent>
                </Card>
             </div>
        )}

        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-accent uppercase tracking-widest mb-4">
                Match Results
            </h2>
            <div className="space-y-4">
                {tournament.rounds.flatMap(r => r.matches).filter(m => m.winner).map((match: Match) => (
                    <Card key={match.id} className="bg-card border-2 border-primary/50 p-4">
                        <div className="grid grid-cols-3 items-center text-center">
                            <div className="font-bold text-lg text-primary">{match.pod1?.name}</div>
                            <div className="text-xl font-bold text-accent">VS</div>
                            <div className="font-bold text-lg text-primary">{match.pod2?.name}</div>
                        </div>
                        {match.winner && (
                              <div className="text-center mt-2">
                                <p className="font-semibold text-accent">Winner: {match.winner.name}</p>
                                <div className="flex justify-center items-center gap-4 mt-1">
                                    {match.moveHistory?.map((moves: { pod1: Move; pod2: Move; }, index: number) => (
                                        <div key={index} className="flex gap-2 text-2xl">
                                            <span>{getEmojiForMove(moves.pod1)}</span>
                                            <span>vs</span>
                                            <span>{getEmojiForMove(moves.pod2)}</span>
                                        </div>
                                    ))}
                                </div>
                              </div>
                        )}
                        {match.isDraw && (
                            <div className="text-center mt-2">
                                <p className="font-semibold text-yellow-500">Draw</p>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
      </div>
    </>
  );
}
