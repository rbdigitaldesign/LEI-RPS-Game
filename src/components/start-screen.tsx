
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Header } from './header';

type StartScreenProps = {
    onStartTournament: () => void;
    isProcessing: boolean;
};

export function StartScreen({ onStartTournament, isProcessing }: StartScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-hero-pattern bg-cover bg-center bg-fixed">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            <Card className="w-full max-w-2xl text-center bg-black/80 backdrop-blur-sm border-2 border-primary min-h-[280px] flex flex-col justify-center mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline text-accent">RPS Pod Battle</CardTitle>
                    <CardDescription className="text-sm text-primary leading-relaxed">The ultimate rock, paper, scissors showdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground text-xs">
                        LEI Monthly Meeting — 27th August 2025
                    </p>
                    <Button 
                      size="lg" 
                      onClick={onStartTournament} 
                      className="w-full text-lg mt-4 font-body text-background bg-accent hover:bg-accent/90 border-4 border-b-8 border-accent-foreground/50 hover:border-b-4 active:border-b-0 active:mt-[10px] active:mb-[6px] transition-all duration-100" 
                      disabled={isProcessing}
                    >
                        {isProcessing ? 'Loading...' : 'Press Start'}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
      </main>
    </div>
  );
}
