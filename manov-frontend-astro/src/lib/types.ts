export interface Genre {
  id: string;
  name: string;
}

export interface ChapterTranslation {
  id: string;
  language: string;
  title: string;
  content: string;
  publishedAt: string;
}

export interface Chapter {
  id: string;
  chapterNum: number;
  translations: ChapterTranslation[];
  createdAt: string;
}

export interface Novel {
  id: string;
  title: string;
  originalTitle: string;
  slug: string;
  author: string;
  coverUrl: string;
  synopsis: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  averageRating: number;
  ratingCount: number;
  viewCount: number;
  chapterCount: number;
  genres: Genre[];
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  coins: number;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  novelId: string;
  score: number;
  content: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  targetId: string;
  type: 'novel' | 'chapter';
  content: string;
  parentId: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  novelId: string | null;
  chapterId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  novelId: string;
  slug: string;
  title: string;
  coverUrl: string;
  lastReadChapter: number;
  progressPercent: number;
}

export interface ReaderChapter {
  id: string;
  chapterNum: number;
  title: string;
  content: string;
  novelTitle: string;
  novelAuthor: string;
  coverUrl: string;
  prevChapterNum: number | null;
  nextChapterNum: number | null;
}

export interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreateResponse {
  id: number;
  name: string;
  key: string;
  keyPrefix: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
