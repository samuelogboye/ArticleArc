export class MockGeminiService {
  async generateSummary(text: string): Promise<string> {
    // Return a predictable mock summary for testing
    return `Test summary: ${text.substring(0, 50)}...`;
  }
}