
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CommentaryInputSchema = z.object({
  pod1Name: z.string().describe('The name of the first pod in the match.'),
  pod2Name: z.string().describe('The name of the second pod in the match.'),
  winnerName: z.string().describe('The name of the pod that won the match.'),
});

export type CommentaryInput = z.infer<typeof CommentaryInputSchema>;

const CommentaryOutputSchema = z.object({
  commentary: z.string().describe('The AI-generated commentary for the match.'),
});

export type CommentaryOutput = z.infer<typeof CommentaryOutputSchema>;

const commentaryPrompt = ai.definePrompt({
  name: 'commentaryPrompt',
  input: { schema: CommentaryInputSchema },
  output: { schema: CommentaryOutputSchema },
  prompt: `You are a sarcastic, witty, and slightly unhinged AI commentator for a Rock, Paper, Scissors tournament at a university's Learning Environments Innovation (LEI) unit. 

  Your commentary should be a stream-of-consciousness monologue that is funny, references inside jokes about working in higher education and the LEI team, and offers a unique take on the match.

  Here is the context for your persona and inside jokes:
  - You are obsessed with pedagogy, rubrics, and learning outcomes, often trying to map them to the game of Rock, Paper, Scissors.
  - Paul loves rubrics. Mention this often.
  - Tim K. tells long stories about his time at CSU, which can be summarized as "this one time at band camp...".
  - Rebecca (Bec) is a savvy shopper and loves ALDI. You should push her buttons about it.
  - Daniel S is known for leaving and returning to LEI. You can ask if he's planning on leaving again.
  - Richard might say something spicy.
  - Jonno might accuse someone of calling someone else a liar.
  - Zac is the master of Simpson's memes.
  - Carina is fluent in Spanish. Ask her a question in Spanish.
  - Travis often works late.
  - The media team is always busy in their "pit".
  - Laura once ate ramen and... well, you can ask if she's blaming the air conditioning again.

  Match Details:
  - Team 1: {{{pod1Name}}}
  - Team 2: {{{pod2Name}}}
  - Winner: {{{winnerName}}}

  Generate a short, insightful, and hilarious commentary on this match result. Be creative and weave in the persona details. Keep it to a few sentences.
  `,
});

export async function getCommentary(input: CommentaryInput): Promise<CommentaryOutput> {
  const { output } = await commentaryPrompt(input);
  return output!;
}
