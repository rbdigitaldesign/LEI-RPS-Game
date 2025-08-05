
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const trailerLines = [
  "In a world of part 3 course development and change  proposals...",
  "...one decision rises above them all.",
  "The greatest show of tactical prowess LEI has ever seen...",
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
    <div className="flex flex-col min-h-screen bg-black items-center justify-center text-white">
        <AnimatePresence mode="wait">
            <motion.p
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8 }}
                className="text-4xl text-center font-headline p-8"
            >
                {trailerLines[index]}
            </motion.p>
        </AnimatePresence>
    </div>
  );
}
