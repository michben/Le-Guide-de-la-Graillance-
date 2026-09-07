import { Spot } from '../types';

const RECENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Automatic "trending" score from real user activity: reviews posted in the last 14 days count
 * far more than older ones, with total review count as a tie-breaker. No manual curation — a
 * spot becomes trending purely because grailleurs are actually reviewing it right now.
 */
function trendingScore(spot: Spot, now: number): number {
  const recentReviews = spot.reviews.filter((r) => now - new Date(r.date).getTime() <= RECENT_WINDOW_MS).length;
  return recentReviews * 3 + spot.reviewCount;
}

/** Spots with at least one review, sorted by trending score (highest first). */
export function computeTrendingSpots(spots: Spot[]): Spot[] {
  const now = Date.now();
  return spots
    .filter((s) => trendingScore(s, now) > 0)
    .sort((a, b) => trendingScore(b, now) - trendingScore(a, now));
}
