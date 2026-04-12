declare module "pandoc-wasm" {
  export type PandocOptions = Record<string, unknown>;
  export type PandocFiles = Record<string, string | Blob>;
  export type PandocResult = {
    stdout: string;
    stderr: string;
    warnings: unknown[];
    files: Record<string, string | Blob>;
    mediaFiles: Record<string, Blob>;
  };
  export function convert(
    options: PandocOptions,
    stdin: string | null,
    files: PandocFiles
  ): Promise<PandocResult>;
  export function query(options: { query: string; format?: string }): Promise<unknown>;
}
