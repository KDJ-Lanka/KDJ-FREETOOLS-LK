export type CategoryId = "all" | "pdf" | "img";

export type Tool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: Exclude<CategoryId, "all">;
  popular?: boolean;
  soon?: boolean;
  isNew?: boolean;
};

export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: "all",  label: "All tools",    emoji: "⚡" },
  { id: "pdf",  label: "PDF Tools",    emoji: "📄" },
  { id: "img",  label: "Image Tools",  emoji: "🖼️" },
];

export const CAT_LABEL: Record<CategoryId, string> = {
  all: "All",
  pdf: "PDF",
  img: "Image",
};

export const TOOLS: Tool[] = [
  { id: "merge-pdf",        name: "Merge PDF",          icon: "🔗", description: "Combine multiple PDF files into one document in seconds.",                    category: "pdf", popular: true  },
  { id: "split-pdf",        name: "Split PDF",           icon: "✂️", description: "Extract pages or split a PDF into multiple separate files.",                  category: "pdf", popular: true  },
  { id: "compress-pdf",     name: "Compress PDF",        icon: "📦", description: "Reduce PDF file size while keeping the best possible quality.",               category: "pdf", popular: true  },
  { id: "pdf-to-jpg",       name: "PDF to JPG",          icon: "🖼️", description: "Convert every PDF page into a high-quality JPG image.",                       category: "pdf"                },
  { id: "jpg-to-pdf",       name: "JPG to PDF",          icon: "📎", description: "Turn one or more images into a single PDF document.",                         category: "pdf"                },
  { id: "rotate-pdf",       name: "Rotate PDF",          icon: "🔄", description: "Fix page orientation — rotate any page to the right angle.",                  category: "pdf"                },
  { id: "watermark-pdf",    name: "Watermark PDF",       icon: "💧", description: "Stamp a custom text or image watermark on every page.",                       category: "pdf"                },
  { id: "protect-pdf",      name: "Protect PDF",         icon: "🔒", description: "Lock your PDF with a password to keep it private.",                          category: "pdf"                },
  { id: "unlock-pdf",       name: "Unlock PDF",          icon: "🔓", description: "Remove the password from a PDF you own.",                                     category: "pdf"                },
  { id: "reorder-pdf",      name: "Reorder Pages",       icon: "🗂️", description: "Drag and drop pages to rearrange them in any order.",                         category: "pdf", isNew: true    },
  { id: "pdf-to-text",      name: "PDF to Text",         icon: "📝", description: "Extract all text content from your PDF.",                                   category: "pdf", isNew: true    },
  { id: "pdf-grayscale",    name: "PDF Grayscale",       icon: "🔘", description: "Convert a color PDF to black & white.",                                     category: "pdf", isNew: true    },
  { id: "add-page-numbers", name: "Add Page Numbers",    icon: "🔢", description: "Stamp page numbers on every page of your PDF.",                             category: "pdf", isNew: true    },
  { id: "pdf-metadata",     name: "PDF Metadata",        icon: "🏷️", description: "View and edit PDF title, author, subject and keywords.",                    category: "pdf", isNew: true    },
  { id: "compress-image",   name: "Compress Image",      icon: "🗜️", description: "Reduce image file size with smart quality control.",                         category: "img", popular: true, isNew: true },
  { id: "resize-image",     name: "Resize Image",        icon: "📐", description: "Resize images to exact dimensions or by percentage.",                        category: "img", popular: true, isNew: true },
  { id: "convert-image",    name: "Convert Image",       icon: "🔄", description: "Convert between JPG, PNG, WebP, BMP, GIF and more.",                        category: "img", isNew: true },
  { id: "rotate-image",     name: "Rotate & Flip",       icon: "↩️", description: "Rotate images and flip them horizontally or vertically.",                    category: "img", isNew: true },
  { id: "crop-image",       name: "Crop Image",          icon: "✂️", description: "Crop images to the exact size you need.",                                   category: "img", isNew: true },
  { id: "watermark-image",  name: "Watermark Image",     icon: "💧", description: "Add a text watermark to protect your images.",                              category: "img", isNew: true },
];
