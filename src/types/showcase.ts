export interface ShowcaseUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ShowcaseItem {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  configJson: string;
  likesCount: number;
  clonesCount: number;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
  user: ShowcaseUser;
  isLiked?: boolean;
}

export interface CreateShowcaseInput {
  title: string;
  description?: string;
  category: string;
  thumbnail?: string | null;
  configJson: string;
}

export const SHOWCASE_CATEGORIES = [
  'Aesthetic',
  'Minimalis',
  'Pixel Art',
  'Retro & Cozy',
  'Anime & Cute',
  'Produktivitas',
  'Studi & Kuliah',
] as const;

export type ShowcaseCategory = (typeof SHOWCASE_CATEGORIES)[number];
