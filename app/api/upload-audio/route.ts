import { TRPCError } from "@trpc/server";
import { uploadAndTranscribe } from "../../../server/assemblyai";
import { createContext } from "../../../server/_core/context";

const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "video/mp4",
]);

export async function POST(request: Request) {
  try {
    const context = await createContext({ req: request });
    if (!context.user) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!(audio instanceof File)) {
      return Response.json({ error: "Choose an audio file" }, { status: 400 });
    }
    if (audio.size <= 0 || audio.size > MAX_AUDIO_BYTES) {
      return Response.json(
        { error: "Audio must be between 1 byte and 50 MB" },
        { status: 400 },
      );
    }
    if (audio.type && !ALLOWED_AUDIO_TYPES.has(audio.type)) {
      return Response.json(
        { error: "Unsupported audio format" },
        { status: 415 },
      );
    }

    const result = await uploadAndTranscribe(await audio.arrayBuffer(), {
      speakerLabels: true,
    });
    if ("error" in result) {
      const status = result.code === "NO_API_KEY" ? 503 : 502;
      return Response.json({ error: result.error }, { status });
    }
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof TRPCError || error instanceof Error
        ? error.message
        : "Audio transcription failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
