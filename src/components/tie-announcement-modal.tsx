
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Handshake } from 'lucide-react';

export function TieAnnouncementModal() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="text-center bg-card border-yellow-500 border-4 shadow-2xl shadow-yellow-500/20">
          <CardHeader>
             <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="mx-auto"
            >
                <Handshake className="w-16 h-16 text-yellow-500" />
            </motion.div>
            <CardTitle className="text-6xl font-black font-headline tracking-tighter text-yellow-500">DRAW</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-muted-foreground">A rematch is taking place to settle the score!</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
