'use server';

/**
 * @fileOverview A battle commentary AI agent.
 *
 * - generateBattleCommentary - A function that generates dynamic battle commentary.
 * - GenerateBattleCommentaryInput - The input type for the generateBattleCommentary function.
 * - GenerateBattleCommentaryOutput - The return type for the generateBattleCommentary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBattleCommentaryInputSchema = z.object({
  pod1Name: z.string().describe('The name of the first pod.'),
  pod1Manager: z.string().describe('The name of the manager of the first pod.'),
  pod1Move: z.string().describe('The move chosen by the first pod (Rock, Paper, or Scissors).'),
  pod2Name: z.string().describe('The name of the second pod.'),
  pod2Manager: z.string().describe('The name of the manager of the second pod.'),
  pod2Move: z.string().describe('The move chosen by the second pod (Rock, Paper, or Scissors).'),
  outcome: z.string().describe('The outcome of the battle (e.g., Pod1 wins, Pod2 wins, Draw).'),
});
export type GenerateBattleCommentaryInput = z.infer<typeof GenerateBattleCommentaryInputSchema>;

const GenerateBattleCommentaryOutputSchema = z.object({
  commentary: z.string().describe('Dynamic commentary on the battle, as if spoken by a sports announcer.'),
});
export type GenerateBattleCommentaryOutput = z.infer<typeof GenerateBattleCommentaryOutputSchema>;

export async function generateBattleCommentary(
  input: GenerateBattleCommentaryInput
): Promise<GenerateBattleCommentaryOutput> {
  return generateBattleCommentaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBattleCommentaryPrompt',
  input: {schema: GenerateBattleCommentaryInputSchema},
  output: {schema: GenerateBattleCommentaryOutputSchema},
  prompt: `You are a sports announcer providing dynamic commentary for a Rock, Paper, Scissors battle between two teams.

  Pod 1: {{pod1Name}} managed by {{pod1Manager}} chose {{pod1Move}}.
  Pod 2: {{pod2Name}} managed by {{pod2Manager}} chose {{pod2Move}}.

  Outcome: {{outcome}}

  Provide commentary on the battle, including surprising insights or reasons to doubt the 'wisdom' of the move being executed. 
  Keep the commentary concise and engaging.
`,
});

const generateBattleCommentaryFlow = ai.defineFlow(
  {
    name: 'generateBattleCommentaryFlow',
    inputSchema: GenerateBattleCommentaryInputSchema,
    outputSchema: GenerateBattleCommentaryOutputSchema,
    retry: {
      maxAttempts: 3,
      backoff: {
        delay: '1s',
        maxDelay: '10s',
        multiplier: 2,
      },
    },
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
