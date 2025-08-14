
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-sustainability-suggestions.ts';
import '@/ai/flows/score-activity.ts';
import '@/ai/flows/score-business.ts';
import '@/ai/flows/generate-sdg-compliance.ts';
import '@/ai/flows/generate-business-plan.ts';
import '@/ai/flows/summarize-business-document.ts';

