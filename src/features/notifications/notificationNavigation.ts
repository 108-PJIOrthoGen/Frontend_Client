import type { RecommendationScope } from '@/types/backend';
import type { INotification } from '@/types/notification';

export const isAiRecommendationNotification = (notification: INotification): boolean => (
  notification.type === 'AI_RECOMMENDATION_DONE'
  || notification.type === 'AI_RECOMMENDATION_FAILED'
);

export const buildRecommendationRunLink = ({
  runId,
  episodeId,
  recommendationScope,
}: {
  runId: string | number;
  episodeId: string | number;
  recommendationScope?: RecommendationScope;
}): string => {
  const pathname = recommendationScope === 'ANTIBIOTIC'
    ? '/antibiotic-planner'
    : '/';
  const search = new URLSearchParams({
    runId: String(runId),
    episodeId: String(episodeId),
  });
  return `${pathname}?${search.toString()}`;
};
