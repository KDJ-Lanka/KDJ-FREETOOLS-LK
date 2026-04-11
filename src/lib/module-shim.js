// Browser shim for Node.js 'module' built-in used by mupdf
export const createRequire = () => () => null;
export default { createRequire };
