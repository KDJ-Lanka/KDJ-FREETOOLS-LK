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

/** Change video playback speed (0.25x – 4x). Audio pitch is preserved via atempo. */
export async function ffVideoSpeed(
  file: File,
  speed: number,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const tempoFilters: string[] = [];
  let t = speed;
  while (t > 2.0) { tempoFilters.push("atempo=2.0"); t /= 2.0; }
  while (t < 0.5) { tempoFilters.push("atempo=0.5"); t /= 0.5; }
  tempoFilters.push(`atempo=${t.toFixed(4)}`);
  const vf = `setpts=${(1 / speed).toFixed(4)}*PTS`;
  const af = tempoFilters.join(",");
  await ff.exec(["-i", `input.${ext}`, "-vf", vf, "-af", af, "-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Reverse a video (plays backwards). */
export async function ffVideoReverse(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-vf", "reverse", "-af", "areverse", "-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Boomerang effect: concatenate forward + reversed clip. */
export async function ffVideoBoomerang(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-vf", "reverse", "-af", "areverse", "-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "reversed.mp4"]);
  await ff.writeFile("list.txt", new TextEncoder().encode("file 'input.mp4'\nfile 'reversed.mp4'\n") as unknown as Uint8Array);
  await ff.writeFile("input.mp4", await fetchFile(file));
  await ff.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  for (const f of [`input.${ext}`, "input.mp4", "reversed.mp4", "list.txt", "output.mp4"]) {
    try { await ff.deleteFile(f); } catch {}
  }
  ff.off("progress", () => {});
  return out;
}

/** Crop video to an aspect ratio. */
export async function ffVideoCrop(
  file: File,
  aspect: "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const cropMap: Record<string, string> = {
    "1:1":  "crop=min(iw\\,ih):min(iw\\,ih)",
    "16:9": "crop=iw:iw*9/16",
    "9:16": "crop=ih*9/16:ih",
    "4:3":  "crop=iw:iw*3/4",
    "3:4":  "crop=ih*3/4:ih",
  };
  await ff.exec(["-i", `input.${ext}`, "-vf", cropMap[aspect], "-c:v", "libx264", "-preset", "fast", "-c:a", "copy", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Apply a color filter to video. */
export async function ffVideoFilter(
  file: File,
  filter: "grayscale" | "sepia" | "vintage" | "vivid" | "cool" | "warm",
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const vfMap: Record<string, string> = {
    grayscale: "hue=s=0",
    sepia:     "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    vintage:   "curves=vintage",
    vivid:     "eq=saturation=2",
    cool:      "colortemperature=temperature=4000",
    warm:      "colortemperature=temperature=8000",
  };
  await ff.exec(["-i", `input.${ext}`, "-vf", vfMap[filter], "-c:v", "libx264", "-preset", "fast", "-c:a", "copy", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Replace or add audio track to a video. */
export async function ffAddAudioToVideo(
  videoFile: File,
  audioFile: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const vExt = videoFile.name.split(".").pop() || "mp4";
  const aExt = audioFile.name.split(".").pop() || "mp3";
  await ff.writeFile(`video.${vExt}`, await fetchFile(videoFile));
  await ff.writeFile(`audio.${aExt}`, await fetchFile(audioFile));
  await ff.exec(["-i", `video.${vExt}`, "-i", `audio.${aExt}`, "-c:v", "copy", "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0", "-shortest", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`video.${vExt}`); await ff.deleteFile(`audio.${aExt}`); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Extract a single frame from a video as JPEG at a given time. */
export async function ffVideoThumbnail(
  file: File,
  timeSec: number
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-ss", String(timeSec), "-i", `input.${ext}`, "-frames:v", "1", "-q:v", "2", "thumb.jpg"]);
  const out = await ff.readFile("thumb.jpg") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("thumb.jpg");
  return out;
}

/** Convert animated GIF to MP4 video. */
export async function ffGifToMp4(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  await ff.writeFile("input.gif", await fetchFile(file));
  await ff.exec(["-i", "input.gif", "-movflags", "faststart", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile("input.gif"); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Loop a video N times. */
export async function ffVideoLoop(
  file: File,
  times: number,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const lines = Array.from({ length: times }, () => `file 'input.${ext}'`).join("\n") + "\n";
  await ff.writeFile("list.txt", new TextEncoder().encode(lines) as unknown as Uint8Array);
  await ff.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("list.txt"); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

/** Burn a text watermark into the video frames. */
export async function ffVideoBurnText(
  file: File,
  text: string,
  position: "topleft" | "topright" | "bottomleft" | "bottomright" | "center",
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp4";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const posMap: Record<string, string> = {
    topleft:     "x=10:y=10",
    topright:    "x=w-tw-10:y=10",
    bottomleft:  "x=10:y=h-th-10",
    bottomright: "x=w-tw-10:y=h-th-10",
    center:      "x=(w-tw)/2:y=(h-th)/2",
  };
  const escaped = text.replace(/'/g, "\\'").replace(/:/g, "\\:");
  const vf = `drawtext=text='${escaped}':fontsize=36:fontcolor=white:borderw=2:bordercolor=black:${posMap[position]}`;
  await ff.exec(["-i", `input.${ext}`, "-vf", vf, "-c:v", "libx264", "-preset", "fast", "-c:a", "copy", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}

// ── Audio operations ───────────────────────────────────────────────────────

/** Trim audio between start and end seconds. */
export async function ffAudioTrim(
  file: File,
  startSec: number,
  endSec: number,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp3";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-ss", String(startSec), "-to", String(endSec), "-c", "copy", `output.${ext}`]);
  const out = await ff.readFile(`output.${ext}`) as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile(`output.${ext}`);
  ff.off("progress", () => {});
  return out;
}

/** Convert audio to a different format. */
export async function ffAudioConvert(
  file: File,
  outFmt: "mp3" | "wav" | "aac" | "ogg" | "flac" | "m4a",
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp3";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const args: string[] = ["-i", `input.${ext}`];
  if (outFmt === "mp3") args.push("-c:a", "libmp3lame", "-q:a", "2");
  else if (outFmt === "aac" || outFmt === "m4a") args.push("-c:a", "aac", "-b:a", "192k");
  else if (outFmt === "ogg") args.push("-c:a", "libvorbis", "-q:a", "4");
  else if (outFmt === "flac") args.push("-c:a", "flac");
  else args.push("-c:a", "pcm_s16le");
  args.push(`output.${outFmt}`);
  await ff.exec(args);
  const out = await ff.readFile(`output.${outFmt}`) as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile(`output.${outFmt}`);
  ff.off("progress", () => {});
  return out;
}

/** Adjust audio volume. factor > 1 boosts, < 1 reduces. */
export async function ffAudioVolume(
  file: File,
  factor: number,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp3";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-af", `volume=${factor}`, "-c:a", "libmp3lame", "-q:a", "2", "output.mp3"]);
  const out = await ff.readFile("output.mp3") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp3");
  ff.off("progress", () => {});
  return out;
}

/** Change audio speed without pitch change (atempo). */
export async function ffAudioSpeed(
  file: File,
  speed: number,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp3";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const tempoFilters: string[] = [];
  let t = speed;
  while (t > 2.0) { tempoFilters.push("atempo=2.0"); t /= 2.0; }
  while (t < 0.5) { tempoFilters.push("atempo=0.5"); t /= 0.5; }
  tempoFilters.push(`atempo=${t.toFixed(4)}`);
  await ff.exec(["-i", `input.${ext}`, "-af", tempoFilters.join(","), "-c:a", "libmp3lame", "-q:a", "2", "output.mp3"]);
  const out = await ff.readFile("output.mp3") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp3");
  ff.off("progress", () => {});
  return out;
}

/** Reverse an audio file. */
export async function ffAudioReverse(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp3";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-af", "areverse", "-c:a", "libmp3lame", "-q:a", "2", "output.mp3"]);
  const out = await ff.readFile("output.mp3") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp3");
  ff.off("progress", () => {});
  return out;
}

/** Merge / concatenate multiple audio files into one. */
export async function ffAudioMerge(
  files: File[],
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const names: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const name = `input${i}.mp3`;
    names.push(name);
    await ff.writeFile(name, await fetchFile(files[i]));
  }
  const listContent = names.map(n => `file '${n}'`).join("\n") + "\n";
  await ff.writeFile("list.txt", new TextEncoder().encode(listContent) as unknown as Uint8Array);
  await ff.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c:a", "libmp3lame", "-q:a", "2", "output.mp3"]);
  const out = await ff.readFile("output.mp3") as Uint8Array;
  for (const n of names) { try { await ff.deleteFile(n); } catch {} }
  await ff.deleteFile("list.txt"); await ff.deleteFile("output.mp3");
  ff.off("progress", () => {});
  return out;
}

/** Add fade in and/or fade out to audio. */
export async function ffAudioFade(
  file: File,
  fadeInSec: number,
  fadeOutSec: number,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp3";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  const filters: string[] = [];
  if (fadeInSec > 0) filters.push(`afade=t=in:st=0:d=${fadeInSec}`);
  if (fadeOutSec > 0) filters.push(`afade=t=out:st=999:d=${fadeOutSec}`);
  const af = filters.length ? filters.join(",") : "anull";
  await ff.exec(["-i", `input.${ext}`, "-af", af, "-c:a", "libmp3lame", "-q:a", "2", "output.mp3"]);
  const out = await ff.readFile("output.mp3") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp3");
  ff.off("progress", () => {});
  return out;
}

/** Normalize audio to a target loudness (loudnorm filter). */
export async function ffAudioNormalize(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp3";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-af", "loudnorm", "-c:a", "libmp3lame", "-q:a", "2", "output.mp3"]);
  const out = await ff.readFile("output.mp3") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp3");
  ff.off("progress", () => {});
  return out;
}

/** Remove silence from audio using silenceremove filter. */
export async function ffAudioRemoveSilence(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const ext = file.name.split(".").pop() || "mp3";
  await ff.writeFile(`input.${ext}`, await fetchFile(file));
  await ff.exec(["-i", `input.${ext}`, "-af", "silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB:stop_periods=-1:stop_silence=0.5:stop_threshold=-50dB", "-c:a", "libmp3lame", "-q:a", "2", "output.mp3"]);
  const out = await ff.readFile("output.mp3") as Uint8Array;
  await ff.deleteFile(`input.${ext}`); await ff.deleteFile("output.mp3");
  ff.off("progress", () => {});
  return out;
}

/** Combine a still image + audio into an MP4 video. */
export async function ffAudioToVideo(
  audioFile: File,
  imageFile: File,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg();
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  const aExt = audioFile.name.split(".").pop() || "mp3";
  const iExt = imageFile.name.split(".").pop() || "jpg";
  await ff.writeFile(`audio.${aExt}`, await fetchFile(audioFile));
  await ff.writeFile(`cover.${iExt}`, await fetchFile(imageFile));
  await ff.exec(["-loop", "1", "-i", `cover.${iExt}`, "-i", `audio.${aExt}`, "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p", "-shortest", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "output.mp4"]);
  const out = await ff.readFile("output.mp4") as Uint8Array;
  await ff.deleteFile(`audio.${aExt}`); await ff.deleteFile(`cover.${iExt}`); await ff.deleteFile("output.mp4");
  ff.off("progress", () => {});
  return out;
}
