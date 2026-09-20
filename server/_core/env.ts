import { env } from "cloudflare:workers";

export const ENV = {
  get assemblyAiKey() {
    return env.ASSEMBLYAI_API_KEY ?? "";
  },
  get anthropicKey() {
    return env.ANTHROPIC_API_KEY ?? "";
  },
  get anthropicModel() {
    return env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  },
};
