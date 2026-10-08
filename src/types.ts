export type CategoryType = 'comer' | 'cafe' | 'salir' | 'paseo';

export type PriceLevel = 1 | 2 | 3;

export type RatingLevel = 1 | 2 | 3 | 4 | 5;

export type RecommendationStatus = 'publicada' | 'reportada' | 'oculta';

export interface Recommendation {
  id: string;
  name: string;
  category: CategoryType;
  zone: string;
  price: PriceLevel;
  rating: RatingLevel;
  whatToOrder: string;
  comment: string;
  authorId: string;
  authorName: string;
  status: RecommendationStatus;
  reviewCount: number;
  ratingSum: number;
  createdAt: any;
}

export interface Review {
  id: string; // Document ID is reviewer's UID
  recommendationId: string;
  authorId: string;
  authorName: string;
  rating: RatingLevel;
  comment: string;
  createdAt: any;
}

export interface SavedPlace {
  recommendationId: string;
  name: string;
  category: CategoryType;
  zone: string;
  price: PriceLevel;
  savedAt: any;
}

export interface GroupList {
  id: string;
  title: string;
  ownerId: string;
  memberIds: string[];
  createdAt: any;
}

export interface ListOption {
  id: string; // recommendationId
  name: string;
  category: CategoryType;
  zone: string;
  price: PriceLevel;
  addedBy: string;
  createdAt: any;
}

export interface ListVote {
  userId: string;
  optionId: string;
}

export type SortOrder = 'recientes' | 'calificadas';

export interface FilterState {
  zone: string;
  price: PriceLevel | 0; // 0 = cualquiera
  sortBy: SortOrder;
}

export function calculateAverageRating(item: { rating: number; ratingSum?: number; reviewCount?: number }): number {
  const sum = Number(item.rating || 0) + Number(item.ratingSum || 0);
  const count = 1 + Number(item.reviewCount || 0);
  return count > 0 ? sum / count : Number(item.rating || 0);
}

export function getTotalRatingsCount(item: { reviewCount?: number }): number {
  return 1 + Number(item.reviewCount || 0);
}
