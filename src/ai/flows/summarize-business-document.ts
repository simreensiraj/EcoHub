
'use server';

/**
 * @fileOverview This file defines a Genkit flow for summarizing a business document.
 *
 * The flow takes the text content of a document and returns a concise summary
 * of the business practices described within it. This is used during onboarding
 * to create the initial business profile for analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeBusinessDocumentInputSchema = z.object({
  documentText: z
    .string()
    .describe('The full text content of the business document to be summarized.'),
});
export type SummarizeBusinessDocumentInput = z.infer<typeof SummarizeBusinessDocumentInputSchema>;

const SummarizeBusinessDocumentOutputSchema = z.object({
  businessPracticesSummary: z
    .string()
    .describe('A detailed summary of the business practices, including its mission, operations, supply chain, and waste management.'),
});
export type SummarizeBusinessDocumentOutput = z.infer<typeof SummarizeBusinessDocumentOutputSchema>;

/**
 * Analyzes the text from a business document and summarizes its practices.
 * @param input - The input containing the document text.
 * @returns The output containing the summary.
 */
export async function summarizeBusinessDocument(
  input: SummarizeBusinessDocumentInput
): Promise<SummarizeBusinessDocumentOutput> {
  return summarizeBusinessDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeBusinessDocumentPrompt',
  input: { schema: SummarizeBusinessDocumentInputSchema },
  output: { schema: SummarizeBusinessDocumentOutputSchema },
  prompt: `You are an expert business analyst. Your task is to read the following business document and create a comprehensive, well-structured summary of the company's practices.

The summary should synthesize information about the business's:
1.  Core mission and activities.
2.  Supply chain and sourcing.
3.  Day-to-day operations and energy use.
4.  Waste management processes.
5.  Community and social impact.

Combine these points into a clear, coherent paragraph that accurately reflects the document provided. This summary will be used as the basis for a sustainability assessment.

Document Text:
"{{documentText}}"
`,
});

const summarizeBusinessDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeBusinessDocumentFlow',
    inputSchema: SummarizeBusinessDocumentInputSchema,
    outputSchema: SummarizeBusinessDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
