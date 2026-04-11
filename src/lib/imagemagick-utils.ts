/* eslint-disable @typescript-eslint/no-explicit-any */

let initialized = false;

async function getIM() {
  if (typeof window === "undefined") throw new Error("Image tools only run in browser");
  const { initializeImageMagick, ImageMagick, MagickFormat, MagickGeometry } = await import("@imagemagick/magick-wasm");
  if (!initialized) {
    await initializeImageMagick(new URL("/imagemagick/magick.wasm", window.location.href));
    initialized = true;
  }
  return { ImageMagick, MagickFormat, MagickGeometry };
}

function formatToMagick(fmt: string, MagickFormat: any): any {
  const map: Record<string, string> = {
    jpg: "Jpeg", jpeg: "Jpeg", png: "Png", webp: "WebP",
    bmp: "Bmp", gif: "Gif", tiff: "Tiff", tif: "Tiff",
  };
  const key = map[fmt.toLowerCase()] ?? "Jpeg";
  return MagickFormat[key];
}

export async function imCompress(bytes: Uint8Array, format: "jpg" | "png" | "webp", quality: number): Promise<Uint8Array> {
  const { ImageMagick, MagickFormat } = await getIM();
  let result: Uint8Array | null = null;
  ImageMagick.read(bytes, (img: any) => {
    img.quality = quality;
    img.write(formatToMagick(format, MagickFormat), (data: Uint8Array) => {
      result = data.slice();
    });
  });
  return result!;
}

export async function imResize(bytes: Uint8Array, width: number, height: number, maintainAspect: boolean, format: string): Promise<Uint8Array> {
  const { ImageMagick, MagickFormat, MagickGeometry } = await getIM();
  let result: Uint8Array | null = null;
  ImageMagick.read(bytes, (img: any) => {
    if (maintainAspect) {
      img.resize(new MagickGeometry(width, 0));
    } else {
      img.resize(new MagickGeometry(width, height));
    }
    img.write(formatToMagick(format, MagickFormat), (data: Uint8Array) => {
      result = data.slice();
    });
  });
  return result!;
}

export async function imConvert(bytes: Uint8Array, toFormat: "jpg" | "png" | "webp" | "bmp" | "gif" | "tiff"): Promise<Uint8Array> {
  const { ImageMagick, MagickFormat } = await getIM();
  let result: Uint8Array | null = null;
  ImageMagick.read(bytes, (img: any) => {
    img.write(formatToMagick(toFormat, MagickFormat), (data: Uint8Array) => {
      result = data.slice();
    });
  });
  return result!;
}

export async function imRotate(bytes: Uint8Array, degrees: number, flip: "none" | "h" | "v", format: string): Promise<Uint8Array> {
  const { ImageMagick, MagickFormat } = await getIM();
  let result: Uint8Array | null = null;
  ImageMagick.read(bytes, (img: any) => {
    if (flip === "h") img.flop();
    if (flip === "v") img.flip();
    if (degrees !== 0) img.rotate(degrees);
    img.write(formatToMagick(format, MagickFormat), (data: Uint8Array) => {
      result = data.slice();
    });
  });
  return result!;
}

export async function imCrop(bytes: Uint8Array, x: number, y: number, w: number, h: number, format: string): Promise<Uint8Array> {
  const { ImageMagick, MagickFormat, MagickGeometry } = await getIM();
  let result: Uint8Array | null = null;
  ImageMagick.read(bytes, (img: any) => {
    img.crop(new MagickGeometry(x, y, w, h));
    img.write(formatToMagick(format, MagickFormat), (data: Uint8Array) => {
      result = data.slice();
    });
  });
  return result!;
}
