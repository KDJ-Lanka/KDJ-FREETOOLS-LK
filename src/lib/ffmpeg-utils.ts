// Lazy-loads FFmpeg WASM from /public/ffmpeg/ — browser only
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let _ffmpeg: FFmpeg | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (typeof window === "undefined") throw new Error("FFmpeg only runs in browser");
  if (_ffmpeg?.loaded) return _ffmpeg;

  const ff = new FFmpeg();
  await ff.load({
    coreURL: "/ffmpeg/ffmpeg-core.js",
    wasmURL: "/ffmpeg/ffmpeg-core.wasm",
    workerURL: "/ffmpeg/ffmpeg-core.worker.js",
  });
  _ffmpeg = ff;
  return ff;
}

export { fetchFile };

// ── Helpers ────────────────────────────────────────────────────────────────

function cleanBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export function makeBlob(data: Uint8Array, mime: string): Blob {
  return new Blob([cleanBuffer(data)], { type: mime });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Video operations ───────────────────────────────────────────────────────

/** Compress video by re-encoding at a lower CRF (quality) */
export async function ffCompressVideo(
  file: File,
  crf: number, // 18 = high quality, 28 = medium, 36 = low
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  await ff.writeFile("input.mp4", await fetchFile(file));
  await ff.exec(["-i", "input.mp4", "-c:v", "libx264", "-crf", String(crf), "-preset", "fast", "-c:a", "aac", "-b:a", "128k", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile("input.mp4");
  await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Convert video to a different format */
export async function ffConvertVideo(
  file: File,
  outExt: string, // "mp4" | "webm" | "avi" | "mov" | "mkv"
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const inName = `input.${file.name.split(".").pop() || "mp4"}`;
  const outName = `output.${outExt}`;
  await ff.writeFile(inName, await fetchFile(file));
  const args = ["-i", inName];
  if (outExt === "webm") args.push("-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0", "-c:a", "libopus");
  else args.push("-c:v", "libx264", "-crf", "23", "-preset", "fast", "-c:a", "aac");
  args.push(outName);
  await ff.exec(args);
  const out = await ff.readFile(outName) as Uint8Array;
  await ff.deleteFile(inName);
  await ff.deleteFile(outName);
  ff.off("progress", () => {});
  return out;
}

/** Trim video between start and end seconds */
export async function ffTrimVideo(
  file: File,
  startSec: number,
  endSec: number,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-ss", String(startSec), "-to", String(endSec), "-c", "copy", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`);
  await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Extract audio from video */
export async function ffExtractAudio(
  file: File,
  format: "mp3" | "wav" | "aac",
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const args = ["-i", `input.${ext}`, "-vn"];
  if (format === "mp3") args.push("-c:a", "libmp3lame", "-q:a", "2");
  else if (format === "aac") args.push("-c:a", "aac", "-b:a", "192k");
  else args.push("-c:a", "pcm_s16le");
  args.push(`output.${format}`);
  await ff.exec(args);
  const out = await ff.readFile(`output.${format}`) as Uint8Array;
  await ff.deleteFile(`input.${ext}`);
  await ff.deleteFile(`output.${format}`);
  ff.off("progress", () => {});
  return out;
}

/** Convert a video clip to animated GIF */
export async function ffVideoToGif(
  file: File,
  startSec: number,
  duration: number,
  fps: number,
  width: number,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  // Two-pass: generate palette then render GIF
  await ff.exec(["-ss", String(startSec), "-t", String(duration), "-i", `input.${ext}`,
    "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`, "palette.png"]);
  await ff.exec(["-ss", String(startSec), "-t", String(duration), "-i", `input.${ext}`,
    "-i", "palette.png", "-lavfi", `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`, "output.gif"]);
  const out = await ff.readFile("output.gif") as Uint8Array;
  await ff.deleteFile(`input.${ext}`);
  await ff.deleteFile("palette.png");
  await ff.deleteFile("output.gif");
  ff.off("progress", () => {});
  return out;
}

/** Remove audio track from video */
export async function ffMuteVideo(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-an", "-c:v", "copy", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`);
  await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Rotate / flip video */
export async function ffRotateVideo(
  file: File,
  rotation: "90" | "180" | "270" | "fliph" | "flipv",
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const vfMap: Record<string, string> = {
    "90": "transpose=1",
    "180": "transpose=2,transpose=2",
    "270": "transpose=2",
    "fliph": "hflip",
    "flipv": "vflip",
  };
  await ff.exec(["-i", `input.${ext}`, "-vf", vfMap[rotation], "-c:a", "copy", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`);
  await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}
