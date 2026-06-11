import { marked, type Renderer } from 'marked';

function createReaderRenderer(): Partial<Renderer> {
  return {
    strong({ text }: { text: string }) {
      return `<span class="font-bold opacity-100">${text}</span>`;
    },
    em({ text }: { text: string }) {
      return `<span class="italic opacity-90">${text}</span>`;
    },
    link({ href, text }: { href: string; text: string }) {
      return `<a href="${href}" class="text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 dark:text-stone-400">${text}</a>`;
    },
  };
}

function createSynopsisRenderer(): Partial<Renderer> {
  return {
    strong({ text }: { text: string }) {
      return `<span class="font-bold">${text}</span>`;
    },
    em({ text }: { text: string }) {
      return `<span class="italic">${text}</span>`;
    },
    link({ href, text }: { href: string; text: string }) {
      return `<a href="${href}" class="text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 dark:text-stone-400">${text}</a>`;
    },
  };
}

export function renderReaderMarkdown(text: string): string {
  return marked.parseInline(text, { renderer: createReaderRenderer() }) as string;
}

export function renderSynopsisMarkdown(text: string): string {
  return marked.parseInline(text, { renderer: createSynopsisRenderer() }) as string;
}
