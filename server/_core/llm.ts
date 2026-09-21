import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };
export type ImageContent = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
export type FileContent = {
  type: "file_url";
  file_url: { url: string; mime_type?: string };
};
export type DocumentContent = {
  type: "document";
  source:
    | { type: "base64"; media_type: "application/pdf"; data: string }
    | { type: "text"; media_type: "text/plain"; data: string };
  title?: string;
};
export type MessageContent = string | TextContent | ImageContent | FileContent | DocumentContent;
export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};
export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type InvokeParams = {
  messages: Message[];
  maxTokens?: number;
  max_tokens?: number;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: JsonSchema;
  output_schema?: JsonSchema;
  model?: string;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: Role; content: string };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type AnthropicResponse = {
  id: string;
  model: string;
  stop_reason: string | null;
  content: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
};

function contentToText(content: Message["content"]): string {
  const parts = Array.isArray(content) ? content : [content];
  return parts
    .map(part => {
      if (typeof part === "string") return part;
      if (part.type === "text") return part.text;
      if (part.type === "image_url") return `[Image: ${part.image_url.url}]`;
      if (part.type === "file_url") return `[File: ${part.file_url.url}]`;
      return `[Document: ${part.title ?? "uploaded document"}]`;
    })
    .join("\n");
}

function contentToAnthropic(content: Message["content"]) {
  const parts = Array.isArray(content) ? content : [content];
  return parts.map(part => {
    if (typeof part === "string") return { type: "text" as const, text: part };
    if (part.type === "text") return part;
    if (part.type === "document") return part;
    if (part.type === "image_url") {
      return { type: "text" as const, text: `[Image: ${part.image_url.url}]` };
    }
    return { type: "text" as const, text: `[File: ${part.file_url.url}]` };
  });
}

function requestedFormat(params: InvokeParams): ResponseFormat | undefined {
  const explicit = params.responseFormat ?? params.response_format;
  if (explicit) return explicit;
  const schema = params.outputSchema ?? params.output_schema;
  return schema ? { type: "json_schema", json_schema: schema } : undefined;
}

function stripJsonFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match?.[1]?.trim() ?? trimmed;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  let lastResponse: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, init);
      lastResponse = response;
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        return response;
      }
    } catch (error) {
      if (attempt === 2) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
  }
  return lastResponse!;
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.anthropicKey) {
    throw new Error(
      "Anthropic is not configured. Add the ANTHROPIC_API_KEY site secret.",
    );
  }

  const systems = params.messages
    .filter(message => message.role === "system")
    .map(message => contentToText(message.content));
  const messages = params.messages
    .filter(message => message.role === "user" || message.role === "assistant")
    .map(message => ({
      role: message.role as "user" | "assistant",
      content: contentToAnthropic(message.content),
    }));

  const format = requestedFormat(params);
  if (format?.type === "json_schema") {
    systems.push(
      `Return only valid JSON matching this schema. Do not wrap it in markdown:\n${JSON.stringify(format.json_schema.schema)}`,
    );
  } else if (format?.type === "json_object") {
    systems.push("Return only a valid JSON object. Do not wrap it in markdown.");
  }

  const model = params.model ?? ENV.anthropicModel;
  const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: params.max_tokens ?? params.maxTokens ?? 4096,
      ...(systems.length > 0 ? { system: systems.join("\n\n") } : {}),
      messages,
    }),
  });

  const payload = (await response.json()) as AnthropicResponse;
  if (!response.ok) {
    throw new Error(
      `Anthropic request failed (${response.status}): ${payload.error?.message ?? "Unknown error"}`,
    );
  }

  const rawText = payload.content
    .filter(part => part.type === "text")
    .map(part => part.text ?? "")
    .join("\n");
  const output = format?.type.startsWith("json")
    ? stripJsonFence(rawText)
    : rawText;
  const inputTokens = payload.usage?.input_tokens ?? 0;
  const outputTokens = payload.usage?.output_tokens ?? 0;

  return {
    id: payload.id,
    created: Math.floor(Date.now() / 1000),
    model: payload.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: output },
        finish_reason: payload.stop_reason,
      },
    ],
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    },
  };
}
