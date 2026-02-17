import OpenAI from "openai";
import { AiCompletionInput, AiStrategy } from "./ai-strategy";

export class DeepSeekStrategy implements AiStrategy {
  async complete(input: AiCompletionInput): Promise<string> {
    const client = new OpenAI({
      apiKey: input.apiKey,
      baseURL: "https://api.deepseek.com/v1",
    });
    const response = await client.chat.completions.create({
      model: input.model ?? "deepseek-chat",
      messages: [{ role: "user", content: input.message }],
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async *streamCompletion(input: AiCompletionInput): AsyncGenerator<string> {
    const client = new OpenAI({
      apiKey: input.apiKey,
      baseURL: "https://api.deepseek.com/v1",
    });
    const stream = await client.chat.completions.create({
      model: input.model ?? "deepseek-chat",
      messages: [{ role: "user", content: input.message }],
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
