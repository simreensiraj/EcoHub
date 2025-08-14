
'use server';

/**
 * @fileOverview This file defines a Genkit flow for scoring the overall sustainability of a business based on its practices.
 *
 * @module src/ai/flows/score-business
 *
 * @interface ScoreBusinessInput - The input type for the scoreBusiness function.
 *
 * @interface ScoreBusinessOutput - The output type for the scoreBusiness function.
 *
 * @function scoreBusiness - The main function that triggers the business scoring flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScoreBusinessInputSchema = z.object({
  businessPractices: z
    .string()
    .describe('A detailed description of the business practices.'),
});
export type ScoreBusinessInput = z.infer<typeof ScoreBusinessInputSchema>;

const ScoreBusinessOutputSchema = z.object({
    sustainabilityScore: z.number().describe("The sustainability score of the business, from 0 to 100."),
});
export type ScoreBusinessOutput = z.infer<typeof ScoreBusinessOutputSchema>;

/**
 * Scores the overall sustainability of a business based on its practices.
 * @param input - The input containing the business practices description.
 * @returns The output containing the sustainability score.
 */
export async function scoreBusiness(input: ScoreBusinessInput): Promise<ScoreBusinessOutput> {
  return scoreBusinessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreBusinessPrompt',
  input: { schema: ScoreBusinessInputSchema },
  output: { schema: ScoreBusinessOutputSchema },
  prompt: `You are a sustainability scoring expert. Your task is to evaluate the overall sustainability of a business based on its practices and assign a score from 0 to 100.

Analyze the following business practices:
"{{businessPractices}}"

Provide a holistic sustainability score. A score of 0 represents a business with highly unsustainable practices, while a score of 100 represents a business that is a paragon of sustainability. Consider environmental, social, and economic factors in your assessment.

Provide only the final score.
`,
});


const scoreBusinessFlow = ai.defineFlow(
  {
    name: 'scoreBusinessFlow',
    inputSchema: ScoreBusinessInputSchema,
    outputSchema: ScoreBusinessOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
