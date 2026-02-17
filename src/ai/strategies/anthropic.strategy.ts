import Anthropic from "@anthropic-ai/sdk";
import { AiCompletionInput, AiStrategy } from "./ai-strategy";

export class AnthropicStrategy implements AiStrategy {
  async complete(input: AiCompletionInput): Promise<string> {
    const client = new Anthropic({ apiKey: input.apiKey });
    const response = await client.messages.create({
      model: input.model ?? "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      messages: [{ role: "user", content: input.message }],
    });
    const first = response.content.find((item) => item.type === "text");
    return first?.text ?? "";
  }

  async *streamCompletion(input: AiCompletionInput): AsyncGenerator<string> {
    const client = new Anthropic({ apiKey: input.apiKey });
    const stream = await client.messages.create({
      model: input.model ?? "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      messages: [{ role: "user", content: input.message }],
      stream: true,
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta?.text) {
        yield event.delta.text;
      }
    }
  }
}
