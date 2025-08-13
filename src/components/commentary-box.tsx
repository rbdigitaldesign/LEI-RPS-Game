
'use client';

import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion, AnimatePresence } from 'framer-motion';

const commentaryItems = [
  "Quick reminder folks: your next payday is Thursday 4 September.",
  "Hey Media pod, what is the charge? Throwing a rock? A succulent Chinese rock?!",
  "Hey Media pod, just get your press secretary to win this tournament so you can all relax.",
  "Hey Dolphin pod, is anyone wishing they could be playing Magic: The Gathering right now?",
  "Dolphin pod, please don’t performance manage anyone if they lose.",
  "Wombat pod, if you’re struggling, just tell the hosts you’ve got network issues from your “remote” workplace.",
  "Wombat pod, longing for Smart Storyboard yet?",
  "Panda Pod, if you’re having issues with this tournament, log a ticket with MyUni support.",
  "Octopod, the only team whose name also sounds like an occupation.",
  "Octopod, remember — no OH&S breaches from rocks or scissors here.",
  "Owl pod, parliament now in session.",
  "Alpacas pod… or whatever name you’re going by this week.",
  "If you think this activity is pointless, try a VC town hall.",
  "The beauty of RPS is these are three things impossible to merge… State Government, hold my beer.",
  "Can someone explain RPS to the newbies? BFFR.",
  "The chances of winning RPS are about the same as a new AU student dropping out.",
  "These jokes are authorised by the Integration Management Office.",
  "This tournament is sponsored by the NTEU… unless you’re not a member.",
  "The prize for winning this tournament is an upgrade to a working water tap on your level.",
  "The runner-up gets to explain pedagogy to the new VC.",
  "The champion gets to hear the VC try to explain pedagogy.",
  "Faculty have their own version of RPS — it’s called “Caught Between a Rock and a Hard Place.”",
  "The two VCs allegedly play RPS before every town hall to decide who gets the spicy questions.",
  "Fun fact: RPS is how blank spots in the org chart are filled.",
  "Coming soon: RPS v2.0 with DLC Bomb & Laser, plus “Sulking Because You Lost” mode.",
  "If I got paid to play rock-paper-scissors, I’d be making money hand over fist.",
  "The Rock said he could beat any wrestler; I asked, “What about one named Paper?”",
  "Make stone scissors to cut paper — call them Rock Paper Scissors.",
  "If a tree beats a rock in the forest, does anyone look for broken scissors?",
  "Rock music always beats Scissors’ sister — at least on Paper.",
  "Walk around the office with scissors and literally cut ties with coworkers.",
  "Whoever keeps stealing my scissors needs to cut it out.",
  "Won RPS with a cop — he said “Papers,” I said “Scissors” and drove off.",
  "Rap is like scissors — it always loses to rock.",
  "Remember: changing your throw every round keeps your opponent guessing.",
  "Going for rock three times in a row? Bold move.",
  "The paper-first strategy works… until it doesn’t.",
  "Never underestimate the psychological power of a well-timed scissor throw.",
  "Some say starting with rock sends a message — but is it the right one?",
  "A mixed pattern keeps your opponent on their toes.",
  "If you’ve thrown paper twice, they’re expecting scissors… or are they?",
  "Rock is reliable, but too much of it is just predictable geology.",
  "Paper is the stealthiest throw — it looks harmless until it wins.",
  "Scissors are for the confident and the crafty.",
  "The perfect throw is the one they least expect.",
  "The key to victory? Confidence… and maybe a little luck.",
  "Sometimes it’s less about what you throw, and more about what they think you’ll throw.",
  "Reverse psychology is risky — unless your opponent is overthinking too.",
  "Balance your throws — too much of one is an open book.",
  "It’s not cheating if you win with style.",
  "Don’t let one loss shake your next throw.",
  "Paper to open, scissors to close — it’s a classic.",
  "Rock, paper, scissors — the eternal cycle of triumph and defeat.",
  "Today is World Rock Paper Scissors Day. Celebrated annually on August 27th. It's a day to enjoy the simple, yet globally recognised game and its role in decision-making and social interaction.",
  "This game dates back to the Han Dynasty in China, where it was called shoushiling.",
  "The original Chinese version featured animals like frog, slug, and snake instead of rock, paper, scissors.",
  "Japan adopted the game as sansukumi-ken, meaning “three afraid of each other.”",
  "One Japanese variation had a fox, a village headman, and a hunter as the three elements.",
  "Britain first heard of the game in 1924 under the name zhot.",
  "The US popularised the modern rock, paper, scissors format in the 1930s.",
  "In parts of the US, it’s called “Roshambo,” possibly named after a French general.",
  "In Japan, janken is still a go-to way to settle small disputes.",
  "The game often features in Japanese promotions and even drinking games.",
  "Today, RPS is recognised worldwide as the fastest way to make a decision."
];

const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

type CommentaryBoxProps = {
  show: boolean;
};

export function CommentaryBox({ show }: CommentaryBoxProps) {
  console.log('CommentaryBox show prop:', show);

  const [commentaryQueue, setCommentaryQueue] = useState<string[]>([]);
  const [currentCommentaryIndex, setCurrentCommentaryIndex] = useState(0);

  useEffect(() => {
    const welcomeMessage = "Welcome to the very first LEI RPS Pod Battle. Let's get ready to rumble!";
    setCommentaryQueue([welcomeMessage, ...shuffleArray([...commentaryItems])]);
  }, []);
  
  useEffect(() => {
    if (!show || commentaryQueue.length === 0) return;

    const commentaryInterval = setInterval(() => {
      setCurrentCommentaryIndex(prevIndex => (prevIndex + 1) % commentaryQueue.length);
    }, 7000);

    return () => clearInterval(commentaryInterval);
  }, [show, commentaryQueue.length]);
  
  if (!show) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-w-[calc(100%-2rem)] h-48 flex flex-col p-4 z-50">
        <CardHeader className="p-0 pb-2 flex-shrink-0">
        <CardTitle className="font-headline flex items-center gap-2 text-lg font-semibold">
            <Bot size={20}/>
            LEI Commentary
        </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
            <motion.p
            key={currentCommentaryIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="text-foreground italic text-center text-lg"
            >
            &ldquo;{commentaryQueue[currentCommentaryIndex]}&rdquo;
            </motion.p>
        </AnimatePresence>
        </CardContent>
    </Card>
  );
}