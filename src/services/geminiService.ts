import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (config.ai.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  public isAvailable(): boolean {
    return this.model !== null;
  }

  public async generateSummary(content: string, title?: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Gemini AI service is not available - API key not configured');
    }

    try {
      const prompt = this.buildSummaryPrompt(content, title);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      if (!summary || summary.trim().length === 0) {
        throw new Error('Generated summary is empty');
      }

      return summary.trim();
    } catch (error) {
      console.error('Gemini API error:', error);
      
      if (error instanceof Error && error.message.includes('API key')) {
        throw new Error('Invalid Gemini API key');
      }
      
      throw new Error('Failed to generate summary using Gemini AI');
    }
  }

  public generateFallbackSummary(content: string): string {
    const sentences = content
      .replace(/[.!?]+/g, '.|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 20);

    if (sentences.length === 0) {
      return content.substring(0, 150) + (content.length > 150 ? '...' : '');
    }

    const topSentences = sentences
      .slice(0, Math.min(3, sentences.length))
      .join(' ');

    return topSentences.length > 300 
      ? topSentences.substring(0, 297) + '...' 
      : topSentences;
  }

  private buildSummaryPrompt(content: string, title?: string): string {
    const basePrompt = `
Please create a concise and informative summary of the following article content. 
The summary should:
- Be 2-3 sentences long
- Capture the main points and key information
- Be engaging and clear
- Stay under 300 characters

${title ? `Article Title: ${title}\n` : ''}
Article Content: ${content}

Summary:`;

    return basePrompt.trim();
  }
}

export const geminiService = new GeminiService();