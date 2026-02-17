import OpenAI from "openai";
import { AiCompletionInput, AiStrategy } from "./ai-strategy";

export class OpenAiStrategy implements AiStrategy {
  async complete(input: AiCompletionInput): Promise<string> {
    const client = new OpenAI({ apiKey: input.apiKey });
    const response = await client.responses.create({
      model: input.model ?? "gpt-4o-mini",
      input: input.message,
    });
    return response.output_text ?? "";
  }

  async *streamCompletion(input: AiCompletionInput): AsyncGenerator<string> {
    const client = new OpenAI({ apiKey: input.apiKey });
    const stream = await client.responses.create({
      model: input.model ?? "gpt-4o-mini",
      input: input.message,
      stream: true,
    });
    for await (const event of stream) {
      if (event.type === "response.output_text.delta" && event.delta) {
        yield event.delta;
      }
    }
  }
}
