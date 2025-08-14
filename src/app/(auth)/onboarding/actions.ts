'use server';

import { summarizeBusinessDocument } from '@/ai/flows/summarize-business-document';

async function extractTextFromPdf(file: File): Promise<string> {
  // This dynamic import ensures pdf-parse is only loaded on the server.
  const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
  const arrayBuffer = await file.arrayBuffer();
  const data = await pdf(arrayBuffer);
  return data.text;
}

export async function analyzeBusinessDocument(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file uploaded.');
  }

  if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF.');
  }

  const documentText = await extractTextFromPdf(file);

  if (documentText.length < 100) {
    throw new Error(
      'The document provided does not have enough content for a proper analysis. Please upload a more detailed document.'
    );
  }
  
  try {
    const result = await summarizeBusinessDocument({ documentText });
    return result.businessPracticesSummary;
  } catch (error) {
    console.error("AI summarization failed:", error);
    throw new Error("The AI failed to summarize the document. Please try again.");
  }
}
