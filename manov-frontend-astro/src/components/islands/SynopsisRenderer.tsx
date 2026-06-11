import { renderSynopsisMarkdown } from '../../lib/renderMarkdown';

interface SynopsisRendererProps {
  synopsis: string;
}

export default function SynopsisRenderer({ synopsis }: SynopsisRendererProps) {
  if (!synopsis) {
    return <p className="text-stone-500">No synopsis available yet.</p>;
  }

  return (
    <div
      className="prose prose-gray dark:prose-invert max-w-none leading-relaxed text-stone-600 dark:text-stone-300"
      dangerouslySetInnerHTML={{ __html: renderSynopsisMarkdown(synopsis) }}
    />
  );
}
