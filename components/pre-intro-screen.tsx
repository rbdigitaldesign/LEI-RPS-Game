

'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

type PreIntroScreenProps = {
    onStart: () => void;
};

export function PreIntroScreen({ onStart }: PreIntroScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-black items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <Button
          onClick={onStart}
          variant="ghost"
          size="icon"
          className="w-24 h-24 text-white/50 hover:text-white hover:bg-white/10"
        >
          <Play className="w-20 h-20" />
          <span className="sr-only">Play</span>
        </Button>
      </motion.div>
    </div>
  );
}
