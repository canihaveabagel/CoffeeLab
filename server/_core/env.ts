import { env } from "cloudflare:workers";

export const ENV = {
  get anthropicKey() {
    return env.ANTHROPIC_API_KEY ?? "";
  },
  get anthropicModel() {
    return env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
  },
};
