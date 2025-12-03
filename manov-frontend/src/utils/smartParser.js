/**
 * Mengubah raw text menjadi block terstruktur.
 * Memecah paragraf panjang (>800 char) menjadi potongan kecil agar enak dibaca.
 * Mendukung format novel (dialogue per baris), header, list, dan blockquote.
 */
export const smartParser = (rawText) => {
    if (!rawText) return [];

    // 1. Normalisasi Newlines
    const normalizedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. Split berdasarkan single enter untuk menjaga dialogue
    // Filter baris kosong/whitespace only
    const rawLines = normalizedText.split('\n');

    const blocks = [];
    let idCounter = 0;

    // Setup Segmenter untuk pemecahan kalimat yang akurat (Browser Native API)
    // Fallback ke regex simple jika environment tidak mendukung (misal Node lama, though Node 16+ supports it)
    let segmenter;
    try {
        segmenter = new Intl.Segmenter('id', { granularity: 'sentence' });
    } catch (e) {
        console.warn("Intl.Segmenter not supported, falling back to simple regex");
    }

    rawLines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // --- DETEKSI TIPE BLOCK ---

        // 1. Divider (--- atau ***)
        if (/^(\*{3,}|-{3,})$/.test(trimmedLine)) {
            blocks.push({ id: `block-${idCounter++}`, type: 'divider', content: '' });
            return;
        }

        // 2. Header (# Judul)
        // Support Markdown style (#) atau Explicit "Chapter X"
        if (trimmedLine.startsWith('#')) {
            const level = trimmedLine.match(/^#+/)[0].length;
            blocks.push({
                id: `block-${idCounter++}`,
                type: 'header',
                level: level, // 1-6
                content: trimmedLine.replace(/^#+\s*/, '')
            });
            return;
        }
        // Detect "Chapter 1" or "Bab 1" as header if short
        if (trimmedLine.length < 100 && /^(Chapter|Bab)\s+\d+/i.test(trimmedLine)) {
            blocks.push({
                id: `block-${idCounter++}`,
                type: 'header',
                level: 2,
                content: trimmedLine
            });
            return;
        }

        // 3. Blockquote (> Kutipan)
        if (trimmedLine.startsWith('>')) {
            blocks.push({
                id: `block-${idCounter++}`,
                type: 'blockquote',
                content: trimmedLine.replace(/^>\s*/, '')
            });
            return;
        }

        // 4. List Item (- Item atau 1. Item)
        if (/^[-*]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine)) {
            blocks.push({
                id: `block-${idCounter++}`,
                type: 'list-item',
                content: trimmedLine.replace(/^([-*]|\d+\.)\s*/, '')
            });
            return;
        }

        // 5. Paragraf Biasa (Check Panjang)
        if (trimmedLine.length > 800) {
            // --- LOGIC PEMECAH PARAGRAF RAKSASA ---
            let sentences = [];

            if (segmenter) {
                // Use Intl.Segmenter
                const segments = segmenter.segment(trimmedLine);
                for (const segment of segments) {
                    sentences.push(segment.segment);
                }
            } else {
                // Fallback Regex
                sentences = trimmedLine.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [trimmedLine];
            }

            let currentChunk = "";

            sentences.forEach((sentence) => {
                // Jika chunk sudah cukup panjang (> 400 char), "cut" jadi paragraf baru
                if (currentChunk.length + sentence.length > 400) {
                    if (currentChunk.trim()) {
                        blocks.push({
                            id: `block-${idCounter++}`,
                            type: 'paragraph',
                            content: currentChunk.trim()
                        });
                    }
                    currentChunk = sentence;
                } else {
                    currentChunk += sentence;
                }
            });

            // Push sisa chunk terakhir
            if (currentChunk.trim()) {
                blocks.push({
                    id: `block-${idCounter++}`,
                    type: 'paragraph',
                    content: currentChunk.trim()
                });
            }

        } else {
            // Paragraf Normal
            blocks.push({
                id: `block-${idCounter++}`,
                type: 'paragraph',
                content: trimmedLine
            });
        }
    });

    return blocks;
};