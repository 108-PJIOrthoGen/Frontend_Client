import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePjiDiagnosis,
  calculatePjiRisk,
} from './quickDiagnosisModel.ts';

test('PJI Diagnosis: sinus tract triggers INFECTED major criterion', () => {
  const result = calculatePjiDiagnosis({
    previousArthroplasty: true,
    sinusTract: true,
  });
  assert.equal(result.conclusion, 'INFECTED');
  assert.equal(result.phase, 'major');
  assert.equal(result.positiveCriteria.length, 1);
});

test('PJI Diagnosis: not applicable if no previous arthroplasty', () => {
  const result = calculatePjiDiagnosis({
    previousArthroplasty: false,
  });
  assert.equal(result.conclusion, 'NOT_APPLICABLE');
});

test('PJI Diagnosis: chronic case with high CRP, ESR and LE 2+ scores >= 6 (INFECTED)', () => {
  const result = calculatePjiDiagnosis({
    previousArthroplasty: true,
    sinusTract: false,
    culturesPerformed: true,
    cultureResult: 'negative',
    daysSinceArthroplasty: 120, // chronic
    serumTests: {
      crp: 25, // > 10 (+2)
      esr: 45, // > 30 (+1)
      dDimer: 500,
    },
    synovialTests: {
      wbc: 1500,
      pmn: 85, // > 80% (+2)
    },
    leukocyteEsterase: 'twoPlus', // (+3)
    alphaDefensin: 'notDone',
    histology: 'notDone',
    purulence: 'notDone',
  });
  assert.equal(result.preoperativeScore, 8); // 2 + 1 + 3 + 2 = 8
  assert.equal(result.conclusion, 'INFECTED');
});

test('Cross-Validation Scenario 1: ICM Infected + MicroGen Positive confirms PJI & pathogen', () => {
  const result = calculatePjiDiagnosis({
    microgenTesting: {
      detection: 'positive',
      organismName: 'Staphylococcus aureus',
      abundance: 'dominant',
      amrGenes: ['mecA_mecC'],
    },
    previousArthroplasty: true,
    sinusTract: true,
  });
  assert.equal(result.conclusion, 'INFECTED');
  assert.ok(result.genomicSynthesis != null);
  assert.equal(result.genomicSynthesis.scenario, 'ICM_INFECTED_GENOMIC_POSITIVE');
  assert.ok(result.genomicSynthesis.antimicrobialGuidance.some(g => g.includes('mecA / mecC')));
});

test('Cross-Validation Scenario 2: ICM Not Infected + MicroGen Positive warns of contamination', () => {
  const result = calculatePjiDiagnosis({
    microgenTesting: {
      detection: 'positive',
      organismName: 'Staphylococcus epidermidis',
      abundance: 'low_trace',
      amrGenes: ['none'],
    },
    previousArthroplasty: true,
    sinusTract: false,
    culturesPerformed: true,
    cultureResult: 'negative',
    daysSinceArthroplasty: 180,
    serumTests: { crp: 2, esr: 10 },
    synovialTests: { wbc: 500, pmn: 30 },
    leukocyteEsterase: 'negative',
    alphaDefensin: 'negative',
    histology: 'negative',
    purulence: 'negative',
  });
  assert.equal(result.conclusion, 'NOT_INFECTED');
  assert.ok(result.genomicSynthesis != null);
  assert.equal(result.genomicSynthesis.scenario, 'ICM_NOT_INFECTED_GENOMIC_POSITIVE');
  assert.ok(result.genomicSynthesis.summary.includes('tạp nhiễm'));
});

test('Cross-Validation Scenario 3: ICM Infected + MicroGen Negative warns of molecular false negative', () => {
  const result = calculatePjiDiagnosis({
    microgenTesting: {
      detection: 'negative',
    },
    previousArthroplasty: true,
    sinusTract: true,
  });
  assert.equal(result.conclusion, 'INFECTED');
  assert.ok(result.genomicSynthesis != null);
  assert.equal(result.genomicSynthesis.scenario, 'ICM_INFECTED_GENOMIC_NEGATIVE');
  assert.ok(result.genomicSynthesis.scenarioTitle.includes('Âm tính giả'));
  assert.ok(result.genomicSynthesis.summary.includes('KHÔNG được dùng để bác bỏ chẩn đoán PJI'));
});

test('Cross-Validation Scenario 4: ICM Not Infected + MicroGen Negative confirms aseptic loosening', () => {
  const result = calculatePjiDiagnosis({
    microgenTesting: {
      detection: 'negative',
    },
    previousArthroplasty: true,
    sinusTract: false,
    culturesPerformed: true,
    cultureResult: 'negative',
    daysSinceArthroplasty: 300,
    serumTests: { crp: 3, esr: 8 },
    synovialTests: { wbc: 400, pmn: 25 },
    leukocyteEsterase: 'negative',
    alphaDefensin: 'negative',
    histology: 'negative',
    purulence: 'negative',
  });
  assert.equal(result.conclusion, 'NOT_INFECTED');
  assert.ok(result.genomicSynthesis != null);
  assert.equal(result.genomicSynthesis.scenario, 'ICM_NOT_INFECTED_GENOMIC_NEGATIVE');
  assert.ok(result.genomicSynthesis.summary.includes('lỏng khớp vô khuẩn'));
});

test('PJI Risk Calculator calculates expected probability', () => {
  const result = calculatePjiRisk({
    bmi: 25,
    sex: 'female',
    insurance: 'commercial',
    smoker: false,
    drugAbuse: false,
    surgery: 'thaPrimary',
    priorProcedures: 'none',
    comorbidities: [],
  });
  assert.ok(result !== null);
  assert.ok(result.riskPercent > 0 && result.riskPercent < 10);
});
