// Singleton Pyodide WASM loader — loads once and is reused across all tools.

export interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackagesFromImports: (code: string) => Promise<void>;
  globals: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
  };
  FS: {
    writeFile: (path: string, data: Uint8Array | string) => void;
    readFile: (path: string) => Uint8Array;
  };
}

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

let _instance: PyodideInterface | null = null;
let _loading: Promise<PyodideInterface> | null = null;

export async function getPyodide(
  onStatus?: (msg: string) => void
): Promise<PyodideInterface> {
  if (_instance) return _instance;
  if (_loading) return _loading;

  _loading = (async () => {
    onStatus?.("Loading Python runtime (≈8 MB, cached after first use)…");

    if (typeof window.loadPyodide === "undefined") {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("Failed to load Pyodide script from CDN."));
        document.head.appendChild(script);
      });
    }

    onStatus?.("Initializing Python…");
    _instance = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/",
    });

    onStatus?.("Ready");
    return _instance;
  })();

  return _loading;
}

/** Run user code with captured stdout/stderr. Returns { stdout, stderr, error }. */
export async function runPythonSafe(
  pyodide: PyodideInterface,
  code: string
): Promise<{ stdout: string; stderr: string; error: string | null }> {
  pyodide.globals.set("_user_code", code);

  const wrapper = `
import sys, io, json as _json, traceback as _tb

_stdout_buf = io.StringIO()
_stderr_buf = io.StringIO()
_orig_stdout, _orig_stderr = sys.stdout, sys.stderr
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf

_error = None
try:
    exec(_user_code, {})
except Exception as _exc:
    _error = _tb.format_exc()
finally:
    sys.stdout = _orig_stdout
    sys.stderr = _orig_stderr

_json.dumps({
    "stdout": _stdout_buf.getvalue(),
    "stderr": _stderr_buf.getvalue(),
    "error": _error,
})
`;
  const raw = (await pyodide.runPythonAsync(wrapper)) as string;
  return JSON.parse(raw);
}
