import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePjiDiagnosis,
  type PjiDiagnosisInput,
} from './quickDiagnosisModel.ts';

const completeInput = (overrides: Partial<PjiDiagnosisInput> = {}): PjiDiagnosisInput => ({
  previousArthroplasty: true,
  sinusTract: false,
  culturesPerformed: false,
  daysSinceArthroplasty: 120,
  serumTests: {},
  synovialTests: {},
  leukocyteEsterase: 'notDone',
  alphaDefensin: 'notDone',
  histology: 'notDone',
  purulence: 'notDone',
  ...overrides,
});

test('does not classify before arthroplasty eligibility is known', () => {
  const result = calculatePjiDiagnosis({ sinusTract: true });
  assert.equal(result.conclusion, 'INCOMPLETE');
  assert.equal(result.phase, 'eligibility');
});

test('stops as not applicable when there is no prior hip or knee arthroplasty', () => {
  const result = calculatePjiDiagnosis({ previousArthroplasty: false });
  assert.equal(result.conclusion, 'NOT_APPLICABLE');
});

test('either major criterion classifies PJI without requiring the point score', () => {
  assert.equal(
    calculatePjiDiagnosis(completeInput({ sinusTract: true })).conclusion,
    'INFECTED',
  );
  assert.equal(
    calculatePjiDiagnosis(completeInput({
      culturesPerformed: true,
      cultureResult: 'multipleSameOrganism',
    })).conclusion,
    'INFECTED',
  );
});

test('uses strict acute thresholds and does not count values exactly at a cutoff', () => {
  const atCutoff = calculatePjiDiagnosis(completeInput({
    daysSinceArthroplasty: 89,
    serumTests: { crp: 100, esr: 200, dDimer: 10_000 },
    synovialTests: { wbc: 10_000, pmn: 90 },
  }));
  assert.equal(atCutoff.preoperativeScore, 0);
  assert.equal(atCutoff.conclusion, 'NOT_INFECTED');

  const aboveCutoff = calculatePjiDiagnosis(completeInput({
    daysSinceArthroplasty: 89,
    serumTests: { crp: 100.01 },
    synovialTests: { wbc: 10_001, pmn: 90.1 },
  }));
  assert.equal(aboveCutoff.preoperativeScore, 7);
  assert.equal(aboveCutoff.conclusion, 'INFECTED');
});

test('uses chronic thresholds from day 90 and deduplicates WBC, LE and alpha-defensin', () => {
  const atCutoff = calculatePjiDiagnosis(completeInput({
    daysSinceArthroplasty: 90,
    serumTests: { crp: 10, dDimer: 860, esr: 30 },
    synovialTests: { wbc: 3_000, pmn: 80 },
  }));
  assert.equal(atCutoff.preoperativeScore, 0);

  const aboveCutoff = calculatePjiDiagnosis(completeInput({
    daysSinceArthroplasty: 90,
    serumTests: { crp: 10.1, dDimer: 861, esr: 30.1 },
    synovialTests: { wbc: 3_001, pmn: 80 },
    leukocyteEsterase: 'twoPlus',
    alphaDefensin: 'positive',
  }));
  assert.equal(aboveCutoff.preoperativeScore, 6);
  assert.equal(
    aboveCutoff.positiveCriteria.filter(item => item.key === 'synovialWbcLeOrAlphaDefensin').length,
    1,
  );
});

test('combines a 2–5 preoperative score with intraoperative findings', () => {
  const inconclusive = calculatePjiDiagnosis(completeInput({
    serumTests: { crp: 11 },
    histology: 'positive',
  }));
  assert.equal(inconclusive.preoperativeScore, 2);
  assert.equal(inconclusive.combinedScore, 5);
  assert.equal(inconclusive.conclusion, 'INCONCLUSIVE');

  const infected = calculatePjiDiagnosis(completeInput({
    serumTests: { crp: 11 },
    histology: 'positive',
    purulence: 'positive',
  }));
  assert.equal(infected.combinedScore, 8);
  assert.equal(infected.conclusion, 'INFECTED');
});

test('does not automatically score cultures with different organisms', () => {
  const result = calculatePjiDiagnosis(completeInput({
    culturesPerformed: true,
    cultureResult: 'multipleDifferentOrganisms',
  }));
  assert.equal(result.conclusion, 'NOT_INFECTED');
  assert.equal(result.positiveCriteria.length, 0);
  assert.equal(result.cautions.length, 1);
});

test('does not issue a final classification while a required question is unanswered', () => {
  const input = completeInput();
  delete input.histology;
  assert.equal(calculatePjiDiagnosis(input).conclusion, 'INCOMPLETE');
});
