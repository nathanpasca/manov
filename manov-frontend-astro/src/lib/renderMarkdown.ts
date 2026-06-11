import { Marked } from 'marked';

/**
 * Isolated Marked instance for reader content.
 * Uses custom renderer to match previous react-markdown styling.
 */
const readerMarked = new Marked({
  renderer: {
    strong({ text }: { text: string }) {
      return `<span class="font-bold opacity-100">${text}</span>`;
    },
    em({ text }: { text: string }) {
      return `<span class="italic opacity-90">${text}</span>`;
    },
    link({ href, text }: { href: string; text: string }) {
      return `<a href="${href}" class="text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 dark:text-stone-400">${text}</a>`;
    },
  },
});

/**
 * Isolated Marked instance for synopsis content.
 */
const synopsisMarked = new Marked({
  renderer: {
    strong({ text }: { text: string }) {
      return `<span class="font-bold">${text}</span>`;
    },
    em({ text }: { text: string }) {
      return `<span class="italic">${text}</span>`;
    },
    link({ href, text }: { href: string; text: string }) {
      return `<a href="${href}" class="text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 dark:text-stone-400">${text}</a>`;
    },
  },
});

export function renderReaderMarkdown(text: string): string {
  return readerMarked.parseInline(text) as string;
}

export function renderSynopsisMarkdown(text: string): string {
  return synopsisMarked.parseInline(text) as string;
}
