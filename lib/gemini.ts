import { ApiError, GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";

const RETRYABLE_STATUSES = [429, 503];
const MAX_ATTEMPTS = 3;

// Gemini's own 503 message calls high demand "usually temporary" — a single unretried
// call would surface that as a permanent failure, so retry transient provider errors here.
export async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: GenerateContentParameters,
): Promise<GenerateContentResponse> {
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      const isRetryable = error instanceof ApiError && RETRYABLE_STATUSES.includes(error.status);
      if (!isRetryable || attempt >= MAX_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}
