import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePjiGenomicInterpretation,
  calculatePjiRisk,
  hasCompletePjiRiskInput,
  mapBackendPjiDiagnosis,
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
  it('Chỉ ánh xạ kết luận và tiêu chí do Backend trả về', () => {
    const result = mapBackendPjiDiagnosis({ itemJson: {
      scoring_system: {
        interpretation: 'INFECTED',
        decision_stage: 'MAJOR',
        preoperative_score: 0,
        combined_score: 0,
      },
      data_completeness: { is_complete: true, preoperative_complete: false, missing_evidence: [], limitations: [] },
      major_criteria: {
        major_criteria_met: true,
        items: [{ criterion: 'Đường rò thông với khớp giả', result: true, result_detail: 'Có đường rò.' }],
      },
      minor_criteria_scoring: { items: [] },
    } }, { previousArthroplasty: true, sinusTract: true, daysSinceArthroplasty: 120 });

    assert.equal(result.conclusion, 'INFECTED');
    assert.equal(result.phase, 'major');
    assert.equal(result.positiveCriteria.length, 1);
  });

  it('Giữ INCOMPLETE và danh sách bằng chứng thiếu từ Backend', () => {
    const result = mapBackendPjiDiagnosis({ itemJson: {
      scoring_system: { interpretation: 'INCOMPLETE', preoperative_score: 0, combined_score: 0 },
      data_completeness: {
        is_complete: false,
        preoperative_complete: false,
        missing_evidence: ['preoperative.Synovial PMN%'],
        limitations: [],
      },
      major_criteria: { major_criteria_met: false, items: [] },
      minor_criteria_scoring: { items: [] },
    } }, { previousArthroplasty: true });

    assert.equal(result.conclusion, 'INCOMPLETE');
    assert.equal(result.isComplete, false);
    assert.deepEqual(result.missingEvidence, ['preoperative.Synovial PMN%']);
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
