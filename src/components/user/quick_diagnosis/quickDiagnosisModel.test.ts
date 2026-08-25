import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePjiDiagnosis,
  calculatePjiGenomicInterpretation,
  calculatePjiRisk,
  hasCompletePjiRiskInput,
  resolvePjiRiskBmi,
  type PjiRiskInput,
} from './quickDiagnosisModel.ts';

describe('PJI Risk Calculator (Tan et al. JBJS 2018 / ICM)', () => {
  it('Tính BMI tự động từ chiều cao (cm) và cân nặng (kg)', () => {
    const input: PjiRiskInput = {
      heightCm: 170,
      weightKg: 65,
      sex: 'male',
      insurance: 'commercial',
      smoker: false,
      drugAbuse: false,
      surgery: 'thaPrimary',
      priorProcedures: 'none',
      comorbidities: [],
    };

    assert.equal(hasCompletePjiRiskInput(input), true);
    assert.equal(resolvePjiRiskBmi(input), 22.49);

    const result = calculatePjiRisk(input);
    assert.ok(result);
    assert.ok(result.rawScore > 0);
    assert.ok(result.riskPercent > 0);

    const bmiContrib = result.contributions.find(c => c.key === 'bmi');
    assert.ok(bmiContrib);
    assert.equal(bmiContrib.label, 'BMI 22.49');
  });

  it('Tính đúng khi truyền trực tiếp BMI', () => {
    const input: PjiRiskInput = {
      bmi: 30,
      sex: 'female',
      insurance: 'government',
      smoker: true,
      drugAbuse: false,
      surgery: 'tkaPrimary',
      priorProcedures: 'one',
      comorbidities: ['diabetes', 'heartFailure'],
    };

    assert.equal(hasCompletePjiRiskInput(input), true);
    const result = calculatePjiRisk(input);
    assert.ok(result);

    // Kiểm tra các thành phần điểm
    const sexContrib = result.contributions.find(c => c.key === 'sex');
    assert.equal(sexContrib?.points, 0); // Nữ = 0

    const insuranceContrib = result.contributions.find(c => c.key === 'insurance');
    assert.equal(insuranceContrib?.points, 7); // Government = 7

    const smokerContrib = result.contributions.find(c => c.key === 'smoker');
    assert.equal(smokerContrib?.points, 10); // Smoker = 10

    const diabetesContrib = result.contributions.find(c => c.key === 'diabetes');
    assert.equal(diabetesContrib?.points, 19); // Diabetes = 19

    const heartFailureContrib = result.contributions.find(c => c.key === 'heartFailure');
    assert.equal(heartFailureContrib?.points, 31); // Heart Failure = 31
  });

  it('Trả về null khi chưa nhập đủ thông tin', () => {
    const input: PjiRiskInput = {
      heightCm: 170, // Thiếu weightKg và bmi
      sex: 'male',
      comorbidities: [],
    };

    assert.equal(hasCompletePjiRiskInput(input), false);
    assert.equal(calculatePjiRisk(input), null);
  });
});

describe('PJI Diagnosis Calculator (ICM 2018 Criteria)', () => {
  it('Chẩn đoán INFECTED khi có sinus tract (tiêu chuẩn Major)', () => {
    const result = calculatePjiDiagnosis({
      previousArthroplasty: true,
      sinusTract: true,
      culturesPerformed: false,
      daysSinceArthroplasty: 120,
    });

    assert.equal(result.conclusion, 'INFECTED');
    assert.equal(result.phase, 'major');
  });

  it('Chẩn đoán NOT_INFECTED khi tiền phẫu <= 1 điểm', () => {
    const result = calculatePjiDiagnosis({
      previousArthroplasty: true,
      sinusTract: false,
      culturesPerformed: true,
      cultureResult: 'negative',
      daysSinceArthroplasty: 100,
      serumTests: { crp: 2, esr: 10, dDimer: 200 },
      synovialTests: { wbc: 500, pmn: 40 },
      leukocyteEsterase: 'negative',
      alphaDefensin: 'negative',
      histology: 'negative',
      purulence: 'negative',
    });

    assert.equal(result.conclusion, 'NOT_INFECTED');
    assert.equal(result.preoperativeScore, 0);
  });
});

describe('PJI Genomic Interpretation', () => {
  it('Xử lý mẫu genomic âm tính', () => {
    const result = calculatePjiGenomicInterpretation({
      detection: 'negative',
      clinicalSuspicion: 'low_aseptic',
    });

    assert.equal(result.conclusion, 'NO_ORGANISM_DETECTED');
    assert.equal(result.isComplete, true);
  });

  it('Xử lý phát hiện mecA kháng Methicillin', () => {
    const result = calculatePjiGenomicInterpretation({
      detection: 'positive',
      organismGroup: 'typical_high_virulence',
      abundance: 'dominant',
      cultureConcordance: 'concordant_same',
      amrGenes: ['mecA_mecC'],
    });

    assert.equal(result.conclusion, 'DEFINITE_PATHOGEN');
    assert.ok(result.antimicrobialGuidance.some(g => g.includes('mecA')));
  });
});
