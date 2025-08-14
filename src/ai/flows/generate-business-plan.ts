
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a sustainable business plan.
 *
 * The flow takes a description of a business and returns a comprehensive plan
 * that includes a summary, key initiatives, and financial/sustainability projections.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBusinessPlanInputSchema = z.object({
  businessPractices: z
    .string()
    .describe('A description of the business for which to generate the plan.'),
});
export type GenerateBusinessPlanInput = z.infer<typeof GenerateBusinessPlanInputSchema>;

const MonthlyProjectionSchema = z.object({
  month: z.string().describe("The month (e.g., 'Jan', 'Feb')."),
  revenueGrowthPercentage: z.number().describe('Projected revenue growth for the month as a percentage (e.g., 2 for 2% growth).'),
  sustainabilityScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Projected sustainability score for the month (0-100).'),
});

const KeyInitiativeSchema = z.object({
  title: z.string().describe('A concise title for the strategic initiative.'),
  description: z.string().describe('A detailed description of the initiative.'),
});

const GenerateBusinessPlanOutputSchema = z.object({
  executiveSummary: z
    .string()
    .describe('A high-level executive summary of the business plan.'),
  keyInitiatives: z
    .array(KeyInitiativeSchema)
    .length(3)
    .describe('A list of the top 3 strategic initiatives for the next year.'),
  projections: z
    .array(MonthlyProjectionSchema)
    .length(12)
    .describe('A list of monthly projections for the next 12 months.'),
});
export type GenerateBusinessPlanOutput = z.infer<typeof GenerateBusinessPlanOutputSchema>;

/**
 * Generates a sustainable business plan.
 * @param input - The input containing the business description.
 * @returns The output containing the structured business plan.
 */
export async function generateBusinessPlan(
  input: GenerateBusinessPlanInput
): Promise<GenerateBusinessPlanOutput> {
  return generateBusinessPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBusinessPlanPrompt',
  input: { schema: GenerateBusinessPlanInputSchema },
  output: { schema: GenerateBusinessPlanOutputSchema },
  prompt: `You are an expert business consultant specializing in sustainable enterprises. Based on the business description provided, create a comprehensive business plan for the next 12 months.

The plan must include:
1.  **Executive Summary**: A concise overview of the proposed strategy.
2.  **Key Initiatives**: Exactly 3 actionable, high-impact strategic initiatives to improve both profitability and sustainability.
3.  **Monthly Projections**: A 12-month forecast. For each month, provide a projected revenue growth as a percentage and a projected sustainability score (0-100). The projections should show realistic growth based on the implementation of the key initiatives. The first month should have 0% revenue growth, and subsequent months should show gradual improvement.

Business Description:
"{{businessPractices}}"
`,
});

const generateBusinessPlanFlow = ai.defineFlow(
  {
    name: 'generateBusinessPlanFlow',
    inputSchema: GenerateBusinessPlanInputSchema,
    outputSchema: GenerateBusinessPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
