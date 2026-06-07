import ReactMarkdown from 'react-markdown';

interface SynopsisRendererProps {
  synopsis: string;
}

export default function SynopsisRenderer({ synopsis }: SynopsisRendererProps) {
  if (!synopsis) {
    return <p className="text-stone-500">No synopsis available yet.</p>;
  }

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none leading-relaxed text-stone-600 dark:text-stone-300">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <span className="font-bold">{children}</span>
          ),
          em: ({ children }) => (
            <span className="italic">{children}</span>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-stone-600 underline decoration-stone-300 underline-offset-4 transition hover:text-stone-900 dark:text-stone-400"
            >
              {children}
            </a>
          ),
        }}
      >
        {synopsis}
      </ReactMarkdown>
    </div>
  );
}
