
'use server';
/**
 * @fileOverview Generates sustainability suggestions for a business based on its practices.
 *
 * - generateSustainabilitySuggestions - A function that takes business practices as input and returns sustainability suggestions.
 * - GenerateSustainabilitySuggestionsInput - The input type for the generateSustainabilitySuggestions function.
 * - GenerateSustainabilitySuggestionsOutput - The return type for the generateSustainabilitySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSustainabilitySuggestionsInputSchema = z.object({
  businessPractices: z
    .string()
    .describe('Description of current business practices.'),
});
export type GenerateSustainabilitySuggestionsInput = z.infer<
  typeof GenerateSustainabilitySuggestionsInputSchema
>;

const SuggestionSchema = z.object({
    title: z.string().describe("A short, catchy title for the sustainability suggestion."),
    details: z.string().describe("A detailed, step-by-step explanation of how to implement the suggestion. Each step must be on a new line."),
});

const GenerateSustainabilitySuggestionsOutputSchema = z.object({
  suggestions: z
    .array(SuggestionSchema)
    .describe('A list of tailored, step-by-step sustainability guidelines for the business.'),
});
export type GenerateSustainabilitySuggestionsOutput = z.infer<
  typeof GenerateSustainabilitySuggestionsOutputSchema
>;

export async function generateSustainabilitySuggestions(
  input: GenerateSustainabilitySuggestionsInput
): Promise<GenerateSustainabilitySuggestionsOutput> {
  return generateSustainabilitySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSustainabilitySuggestionsPrompt',
  input: {schema: GenerateSustainabilitySuggestionsInputSchema},
  output: {schema: GenerateSustainabilitySuggestionsOutputSchema},
  prompt: `You are a sustainability expert. Analyze the following business practices and provide a list of tailored, step-by-step guidelines for sustainability improvements.

For each suggestion, provide:
1.  A concise title.
2.  Detailed implementation steps. Each individual step must be on its own new line. Do not use markdown formatting like asterisks or numbered lists.

Business Practices: {{{businessPractices}}}
`,
});

const generateSustainabilitySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSustainabilitySuggestionsFlow',
    inputSchema: GenerateSustainabilitySuggestionsInputSchema,
    outputSchema: GenerateSustainabilitySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
