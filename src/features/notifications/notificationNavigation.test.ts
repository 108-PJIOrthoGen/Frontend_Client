import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRecommendationRunLink } from './notificationNavigation.ts';

describe('buildRecommendationRunLink', () => {
  it('opens surgery runs in the doctor workflow', () => {
    assert.equal(
      buildRecommendationRunLink({ runId: 11, episodeId: 22, recommendationScope: 'SURGERY' }),
      '/?runId=11&episodeId=22',
    );
  });

  it('opens antibiotic runs in the pharmacist workflow', () => {
    assert.equal(
      buildRecommendationRunLink({ runId: 11, episodeId: 22, recommendationScope: 'ANTIBIOTIC' }),
      '/antibiotic-planner?runId=11&episodeId=22',
    );
  });
});
