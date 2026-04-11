import { pipeline, AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

let asr: AutomaticSpeechRecognitionPipeline | null = null;

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
    if (!asr) {
      self.postMessage({ type: "error", message: "Model not loaded." });
      return;
    }
    self.postMessage({ type: "status", message: "Transcribing…" });
    try {
      const result = await asr(audio as Float32Array, {
        language: language || "english",
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      self.postMessage({ type: "result", data: result });
    } catch (err: unknown) {
      self.postMessage({ type: "error", message: String(err) });
    }
  }
};
