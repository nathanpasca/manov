interface Block {
  id: string;
  type: 'divider' | 'header' | 'blockquote' | 'list-item' | 'paragraph';
  content: string;
  level?: number;
}

export const smartParser = (rawText: string): Block[] => {
  if (!rawText) return [];

  const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalizedText.split('\n');

  const blocks: Block[] = [];
  let idCounter = 0;

  let segmenter: Intl.Segmenter | undefined;
  try {
    segmenter = new Intl.Segmenter('id', { granularity: 'sentence' });
  } catch (e) {
    console.warn('Intl.Segmenter not supported, falling back to simple regex');
  }

  rawLines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Divider
    if (/^(\*{3,}|-{3,})$/.test(trimmedLine)) {
      blocks.push({ id: `block-${idCounter++}`, type: 'divider', content: '' });
      return;
    }

    // Header (markdown style)
    if (trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^#+/);
      const level = match ? match[0].length : 1;
      blocks.push({
        id: `block-${idCounter++}`,
        type: 'header',
        level,
        content: trimmedLine.replace(/^#+\s*/, ''),
      });
      return;
    }

    // Detect "Chapter 1" or "Bab 1" as header if short
    if (trimmedLine.length < 100 && /^(Chapter|Bab)\s+\d+/i.test(trimmedLine)) {
      blocks.push({
        id: `block-${idCounter++}`,
        type: 'header',
        level: 2,
        content: trimmedLine,
      });
      return;
    }

    // Blockquote
    if (trimmedLine.startsWith('>')) {
      blocks.push({
        id: `block-${idCounter++}`,
        type: 'blockquote',
        content: trimmedLine.replace(/^>\s*/, ''),
      });
      return;
    }

    // List item
    if (/^[-*]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine)) {
      blocks.push({
        id: `block-${idCounter++}`,
        type: 'list-item',
        content: trimmedLine.replace(/^([-*]|\d+\.)\s*/, ''),
      });
      return;
    }

    // Long paragraph splitting
    if (trimmedLine.length > 800) {
      let sentences: string[] = [];

      if (segmenter) {
        const segments = segmenter.segment(trimmedLine);
        for (const segment of segments) {
          sentences.push(segment.segment);
        }
      } else {
        sentences =
          trimmedLine.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [
            trimmedLine,
          ];
      }

      let currentChunk = '';
      sentences.forEach((sentence) => {
        if (currentChunk.length + sentence.length > 400) {
          if (currentChunk.trim()) {
            blocks.push({
              id: `block-${idCounter++}`,
              type: 'paragraph',
              content: currentChunk.trim(),
            });
          }
          currentChunk = sentence;
        } else {
          currentChunk += sentence;
        }
      });

      if (currentChunk.trim()) {
        blocks.push({
          id: `block-${idCounter++}`,
          type: 'paragraph',
          content: currentChunk.trim(),
        });
      }
    } else {
      blocks.push({
        id: `block-${idCounter++}`,
        type: 'paragraph',
        content: trimmedLine,
      });
    }
  });

  return blocks;
};
