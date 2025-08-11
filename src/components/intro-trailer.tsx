
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';

const trailerLines = [
  "In a world of part 3 course development and change  proposals...",
  "...one decision rises above them all.",
  "The greatest tactical showdown LEI has ever seen...",
  "Stretch your phalanges.",
  "Flex your metacarpals.",
  "Are you ready to claim victory for your pod?",
];

type IntroTrailerProps = {
    onFinished: () => void;
};

export function IntroTrailer({ onFinished }: IntroTrailerProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= trailerLines.length) {
        const finishTimer = setTimeout(() => {
            onFinished();
        }, 1000);
        return () => clearTimeout(finishTimer);
    }
    
    const timer = setTimeout(() => {
        setIndex(index + 1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [index, onFinished]);

  return (
    <div className="flex flex-col min-h-screen bg-black items-center justify-center text-white p-4">
        <AnimatePresence mode="wait">
            <motion.p
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8 }}
                className="text-4xl sm:text-6xl text-center p-8 uppercase tracking-wider font-sans"
            >
                {trailerLines[index] || ''}
            </motion.p>
        </AnimatePresence>
        
        <div className="absolute bottom-8 right-8">
            {index < (trailerLines.length) && (
                <Button variant="ghost" onClick={onFinished}>Skip</Button>
            )}
        </div>
    </div>
  );
}
