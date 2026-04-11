import { pipeline, AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

let asr: AutomaticSpeechRecognitionPipeline | null = null;

const CHUNK_SEC = 28;   // seconds per chunk
const OVERLAP_SEC = 2;  // overlap to avoid cutting words
const SAMPLE_RATE = 16000;

self.onmessage = async (e: MessageEvent) => {
  const { type, audio, language } = e.data;

  if (type === "load") {
    self.postMessage({ type: "status", message: "Preparing, please wait..." });
    asr = await pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny", {
      dtype: { encoder_model: "fp32", decoder_model_merged: "q4" },
      device: "wasm",
    });
    self.postMessage({ type: "ready" });
    return;
  }

  if (type === "transcribe") {
    if (!asr) { self.postMessage({ type: "error", message: "Not ready." }); return; }

    const pcm = audio as Float32Array;
    const chunkSamples = CHUNK_SEC * SAMPLE_RATE;
    const overlapSamples = OVERLAP_SEC * SAMPLE_RATE;
    const totalChunks = Math.ceil(pcm.length / chunkSamples);

    self.postMessage({ type: "status", message: `Transcribing (0 / ${totalChunks} chunks)...` });

    let timeOffset = 0;

    for (let i = 0; i < totalChunks; i++) {
      const start = Math.max(0, i * chunkSamples - (i > 0 ? overlapSamples : 0));
      const end = Math.min(pcm.length, (i + 1) * chunkSamples);
      const slice = pcm.slice(start, end);
      const offsetSec = start / SAMPLE_RATE;

      self.postMessage({ type: "status", message: `Transcribing (${i + 1} / ${totalChunks} chunks)...` });

      try {
        const result = await asr(slice, {
          language: language || "english",
          return_timestamps: true,
        }) as { text: string; chunks?: { text: string; timestamp: [number, number | null] }[] };

        const chunks = result.chunks ?? (result.text?.trim()
          ? [{ text: result.text.trim(), timestamp: [0, slice.length / SAMPLE_RATE] as [number, number] }]
          : []);

        // Adjust timestamps by the chunk offset, skip overlap region results on non-first chunks
        const adjusted = chunks
          .filter((c) => i === 0 || c.timestamp[0] >= OVERLAP_SEC)
          .map((c) => ({
            text: c.text.trim(),
            timestamp: [
              +(c.timestamp[0] + offsetSec - (i > 0 ? OVERLAP_SEC : 0)).toFixed(2),
              c.timestamp[1] != null
                ? +(c.timestamp[1] + offsetSec - (i > 0 ? OVERLAP_SEC : 0)).toFixed(2)
                : null,
            ] as [number, number | null],
          }))
          .filter((c) => c.text.length > 0);

        if (adjusted.length > 0) {
          self.postMessage({ type: "chunk", data: adjusted });
        }

        timeOffset = end / SAMPLE_RATE;
      } catch (err) {
        self.postMessage({ type: "error", message: String(err) });
        return;
      }
    }

    self.postMessage({ type: "done" });
  }
};