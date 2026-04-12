// Lazy-loading helpers for @huggingface/transformers (browser only)
import { env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

export { env };
export { pipeline, AutoModel, AutoProcessor, RawImage } from "@huggingface/transformers";
