export interface SummaryProvider {
  generateSummary(prompt: string, systemPrompt: string): Promise<string | null>;
}
