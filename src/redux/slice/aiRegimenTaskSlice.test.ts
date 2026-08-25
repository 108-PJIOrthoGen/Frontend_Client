import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import reducer, {
  addOrUpdateTask,
  completeTask,
  type IAiRegimenTask,
} from './aiRegimenTaskSlice.ts';

const task = (id: string, episodeId: number): IAiRegimenTask => ({
  id,
  episodeId,
  patientName: 'Test patient',
  recommendationScope: 'SURGERY',
  status: 'PROCESSING',
  startedAt: 1,
});

describe('aiRegimenTaskSlice run identity', () => {
  it('keeps concurrent runs from the same episode as separate monitor cards', () => {
    let state = reducer(undefined, { type: '@@init' });
    state = reducer(state, addOrUpdateTask(task('run-1', 42)));
    state = reducer(state, addOrUpdateTask(task('run-2', 42)));

    assert.deepEqual(state.tasks.map((item) => item.id), ['run-2', 'run-1']);
  });

  it('clears only the completed run when sibling runs share an episode', () => {
    let state = reducer(undefined, { type: '@@init' });
    state = reducer(state, addOrUpdateTask(task('run-1', 42)));
    state = reducer(state, addOrUpdateTask(task('run-2', 42)));
    state = reducer(state, completeTask({ id: 'run-1', episodeId: 42, status: 'SUCCESS' }));

    assert.deepEqual(state.tasks.map((item) => item.id), ['run-2']);
  });
});
