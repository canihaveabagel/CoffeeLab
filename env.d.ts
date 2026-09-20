/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ANTHROPIC_API_KEY?: string;
    ANTHROPIC_MODEL?: string;
    ASSEMBLYAI_API_KEY?: string;
  }
}
