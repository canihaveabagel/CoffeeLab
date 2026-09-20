/**
 * AssemblyAI transcription service
 * Replaces the Forge/Whisper-based transcription with AssemblyAI's API.
 * Supports audio URLs (S3, public URLs) and returns a full transcript with utterances.
 */

import { ENV } from "./_core/env";

export interface TranscriptResult {
  text: string;
  utterances?: Array<{ speaker: string; text: string; start: number; end: number }>;
  duration?: number;
}

export interface TranscriptError {
  error: string;
  code?: string;
}

const ASSEMBLYAI_BASE = "https://api.assemblyai.com/v2";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Transcribe audio from a public URL using AssemblyAI.
 * Polls until complete (max 5 minutes).
 */
export async function transcribeWithAssemblyAI(
  audioUrl: string,
  options: { speakerLabels?: boolean; languageCode?: string } = {}
): Promise<TranscriptResult | TranscriptError> {
  const apiKey = ENV.assemblyAiKey;
  if (!apiKey) {
    return { error: "AssemblyAI API key not configured", code: "NO_API_KEY" };
  }

  // Step 1: Submit transcription job
  let submitResponse: Response;
  try {
    submitResponse = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        speaker_labels: options.speakerLabels ?? true,
        language_code: options.languageCode ?? "en",
      }),
    });
  } catch (err) {
    return { error: `Failed to submit transcription: ${(err as Error).message}`, code: "SUBMIT_FAILED" };
  }

  if (!submitResponse.ok) {
    const errText = await submitResponse.text().catch(() => "unknown error");
    return { error: `AssemblyAI submission failed: ${submitResponse.status} ${errText}`, code: "SUBMIT_ERROR" };
  }

  const submitData = await submitResponse.json() as { id: string; status: string; error?: string };
  const transcriptId = submitData.id;

  if (!transcriptId) {
    return { error: "No transcript ID returned from AssemblyAI", code: "NO_ID" };
  }

  // Step 2: Poll for completion (max 300 seconds = 5 minutes)
  const maxAttempts = 60;
  const pollInterval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(pollInterval);

    let pollResponse: Response;
    try {
      pollResponse = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, {
        headers: { "Authorization": apiKey },
      });
    } catch (err) {
      continue; // retry on network error
    }

    if (!pollResponse.ok) continue;

    const data = await pollResponse.json() as {
      id: string;
      status: "queued" | "processing" | "completed" | "error";
      text?: string;
      error?: string;
      audio_duration?: number;
      utterances?: Array<{
        speaker: string;
        text: string;
        start: number;
        end: number;
      }>;
    };

    if (data.status === "completed") {
      return {
        text: data.text ?? "",
        duration: data.audio_duration,
        utterances: data.utterances?.map(u => ({
          speaker: u.speaker,
          text: u.text,
          start: Math.round(u.start / 1000), // ms → seconds
          end: Math.round(u.end / 1000),
        })),
      };
    }

    if (data.status === "error") {
      return { error: data.error ?? "AssemblyAI transcription failed", code: "TRANSCRIPTION_ERROR" };
    }

    // status is "queued" or "processing" — keep polling
  }

  return { error: "Transcription timed out after 5 minutes", code: "TIMEOUT" };
}

/**
 * Upload a Buffer/Blob to AssemblyAI's upload endpoint, then transcribe.
 * Use this when you have the audio bytes directly (not a public URL).
 */
export async function uploadAndTranscribe(
  audioBuffer: ArrayBuffer,
  options: { speakerLabels?: boolean } = {}
): Promise<TranscriptResult | TranscriptError> {
  const apiKey = ENV.assemblyAiKey;
  if (!apiKey) {
    return { error: "AssemblyAI API key not configured", code: "NO_API_KEY" };
  }

  // Upload audio bytes to AssemblyAI
  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: audioBuffer,
    });
  } catch (err) {
    return { error: `Failed to upload audio: ${(err as Error).message}`, code: "UPLOAD_FAILED" };
  }

  if (!uploadResponse.ok) {
    return { error: `AssemblyAI upload failed: ${uploadResponse.status}`, code: "UPLOAD_ERROR" };
  }

  const uploadData = await uploadResponse.json() as { upload_url: string };
  return transcribeWithAssemblyAI(uploadData.upload_url, options);
}
