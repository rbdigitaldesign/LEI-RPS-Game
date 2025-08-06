
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
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="w-full"
        >
            <Card className="w-full max-w-4xl text-center bg-black/50 backdrop-blur-sm border-0 shadow-none flex flex-col justify-center items-center mx-auto">
                <CardHeader className="p-4">
                    <CardTitle className="text-5xl md:text-8xl font-black font-headline text-accent tracking-tighter">
                        RPS Pod Battle
                    </CardTitle>
                    <CardDescription className="text-lg md:text-2xl text-primary leading-relaxed mt-2">
                        The ultimate rock, paper, scissors showdown
                    </CardDescription>
                </CardHeader>
                <CardContent className="mt-8">
                    <Button 
                      onClick={onStartTournament} 
                      className="w-48 h-48 rounded-full text-lg font-black font-body text-white bg-red-600 hover:bg-red-700 border-8 border-red-800 shadow-[0_10px_0_0_#9B2C2C] active:shadow-none active:translate-y-2 transition-all duration-150 ease-in-out flex flex-col leading-tight"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Loading...' : (
                        <>
                            <span>Press</span>
                            <span>Start</span>
                        </>
                      )}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
      </main>
    </div>
  );
}
