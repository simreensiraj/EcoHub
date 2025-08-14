
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating SDG compliance data based on business practices.
 *
 * @module src/ai/flows/generate-sdg-compliance
 *
 * @interface GenerateSdgComplianceInput - The input type for the generateSdgCompliance function.
 *
 * @interface GenerateSdgComplianceOutput - The output type for the generateSdgCompliance function.
 *
 * @function generateSdgCompliance - The main function that triggers the SDG compliance generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSdgComplianceInputSchema = z.object({
  businessPractices: z
    .string()
    .describe('A detailed description of the business practices.'),
});
export type GenerateSdgComplianceInput = z.infer<typeof GenerateSdgComplianceInputSchema>;

const SdgGoalSchema = z.object({
    name: z.string().describe("The name of the UN Sustainable Development Goal (e.g., 'Climate Action', 'Clean Water')."),
    value: z.number().min(0).max(100).describe("The compliance percentage for the SDG, from 0 to 100."),
});

const GenerateSdgComplianceOutputSchema = z.object({
  sdgGoals: z.array(SdgGoalSchema).length(5).describe('A list of the top 5 most relevant SDG goals and their compliance scores.'),
});
export type GenerateSdgComplianceOutput = z.infer<typeof GenerateSdgComplianceOutputSchema>;

/**
 * Generates SDG compliance data based on business practices.
 * @param input - The input containing the business practices description.
 * @returns The output containing the list of SDG goals and their compliance scores.
 */
export async function generateSdgCompliance(input: GenerateSdgComplianceInput): Promise<GenerateSdgComplianceOutput> {
  return generateSdgComplianceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSdgCompliancePrompt',
  input: { schema: GenerateSdgComplianceInputSchema },
  output: { schema: GenerateSdgComplianceOutputSchema },
  prompt: `You are a critical sustainability auditor. Your task is to analyze the provided business practices and assess them against the UN Sustainable Development Goals (SDGs).

First, identify the 5 SDGs that are most relevant to the described business activities.

Next, for each of the 5 chosen SDGs, provide a compliance score from 0 to 100. This score must be based *strictly* on the information provided.
- A score of 100 means the business practices demonstrate exemplary alignment with the goal.
- A score of 50 means the business has average or mixed practices related to the goal.
- A score of 0 means the business practices are actively detrimental or show a complete lack of alignment with the goal.
- Be realistic. Do not award high scores unless the description provides clear, concrete evidence of strong positive practices for that specific SDG. If no information is provided for a relevant SDG, assign a low score.

Business Practices:
"{{businessPractices}}"

Return the data as a list of the 5 most relevant goals, each with a name and a calculated compliance value.
`,
});


const generateSdgComplianceFlow = ai.defineFlow(
  {
    name: 'generateSdgComplianceFlow',
    inputSchema: GenerateSdgComplianceInputSchema,
    outputSchema: GenerateSdgComplianceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
