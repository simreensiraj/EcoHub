
'use server';

/**
 * @fileOverview This file defines a Genkit flow for scoring the sustainability impact of a business activity.
 *
 * @module src/ai/flows/score-activity
 *
 * @interface ScoreActivityInput - The input type for the scoreActivity function.
 *
 * @interface ScoreActivityOutput - The output type for the scoreActivity function.
 *
* @function scoreActivity - The main function that triggers the activity scoring flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScoreActivityInputSchema = z.object({
  activityDescription: z
    .string()
    .describe('A description of the business activity to score.'),
  businessPractices: z
    .string()
    .describe('The general practices of the business for context.'),
});
export type ScoreActivityInput = z.infer<typeof ScoreActivityInputSchema>;

const ScoreActivityOutputSchema = z.object({
    scoreChange: z.number().describe("The change in sustainability score. Can be positive, negative, or zero."),
});
export type ScoreActivityOutput = z.infer<typeof ScoreActivityOutputSchema>;

/**
 * Scores the sustainability impact of a given business activity.
 * @param input - The input containing the activity description and business context.
 * @returns The output containing the score change.
 */
export async function scoreActivity(input: ScoreActivityInput): Promise<ScoreActivityOutput> {
  return scoreActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreActivityPrompt',
  input: { schema: ScoreActivityInputSchema },
  output: { schema: ScoreActivityOutputSchema },
  prompt: `You are a sustainability scoring expert. Your task is to evaluate a single business activity and determine its impact on an overall sustainability score. The score is out of 100.

The business context is as follows:
{{businessPractices}}

Analyze the following activity:
"{{activityDescription}}"

Based on this activity, determine the change to the sustainability score.
- A significant positive action should result in a score change between +3 and +7.
- A minor positive action should result in a score change between +1 and +2.
- An irrelevant action should result in a score change of 0.
- A minor negative action should result in a score change between -1 and -2.
- A significant negative action should result in a score change between -3 and -7.

Provide only the score change.
`,
});


const scoreActivityFlow = ai.defineFlow(
  {
    name: 'scoreActivityFlow',
    inputSchema: ScoreActivityInputSchema,
    outputSchema: ScoreActivityOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
