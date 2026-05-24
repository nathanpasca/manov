import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NovelCard from '../NovelCard';

const mockNovel = {
    id: 1,
    title: 'Test Novel',
    slug: 'test-novel',
    coverUrl: null,
    status: 'ONGOING',
    author: 'Test Author',
    genres: [{ id: 1, name: 'Fantasy' }],
    chapterCount: 10,
    averageRating: 4.5,
    ratingCount: 20,
    synopsis: 'A test novel synopsis.',
};

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('NovelCard', () => {
    it('renders novel title', () => {
        render(<NovelCard novel={mockNovel} />, { wrapper: Wrapper });
        expect(screen.getByText('Test Novel')).toBeInTheDocument();
    });

    it('renders author name', () => {
        render(<NovelCard novel={mockNovel} />, { wrapper: Wrapper });
        expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('renders status badge', () => {
        render(<NovelCard novel={mockNovel} />, { wrapper: Wrapper });
        expect(screen.getByText('ONGOING')).toBeInTheDocument();
    });

    it('renders unknown author fallback', () => {
        const novelWithoutAuthor = { ...mockNovel, author: '' };
        render(<NovelCard novel={novelWithoutAuthor} />, { wrapper: Wrapper });
        expect(screen.getByText('Unknown Author')).toBeInTheDocument();
    });
});
