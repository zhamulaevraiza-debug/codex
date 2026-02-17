export type AiCompletionInput = {
  message: string;
  model?: string;
  apiKey: string;
};

export interface AiStrategy {
  complete(input: AiCompletionInput): Promise<string>;
  streamCompletion(input: AiCompletionInput): AsyncGenerator<string>;
}
